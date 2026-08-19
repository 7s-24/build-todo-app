import { buildNetWorth, buildYear } from "@/lib/ledger";
import { loadLedger } from "@/lib/ledgerServer";
import { fail } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const data = await loadLedger();
    const years = [
      ...new Set(data.txns.map((t) => Number(t.occurredAt.slice(0, 4)))),
    ].sort();

    const asked = Number(new URL(req.url).searchParams.get("year"));
    const year = years.includes(asked) ? asked : (years.at(-1) ?? new Date().getFullYear());

    const report = buildYear(data.txns, data.cats, data.rates, year);
    report.overview = report.overview.map((o) => ({
      ...o,
      target:
        o.group === "Needs"
          ? data.targets.needs
          : o.group === "Wants"
            ? data.targets.wants
            : o.group === "Investment"
              ? data.targets.investment
              : null,
    }));

    return Response.json({
      years,
      report,
      netWorth: buildNetWorth(
        data.txns,
        data.cats,
        data.rates,
        data.start.bank,
        data.start.investment,
      ),
      rates: data.rates,
      unmapped: data.unmapped,
      count: data.txns.length,
    });
  } catch (e) {
    return fail(e);
  }
}
