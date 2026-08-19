import { parseIcs } from "@/lib/ics";
import { bad, ensureSettings, fail } from "@/lib/server";
import type { CalEvent, CalendarResult } from "@/lib/types";

export const dynamic = "force-dynamic";

async function fetchOne(
  url: string,
  start: string,
  end: string,
  timeZone: string,
): Promise<CalEvent[]> {
  // Apple 给的是 webcal://，HTTP 客户端不认，换成 https
  const src = url.replace(/^webcal:\/\//i, "https://");
  const res = await fetch(src, {
    // 日历只是参考，15 分钟的陈旧度完全可以接受，省下大量往返
    next: { revalidate: 900 },
    headers: { Accept: "text/calendar" },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return parseIcs(await res.text(), start, end, timeZone);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (!start || !end) return bad("缺少 start / end");
    // 时区必须由浏览器给：服务端在 Vercel 上是 UTC，自己猜必错
    const timeZone = url.searchParams.get("tz") || "UTC";

    const settings = await ensureSettings();
    const urls = (settings.icsUrls ?? "").split("\n").map((u) => u.trim()).filter(Boolean);
    if (!urls.length) {
      return Response.json({ events: [], ok: 0, total: 0 } satisfies CalendarResult);
    }

    // 一个源挂掉不该拖垮其他源
    const results = await Promise.allSettled(
      urls.map((u) => fetchOne(u, start, end, timeZone)),
    );

    const events: CalEvent[] = [];
    let ok = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        ok++;
        events.push(...r.value);
      } else {
        console.error("[calendar] 拉取失败:", r.reason);
      }
    }

    events.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? "").localeCompare(b.time ?? "") ||
        a.title.localeCompare(b.title),
    );

    return Response.json({ events, ok, total: urls.length } satisfies CalendarResult);
  } catch (e) {
    return fail(e);
  }
}
