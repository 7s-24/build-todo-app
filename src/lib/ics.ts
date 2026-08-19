import ICAL from "ical.js";
import type { CalEvent, ISODate } from "./types";

const MAX_OCCURRENCES = 400;
const MAX_SPAN_DAYS = 90;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nextDay(iso: ISODate): ISODate {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

function prevDay(iso: ISODate): ISODate {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

/** 全天事件是「浮动」的，不带时区，原样取年月日 */
function floating(t: ICAL.Time): ISODate {
  return `${t.year}-${pad(t.month)}-${pad(t.day)}`;
}

interface Wall {
  date: ISODate;
  time: string;
}

/**
 * 把一个绝对时刻换算成目标时区的墙上时间。
 * 事件的 TZID 五花八门（同一份日历里可能既有东京也有上海），
 * 服务端自己的时区更是靠不住（Vercel 上是 UTC），
 * 所以一律先取绝对时刻，再按用户时区格式化。
 */
function wallClock(t: ICAL.Time, fmt: Intl.DateTimeFormat): Wall {
  const parts = fmt.formatToParts(t.toJSDate());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** 跨天事件铺到每一天，这样月视图每格都能拿到自己那份 */
function spread(
  first: ISODate,
  last: ISODate,
  title: string,
  allDay: boolean,
  time: string | null,
  range: { start: ISODate; end: ISODate },
  shared: boolean,
  out: CalEvent[],
) {
  let cur = first;
  for (let i = 0; i < MAX_SPAN_DAYS; i++) {
    if (cur > range.end) break;
    if (cur >= range.start) {
      out.push({ date: cur, title, allDay, time: i === 0 ? time : null, shared });
    }
    if (cur >= last) break;
    cur = nextDay(cur);
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
  timeZone: string,
  shared = false,
): CalEvent[] {
  const comp = new ICAL.Component(ICAL.parse(text));

  // 不先注册 VTIMEZONE，ical.js 解不出 TZID，会退化成服务端本地时间
  for (const vt of comp.getAllSubcomponents("vtimezone")) {
    const zone = new ICAL.Timezone(vt);
    if (zone.tzid && !ICAL.TimezoneService.has(zone.tzid)) {
      ICAL.TimezoneService.register(zone);
    }
  }

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const out: CalEvent[] = [];
  const range = { start, end };
  const rangeStart = ICAL.Time.fromDateString(start);
  const rangeEnd = ICAL.Time.fromDateString(end);

  const emit = (from: ICAL.Time, to: ICAL.Time, title: string, allDay: boolean) => {
    if (allDay) {
      // 全天事件的 DTEND 是排他的，回退一天避免多画一格
      const first = floating(from);
      let last = floating(to);
      if (last > first) last = prevDay(last);
      spread(first, last, title, true, null, range, shared, out);
      return;
    }
    const a = wallClock(from, fmt);
    const b = wallClock(to, fmt);
    // 正好停在 00:00 的跨天事件，最后一天是空的，不画
    const last = b.date > a.date && b.time === "00:00" ? prevDay(b.date) : b.date;
    spread(a.date, last < a.date ? a.date : last, title, false, a.time, range, shared, out);
  };

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
        emit(occ.startDate, occ.endDate, title, allDay);
      }
    } else {
      if (event.endDate.compare(rangeStart) < 0) continue;
      if (event.startDate.compare(rangeEnd) > 0) continue;
      emit(event.startDate, event.endDate, title, allDay);
    }
  }

  out.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""),
  );
  return out;
}
