import { parseIcs } from "@/lib/ics";
import { bad, ensureSettings, fail } from "@/lib/server";
import type { CalEvent, CalendarResult, FeedStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseList(raw: string | null): string[] {
  return (raw ?? "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
}

async function fetchOne(
  url: string,
  start: string,
  end: string,
  timeZone: string,
  shared: boolean,
): Promise<CalEvent[]> {
  // Apple 给的是 webcal://，HTTP 客户端不认，换成 https。
  // Google 的 basic.ics 本来就是 https，原样通过。
  const src = url.replace(/^webcal:\/\//i, "https://");
  const res = await fetch(src, {
    // 日历只是参考，15 分钟的陈旧度完全可以接受，省下大量往返
    next: { revalidate: 900 },
    headers: { Accept: "text/calendar" },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return parseIcs(await res.text(), start, end, timeZone, shared);
}

/** 一个源挂掉不该拖垮其他源 */
async function fetchGroup(
  urls: string[],
  start: string,
  end: string,
  timeZone: string,
  shared: boolean,
  out: CalEvent[],
): Promise<FeedStatus> {
  const results = await Promise.allSettled(
    urls.map((u) => fetchOne(u, start, end, timeZone, shared)),
  );
  let ok = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      ok++;
      out.push(...r.value);
    } else {
      console.error(`[calendar] ${shared ? "他人" : "自己"}日历拉取失败:`, r.reason);
    }
  }
  return { ok, total: urls.length };
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
    const events: CalEvent[] = [];

    // 两组都拉、都带标记，显示与否交给前端的两个开关 ——
    // 这样开关是即时的，而且藏起来时也能在设置面板看到源还通不通
    const [own, shared] = await Promise.all([
      fetchGroup(parseList(settings.icsUrls), start, end, timeZone, false, events),
      fetchGroup(parseList(settings.sharedUrls), start, end, timeZone, true, events),
    ]);

    events.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? "").localeCompare(b.time ?? "") ||
        a.title.localeCompare(b.title),
    );

    return Response.json({ events, own, shared } satisfies CalendarResult);
  } catch (e) {
    return fail(e);
  }
}
