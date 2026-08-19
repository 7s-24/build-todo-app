import { addDays, format, parseISO } from "date-fns";

export type ISODate = string; // YYYY-MM-DD

export function toISO(d: Date): ISODate {
  return format(d, "yyyy-MM-dd");
}

export function fromISO(s: ISODate): Date {
  return parseISO(s);
}

export function shift(s: ISODate, days: number): ISODate {
  return toISO(addDays(fromISO(s), days));
}

/** 本地时区的今天，绝不用 UTC —— 服务端时区和用户时区可能不同 */
export function todayLocal(): ISODate {
  return toISO(new Date());
}

/**
 * 生成月视图网格：整周对齐，周一起始，始终 6 行 42 格。
 * 固定 6 行是为了切换月份时格子高度不跳动。
 */
export function monthGrid(year: number, month: number): ISODate[] {
  const first = new Date(year, month, 1);
  const weekday = (first.getDay() + 6) % 7; // 周一 = 0
  const start = addDays(first, -weekday);
  return Array.from({ length: 42 }, (_, i) => toISO(addDays(start, i)));
}
