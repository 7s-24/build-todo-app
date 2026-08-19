import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { settings } from "@/db/schema";
import { bad, ensureSettings, fail } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await ensureSettings());
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureSettings();
    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (Number.isFinite(body.dailyLimit)) {
      patch.dailyLimit = Math.min(50, Math.max(1, Math.round(body.dailyLimit)));
    }
    if (typeof body.showCalendar === "boolean") patch.showCalendar = body.showCalendar;
    if (typeof body.theme === "string" && body.theme) patch.theme = body.theme;
    if (typeof body.icsUrls === "string") {
      // 逐行清洗，顺手去掉空行和重复
      const list = [...new Set(
        body.icsUrls
          .split("\n")
          .map((u: string) => u.trim())
          .filter(Boolean),
      )];
      patch.icsUrls = list.length ? list.join("\n") : null;
    }
    if (!Object.keys(patch).length) return bad("没有可更新的字段");

    const [row] = await getDb()
      .update(settings)
      .set(patch)
      .where(eq(settings.id, 1))
      .returning();

    return Response.json({
      dailyLimit: row.dailyLimit,
      icsUrls: row.icsUrls,
      showCalendar: row.showCalendar,
      theme: row.theme,
    });
  } catch (e) {
    return fail(e);
  }
}
