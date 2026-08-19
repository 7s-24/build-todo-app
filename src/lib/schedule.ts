import type { ISODate } from "./date";
import { shift } from "./date";

export type Priority = 1 | 2 | 3;

export interface SlotInput {
  priority: Priority;
  from: ISODate; // 用户本地的今天
  dailyLimit: number;
  /** date -> 该日已有的未完成任务数 */
  counts: Record<string, number>;
  /** 被锁定的日期集合 */
  locked: Set<string>;
  /** 最晚完成日期。排期绝不越过它 */
  due?: ISODate | null;
}

const HORIZON = 365;

/**
 * 自动排期。规则刻意保持可预测，用户看一眼就能推出结果：
 *
 *   1 最急 —— 落今天，无视每日上限；今天若锁定则顺延到最近的未锁定日。
 *   2 普通 —— 从今天起，第一个「未锁定 且 未满」的日子。
 *   3 可缓 —— 从明天起，第一个「未锁定 且 未满」的日子，不占今天的名额。
 *
 * 有最晚完成日期时，它是一条硬上限：排期绝不越过它。窗口内找不到空位
 * 就直接排在截止日当天并允许超限 —— 排到截止日之后的话，任务一落地
 * 就会被标成「晚了」，那是自相矛盾的。
 *
 * 没有截止日而 horizon 内又都排不下时，退回到最近的未锁定日并允许超限 ——
 * 宁可超限，也不能把任务吞掉。
 */
export function pickDate(input: SlotInput): ISODate {
  const { priority, from, dailyLimit, counts, locked, due } = input;

  const isFull = (d: ISODate) => (counts[d] ?? 0) >= dailyLimit;

  if (priority === 1) {
    return firstUnlocked(from, locked) ?? from;
  }

  const start = priority === 3 ? shift(from, 1) : from;
  for (let i = 0; i < HORIZON; i++) {
    const d = shift(start, i);
    if (due && d > due) break; // 不能排到截止日之后
    if (!locked.has(d) && !isFull(d)) return d;
  }

  // 截止日之前没位置了：钉在截止日当天；截止日已经过去就放今天
  if (due) return due >= from ? due : from;

  return firstUnlocked(from, locked) ?? from;
}

function firstUnlocked(from: ISODate, locked: Set<string>): ISODate | null {
  for (let i = 0; i < HORIZON; i++) {
    const d = shift(from, i);
    if (!locked.has(d)) return d;
  }
  return null;
}
