import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tasks } from "@/db/schema";
import { bad, fail, toDTO } from "@/lib/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id)) return bad("非法 id");

    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (typeof body.done === "boolean") {
      patch.done = body.done;
      patch.doneAt = body.done ? new Date() : null;
    }
    if (typeof body.title === "string" && body.title.trim()) {
      patch.title = body.title.trim();
    }
    if (typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      patch.date = body.date;
    }
    if ([1, 2, 3].includes(body.priority)) patch.priority = body.priority;
    if (!Object.keys(patch).length) return bad("没有可更新的字段");

    const [row] = await getDb()
      .update(tasks)
      .set(patch)
      .where(eq(tasks.id, id))
      .returning();
    if (!row) return bad("任务不存在", 404);
    return Response.json(toDTO(row));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id)) return bad("非法 id");
    await getDb().delete(tasks).where(eq(tasks.id, id));
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
