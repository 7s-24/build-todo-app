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
    if (typeof body.showShared === "boolean") patch.showShared = body.showShared;
    if (typeof body.theme === "string" && body.theme) patch.theme = body.theme;
    // 逐行清洗，顺手去掉空行和重复
    const clean = (raw: string) => {
      const list = [
        ...new Set(
          raw
            .split("\n")
            .map((u: string) => u.trim())
            .filter(Boolean),
        ),
      ];
      return list.length ? list.join("\n") : null;
    };
    if (typeof body.icsUrls === "string") patch.icsUrls = clean(body.icsUrls);
    if (typeof body.sharedUrls === "string") patch.sharedUrls = clean(body.sharedUrls);
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
      sharedUrls: row.sharedUrls,
      showShared: row.showShared,
      theme: row.theme,
    });
  } catch (e) {
    return fail(e);
  }
}
