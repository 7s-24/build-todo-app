import { getDb } from "@/db/client";
import { tasks } from "@/db/schema";
import { pickDate } from "@/lib/schedule";
import {
  bad,
  ensureSettings,
  fail,
  lockedFrom,
  openCountsFrom,
  toDTO,
} from "@/lib/server";
import type { Priority } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) return bad("任务内容为空");

    const priority = ([1, 2, 3].includes(body.priority) ? body.priority : 2) as Priority;
    const today = String(body.today ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return bad("缺少 today");

    let date: string = body.date ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // 没指定日期 —— 按紧急程度自动落位
      const [settings, locked, counts] = await Promise.all([
        ensureSettings(),
        lockedFrom(today),
        openCountsFrom(today),
      ]);
      date = pickDate({
        priority,
        from: today,
        dailyLimit: settings.dailyLimit,
        counts,
        locked,
      });
    }

    const [row] = await getDb()
      .insert(tasks)
      .values({ title, date, priority, position: Date.now() % 100000 })
      .returning();

    return Response.json(toDTO(row));
  } catch (e) {
    return fail(e);
  }
}
