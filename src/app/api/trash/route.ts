import { desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projects, tasks } from "@/db/schema";
import { bad, fail } from "@/lib/server";

export const dynamic = "force-dynamic";

const LIMIT = 50;

export interface TrashItem {
  kind: "task" | "project";
  id: number;
  title: string;
  /** 任务是它原本排在哪天，项目是它属于哪一组 */
  meta: string;
  deletedAt: string;
}

/** 回收站：最近删掉的东西，还能捞回来 */
export async function GET() {
  try {
    const db = getDb();
    const [t, p] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(isNotNull(tasks.deletedAt))
        .orderBy(desc(tasks.deletedAt))
        .limit(LIMIT),
      db
        .select()
        .from(projects)
        .where(isNotNull(projects.deletedAt))
        .orderBy(desc(projects.deletedAt))
        .limit(LIMIT),
    ]);

    const items: TrashItem[] = [
      ...t.map((r) => ({
        kind: "task" as const,
        id: r.id,
        title: r.title,
        meta: r.date,
        deletedAt: r.deletedAt!.toISOString(),
      })),
      ...p.map((r) => ({
        kind: "project" as const,
        id: r.id,
        title: r.title,
        meta: r.kind,
        deletedAt: r.deletedAt!.toISOString(),
      })),
    ]
      .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
      .slice(0, LIMIT);

    return Response.json({ items });
  } catch (e) {
    return fail(e);
  }
}

/** 捞回来 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isFinite(id)) return bad("非法 id");

    const db = getDb();
    if (body.kind === "task") {
      await db.update(tasks).set({ deletedAt: null }).where(eq(tasks.id, id));
    } else if (body.kind === "project") {
      await db.update(projects).set({ deletedAt: null }).where(eq(projects.id, id));
    } else {
      return bad("kind 必须是 task 或 project");
    }
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
