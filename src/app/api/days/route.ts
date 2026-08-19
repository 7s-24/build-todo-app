import { getDb } from "@/db/client";
import { days } from "@/db/schema";
import { bad, fail } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const date = String(body.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("非法日期");
    const locked = Boolean(body.locked);

    await getDb()
      .insert(days)
      .values({ date, locked })
      .onConflictDoUpdate({ target: days.date, set: { locked } });

    return Response.json({ date, locked });
  } catch (e) {
    return fail(e);
  }
}
