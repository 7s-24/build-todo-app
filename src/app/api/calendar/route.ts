import { parseIcs } from "@/lib/ics";
import { bad, ensureSettings, fail } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (!start || !end) return bad("缺少 start / end");

    const settings = await ensureSettings();
    if (!settings.icsUrl) return Response.json({ events: [] });

    // Apple 给的是 webcal://，HTTP 客户端不认，换成 https
    const src = settings.icsUrl.replace(/^webcal:\/\//i, "https://");
    const res = await fetch(src, {
      // 日历只是参考，15 分钟的陈旧度完全可以接受，省下大量往返
      next: { revalidate: 900 },
      headers: { Accept: "text/calendar" },
    });
    if (!res.ok) return bad(`拉取日历失败：${res.status}`, 502);

    const events = parseIcs(await res.text(), start, end);
    return Response.json({ events });
  } catch (e) {
    return fail(e);
  }
}
