import { getDb } from "@/db/client";
import { categories } from "@/db/schema";
import { GROUP_ORDER } from "@/lib/ledger";
import { bad, fail } from "@/lib/server";

export const dynamic = "force-dynamic";

/**
 * 新分类的映射。喵喵里加了新分类，这边不映射的话那笔钱
 * 不会出现在任何一张表里 —— 所以必须有个地方能补上。
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const group = String(body.group ?? "").trim();
    const detail = String(body.detail ?? "").trim();
    if (!name || !detail) return bad("分类名和 Detail 都不能为空");
    if (!(GROUP_ORDER as readonly string[]).includes(group)) return bad("Group 不合法");

    await getDb()
      .insert(categories)
      .values({ name, group, detail })
      .onConflictDoUpdate({ target: categories.name, set: { group, detail } });

    return Response.json({ name, group, detail });
  } catch (e) {
    return fail(e);
  }
}
