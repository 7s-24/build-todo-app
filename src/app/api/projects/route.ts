import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projects } from "@/db/schema";
import { bad, fail, isKind, projectDTO } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getDb()
      .select()
      .from(projects)
      .orderBy(asc(projects.position), asc(projects.id));
    return Response.json({ projects: rows.map(projectDTO) });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) return bad("项目名为空");
    const kind = isKind(body.kind) ? body.kind : "idea";

    const [row] = await getDb()
      .insert(projects)
      .values({ title, kind, position: Date.now() % 100000 })
      .returning();
    return Response.json(projectDTO(row));
  } catch (e) {
    return fail(e);
  }
}
