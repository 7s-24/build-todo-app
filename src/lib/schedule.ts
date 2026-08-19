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
}

const HORIZON = 365;

/**
 * 自动排期。规则刻意保持可预测，用户看一眼就能推出结果：
 *
 *   1 最急 —— 落今天，无视每日上限；今天若锁定则顺延到最近的未锁定日。
 *   2 普通 —— 从今天起，第一个「未锁定 且 未满」的日子。
 *   3 可缓 —— 从明天起，第一个「未锁定 且 未满」的日子，不占今天的名额。
 *
 * 整个 horizon 内都排不下时，退回到最近的未锁定日并允许超限 ——
 * 宁可超限，也不能把任务吞掉。
 */
export function pickDate(input: SlotInput): ISODate {
  const { priority, from, dailyLimit, counts, locked } = input;

  const isFull = (d: ISODate) => (counts[d] ?? 0) >= dailyLimit;

  if (priority === 1) {
    return firstUnlocked(from, locked) ?? from;
  }

  const start = priority === 3 ? shift(from, 1) : from;
  for (let i = 0; i < HORIZON; i++) {
    const d = shift(start, i);
    if (!locked.has(d) && !isFull(d)) return d;
  }
  return firstUnlocked(from, locked) ?? from;
}

function firstUnlocked(from: ISODate, locked: Set<string>): ISODate | null {
  for (let i = 0; i < HORIZON; i++) {
    const d = shift(from, i);
    if (!locked.has(d)) return d;
  }
  return null;
}
