import { and, asc, gte, isNull, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tasks } from "@/db/schema";
import { bad, ensureSettings, fail, lockedBetween, toDTO } from "@/lib/server";
import type { StateDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (!start || !end) return bad("缺少 start / end");

    const db = getDb();
    const [rows, locked, settings] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(gte(tasks.date, start), lte(tasks.date, end), isNull(tasks.deletedAt)))
        .orderBy(asc(tasks.date), asc(tasks.priority), asc(tasks.position), asc(tasks.id)),
      lockedBetween(start, end),
      ensureSettings(),
    ]);

    const payload: StateDTO = { tasks: rows.map(toDTO), locked, settings };
    return Response.json(payload);
  } catch (e) {
    return fail(e);
  }
}
