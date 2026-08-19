import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tasks } from "@/db/schema";
import { bad, fail } from "@/lib/server";

export const dynamic = "force-dynamic";

/**
 * 把过期未完成的任务顺延。
 *
 * 规则原话是「当日任务没完成就移到下一天」——每天反复应用，
 * 它的不动点就是「全部落到今天」：隔了三天没开电脑，
 * 一天一天推也还是推到今天，所以直接一次推到位，结果一样。
 *
 * 已完成的不动，它们是当天的记录。
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const today = String(body.today ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return bad("缺少 today");

    const moved = await getDb()
      .update(tasks)
      .set({ date: today })
      .where(and(lt(tasks.date, today), eq(tasks.done, false)))
      .returning({ id: tasks.id });

    return Response.json({ moved: moved.length });
  } catch (e) {
    return fail(e);
  }
}
