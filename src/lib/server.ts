import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { days, projects, settings, tasks } from "@/db/schema";
import type { Priority, ProjectDTO, ProjectKind, SettingsDTO, TaskDTO } from "./types";

const KINDS: ProjectKind[] = ["funded", "personal", "idea"];

export function isKind(v: unknown): v is ProjectKind {
  return typeof v === "string" && KINDS.includes(v as ProjectKind);
}

export function projectDTO(row: typeof projects.$inferSelect): ProjectDTO {
  return {
    id: row.id,
    title: row.title,
    kind: isKind(row.kind) ? row.kind : "idea",
    position: row.position,
  };
}

export function toDTO(row: typeof tasks.$inferSelect): TaskDTO {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    due: row.dueDate,
    priority: (row.priority as Priority) ?? 2,
    done: row.done,
    position: row.position,
  };
}

/** settings 表永远只有 id=1；第一次访问时建出来 */
export async function ensureSettings(): Promise<SettingsDTO> {
  const db = getDb();
  const found = await db.select().from(settings).where(eq(settings.id, 1));
  if (found.length) {
    const s = found[0];
    return {
      dailyLimit: s.dailyLimit,
      icsUrls: s.icsUrls,
      showCalendar: s.showCalendar,
      sharedUrls: s.sharedUrls,
      showShared: s.showShared,
      theme: s.theme,
    };
  }
  const [created] = await db.insert(settings).values({ id: 1 }).returning();
  return {
    dailyLimit: created.dailyLimit,
    icsUrls: created.icsUrls,
    showCalendar: created.showCalendar,
    sharedUrls: created.sharedUrls,
    showShared: created.showShared,
    theme: created.theme,
  };
}

export async function lockedBetween(start: string, end: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(days)
    .where(and(gte(days.date, start), lte(days.date, end), eq(days.locked, true)));
  return rows.map((r) => r.date);
}

/** 排期要看未来所有锁定日，不止当前月视图窗口 */
export async function lockedFrom(start: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(days)
    .where(and(gte(days.date, start), eq(days.locked, true)));
  return new Set(rows.map((r) => r.date));
}

/** 上限只数未完成的任务 —— 做完的不该继续占位 */
export async function openCountsFrom(start: string) {
  const db = getDb();
  const rows = await db
    .select({ date: tasks.date })
    .from(tasks)
    .where(and(gte(tasks.date, start), eq(tasks.done, false), isNull(tasks.deletedAt)));
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.date] = (counts[r.date] ?? 0) + 1;
  return counts;
}

export function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function fail(e: unknown) {
  const message = e instanceof Error ? e.message : "未知错误";
  return Response.json({ error: message }, { status: 500 });
}
