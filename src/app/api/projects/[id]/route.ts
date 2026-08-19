import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projects } from "@/db/schema";
import { bad, fail, isKind, projectDTO } from "@/lib/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id)) return bad("非法 id");

    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim()) {
      patch.title = body.title.trim();
    }
    if (isKind(body.kind)) patch.kind = body.kind;
    if (!Object.keys(patch).length) return bad("没有可更新的字段");

    const [row] = await getDb()
      .update(projects)
      .set(patch)
      .where(eq(projects.id, id))
      .returning();
    if (!row) return bad("项目不存在", 404);
    return Response.json(projectDTO(row));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id)) return bad("非法 id");
    // 不真删 —— 打上时间戳进回收站
    await getDb()
      .update(projects)
      .set({ deletedAt: new Date() })
      .where(eq(projects.id, id));
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
