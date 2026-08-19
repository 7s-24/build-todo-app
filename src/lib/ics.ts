import ICAL from "ical.js";
import type { CalEvent, ISODate } from "./types";

const MAX_OCCURRENCES = 400;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoOf(t: ICAL.Time): ISODate {
  return `${t.year}-${pad(t.month)}-${pad(t.day)}`;
}

function timeOf(t: ICAL.Time, allDay: boolean): string | null {
  return allDay ? null : `${pad(t.hour)}:${pad(t.minute)}`;
}

/** 跨天事件铺到每一天，这样月视图每格都能拿到自己那份 */
function spread(
  start: ICAL.Time,
  end: ICAL.Time,
  title: string,
  allDay: boolean,
  range: { start: ISODate; end: ISODate },
  out: CalEvent[],
) {
  const cur = start.clone();
  // 全天事件的 DTEND 是排他的，回退一天避免多画一格
  const last = end.clone();
  if (allDay) last.day -= 1;

  for (let i = 0; i < 90; i++) {
    const iso = isoOf(cur);
    if (iso > range.end) break;
    if (iso >= range.start) {
      out.push({ date: iso, title, allDay, time: i === 0 ? timeOf(start, allDay) : null });
    }
    if (isoOf(cur) >= isoOf(last)) break;
    cur.day += 1;
  }
}

/**
 * 解析 .ics 文本，展开落在 [start, end] 窗口内的事件（含重复事件）。
 * 只读用途 —— 我们从不写回 Apple 日历。
 */
export function parseIcs(
  text: string,
  start: ISODate,
  end: ISODate,
): CalEvent[] {
  const comp = new ICAL.Component(ICAL.parse(text));
  const out: CalEvent[] = [];
  const rangeEnd = ICAL.Time.fromDateString(end);
  const rangeStart = ICAL.Time.fromDateString(start);

  for (const ve of comp.getAllSubcomponents("vevent")) {
    let event: ICAL.Event;
    try {
      event = new ICAL.Event(ve);
    } catch {
      continue;
    }
    if (event.isRecurrenceException()) continue;

    const title = event.summary?.trim() || "";
    if (!title) continue;
    const allDay = event.startDate.isDate;

    if (event.isRecurring()) {
      const it = event.iterator();
      let next: ICAL.Time | null;
      let n = 0;
      while ((next = it.next()) && n++ < MAX_OCCURRENCES) {
        if (next.compare(rangeEnd) > 0) break;
        const occ = event.getOccurrenceDetails(next);
        if (occ.endDate.compare(rangeStart) < 0) continue;
        spread(occ.startDate, occ.endDate, title, allDay, { start, end }, out);
      }
    } else {
      if (event.endDate.compare(rangeStart) < 0) continue;
      if (event.startDate.compare(rangeEnd) > 0) continue;
      spread(event.startDate, event.endDate, title, allDay, { start, end }, out);
    }
  }

  out.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));
  return out;
}
