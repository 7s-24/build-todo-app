"use client";

import Hint from "./Hint";
import Spark from "./Spark";
import { useT } from "@/lib/i18n";
import type { Analysis as A } from "@/lib/ledger";

const yen = (v: number) => Math.round(v).toLocaleString("en-US");
const pct = (v: number | null) => (v === null ? "·" : `${(v * 100).toFixed(0)}%`);

export default function Analysis({ a }: { a: A }) {
  const t = useT();
  const last = a.trend.at(-1);
  const mix = a.incomeMix.slice(-24);
  const maxMix = Math.max(1, ...mix.map((m) => m.stable + m.temporary));
  const worst = a.ranking[0]?.total ?? -1;

  return (
    <>
      {/* 两块信息密度都不高，并排放一排 */}
      <div className="lrow2">
      <section className="lsec">
        <h2>
          {t("analysis", "trailing")}
          <Hint>{t("analysis", "trailingNote")}</Hint>
        </h2>
        <div className="trend">
          {(
            [
              [t("analysis", "income"), a.trend.map((p) => p.income), last && yen(last.income)],
              [t("analysis", "needs"), a.trend.map((p) => p.needs), last && yen(last.needs)],
              [t("analysis", "wants"), a.trend.map((p) => p.wants), last && yen(last.wants)],
              [
                t("analysis", "investmentRow"),
                a.trend.map((p) => p.investment),
                last && yen(last.investment),
              ],
              [
                t("analysis", "savingsRow"),
                a.trend.map((p) => p.savings),
                last && yen(last.savings),
              ],
              [
                t("analysis", "savingsRateRow"),
                a.trend.map((p) => p.savingsRate),
                last && pct(last.savingsRate),
              ],
            ] as [string, (number | null)[], string | undefined][]
          ).map(([label, series, value]) => (
            <div className="trend-row" key={label}>
              <span className="trend-name">{label}</span>
              <Spark values={series} />
              <span className="trend-val">{value}</span>
            </div>
          ))}
        </div>
        {a.trend.length > 0 && (
          <div className="lfoot">
            {a.trend[0].month} → {a.trend.at(-1)!.month}
          </div>
        )}
      </section>

      <section className="lsec">
        <h2>
          {t("analysis", "incomeMix")}
          <Hint>{t("analysis", "incomeMixNote")}</Hint>
        </h2>
        <div className="mix">
          {mix.map((m) => {
            const total = m.stable + m.temporary;
            return (
              <div className="mix-col" key={m.month} title={`${m.month} ${yen(total)}`}>
                <div className="mix-bar">
                  <div
                    className="mix-temp"
                    style={{ height: `${(m.temporary / maxMix) * 100}%` }}
                  />
                  <div
                    className="mix-stable"
                    style={{ height: `${(m.stable / maxMix) * 100}%` }}
                  />
                </div>
                <span className="mix-label">{m.month.slice(2).replace("-", "/")}</span>
              </div>
            );
          })}
        </div>
      </section>
      </div>

      {/* ---- 基线 ---- */}
      <section className="lsec">
        <h2>
          {t("analysis", "baseline")}
          <Hint>{t("analysis", "baselineNote")(a.baseline.months)}</Hint>
        </h2>
        <div className="stats">
          <div className="stat">
            <span className="stat-num">{yen(a.baseline.needs)}</span>
            <span className="stat-label">{t("analysis", "needsPerMonth")}</span>
          </div>
          <div className="stat">
            <span className="stat-num">{yen(a.baseline.discretionary)}</span>
            <span className="stat-label">{t("analysis", "discretionary")}</span>
          </div>
          <div className="stat">
            <span className="stat-num">{yen(a.baseline.bank)}</span>
            <span className="stat-label">{t("analysis", "bankBalance")}</span>
          </div>
          <div className="stat">
            <span className="stat-num">
              {a.baseline.runwayMonths === null ? "·" : a.baseline.runwayMonths.toFixed(1)}
            </span>
            <span className="stat-label">{t("analysis", "runway")}</span>
          </div>
        </div>
      </section>

      {/* ---- 分类排行 ---- */}
      <section className="lsec">
        <h2>{t("analysis", "ranking")(a.rankingYear)}</h2>
        <div className="rank">
          {a.ranking.map((r) => (
            <div className="rank-row" key={r.detail}>
              <span className="rank-name">{r.detail}</span>
              <span className="rank-group">{r.group}</span>
              <span className="rank-bar">
                <span style={{ width: `${(r.total / worst) * 100}%` }} />
              </span>
              <span className="rank-val">{yen(r.total)}</span>
              <span className="rank-share">{(r.share * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
