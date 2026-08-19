import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { txns } from "@/db/schema";
import { normalizeStamp, parseAmount, parseCsv } from "@/lib/csv";
import { loadLedger } from "@/lib/ledgerServer";
import { bad, fail } from "@/lib/server";

export const dynamic = "force-dynamic";

const WANTED = ["分类", "时间", "金额", "货币", "备注"] as const;

/**
 * 接喵喵记账导出的 CSV。录入仍然在喵喵里做，这边只做分析层。
 *
 * 导出区间会重叠，所以整件事必须是幂等的：去重靠 transactions 上
 * (分类, 时间, 金额, 货币, 备注) 的唯一索引，重复的直接跳过。
 */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text.trim()) return bad("文件是空的");

    const rows = parseCsv(text);
    if (rows.length < 2) return bad("没有数据行");

    const header = rows[0].map((h) => h.trim());
    const idx: Record<string, number> = {};
    for (const key of WANTED) idx[key] = header.indexOf(key);
    const missing = WANTED.filter((k) => idx[k] === -1 && k !== "备注");
    if (missing.length) {
      return bad(`表头缺少列：${missing.join("、")}。实际表头：${header.join(",")}`);
    }

    const values: {
      category: string;
      occurredAt: string;
      amount: string;
      currency: string;
      note: string | null;
    }[] = [];
    const badRows: number[] = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const category = (r[idx["分类"]] ?? "").trim();
      const when = normalizeStamp(r[idx["时间"]] ?? "");
      const amount = parseAmount(r[idx["金额"]] ?? "");
      if (!category || !when || amount === null) {
        badRows.push(i + 1);
        continue;
      }
      const note = idx["备注"] === -1 ? "" : (r[idx["备注"]] ?? "").trim();
      values.push({
        category,
        occurredAt: when,
        amount: amount.toFixed(2),
        currency: (r[idx["货币"]] ?? "").trim() || "日元",
        note: note || null,
      });
    }

    if (!values.length) return bad("没有一行能解析成功");

    const db = getDb();
    let added = 0;
    const BATCH = 200;
    for (let i = 0; i < values.length; i += BATCH) {
      const chunk = values.slice(i, i + BATCH);
      const inserted = await db
        .insert(txns)
        .values(
          chunk.map((v) => ({
            category: v.category,
            occurredAt: sql`${v.occurredAt}::timestamp`,
            amount: v.amount,
            currency: v.currency,
            note: v.note,
          })),
        )
        .onConflictDoNothing()
        .returning({ id: txns.id });
      added += inserted.length;
    }

    // 新分类必须报出来 —— 没映射的钱不会出现在任何一张表里
    const after = await loadLedger();

    return Response.json({
      parsed: values.length,
      added,
      skipped: values.length - added,
      badRows: badRows.slice(0, 20),
      unmapped: after.unmapped,
      total: after.txns.length,
    });
  } catch (e) {
    return fail(e);
  }
}
