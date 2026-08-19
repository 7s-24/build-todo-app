import { asc, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories, fxRates, ledgerSettings, txns } from "@/db/schema";
import type { CategoryMap, Group, RawTxn } from "./ledger";

export interface LedgerData {
  txns: RawTxn[];
  cats: CategoryMap;
  rates: Record<string, number>;
  targets: { needs: number; wants: number; investment: number };
  start: { bank: number; investment: number };
  /** 出现在流水里但没有映射的分类 —— 必须报出来，不能悄悄漏掉 */
  unmapped: string[];
}

export async function loadLedger(): Promise<LedgerData> {
  const db = getDb();
  const [rows, catRows, rateRows, settingsRows] = await Promise.all([
    // 时间戳直接在 SQL 里格成文本。
    // 让驱动还原成 Date 就得挑「按本地还是按 UTC 取值」，
    // 两种在我机器（JST）和 Vercel（UTC）上给的答案还不一样 ——
    // 墙上时间从头到尾不经过 Date，就没有这个问题。
    db
      .select({
        category: txns.category,
        occurredAt: sql<string>`to_char(${txns.occurredAt}, 'YYYY-MM-DD HH24:MI:SS')`,
        amount: txns.amount,
        currency: txns.currency,
        note: txns.note,
      })
      .from(txns)
      .orderBy(asc(txns.occurredAt)),
    db.select().from(categories).orderBy(asc(categories.position)),
    db.select().from(fxRates),
    db.select().from(ledgerSettings),
  ]);

  const cats: CategoryMap = {};
  for (const c of catRows) {
    cats[c.name] = { group: c.group as Group, detail: c.detail };
  }

  const rates: Record<string, number> = {};
  for (const r of rateRows) rates[r.currency] = Number(r.rate);

  const s = settingsRows[0];
  const list: RawTxn[] = rows.map((t) => ({
    category: t.category,
    occurredAt: t.occurredAt,
    amount: Number(t.amount),
    currency: t.currency,
    note: t.note,
  }));

  const unmapped = [...new Set(list.filter((t) => !cats[t.category]).map((t) => t.category))];

  return {
    txns: list,
    cats,
    rates,
    targets: {
      needs: s ? Number(s.needsTarget) : 0.6,
      wants: s ? Number(s.wantsTarget) : 0.1,
      investment: s ? Number(s.investmentTarget) : 0.3,
    },
    start: {
      bank: s ? Number(s.startBank) : 0,
      investment: s ? Number(s.startInvestment) : 0,
    },
    unmapped,
  };
}
