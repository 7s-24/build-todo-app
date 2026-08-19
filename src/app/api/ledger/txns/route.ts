import { toJpy } from "@/lib/ledger";
import { loadLedger } from "@/lib/ledgerServer";
import { bad, fail } from "@/lib/server";

export const dynamic = "force-dynamic";

/**
 * 某一格背后的流水。
 *
 * 透视表里的每个数字都是一堆交易加出来的，点开要能看见是哪几笔 ——
 * 数字对不上的时候，这是唯一能查下去的地方。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month"); // YYYY-MM
    const detail = url.searchParams.get("detail");
    const group = url.searchParams.get("group");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return bad("缺少 month");
    if (!detail && !group) return bad("要么给 detail，要么给 group");

    const data = await loadLedger();
    const rows = data.txns
      .filter((t) => {
        if (t.occurredAt.slice(0, 7) !== month) return false;
        const map = data.cats[t.category];
        if (!map) return false;
        return detail ? map.detail === detail : map.group === group;
      })
      .map((t) => ({
        occurredAt: t.occurredAt,
        category: t.category,
        detail: data.cats[t.category].detail,
        note: t.note,
        amount: t.amount,
        currency: t.currency,
        jpy: toJpy(t, data.rates),
      }))
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

    return Response.json({
      month,
      label: detail ?? group,
      rows,
      total: rows.reduce((s, r) => s + r.jpy, 0),
    });
  } catch (e) {
    return fail(e);
  }
}
