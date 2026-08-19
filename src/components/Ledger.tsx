"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import AppSwitch from "./AppSwitch";
import LangToggle from "./LangToggle";
import Analysis from "./Analysis";
import CellDetail from "./CellDetail";
import { Chevron } from "./icons";
import { useT } from "@/lib/i18n";
import {
  GROUP_ORDER,
  type Analysis as AnalysisData,
  type Group,
  type NetWorthRow,
  type YearReport,
} from "@/lib/ledger";

const MONTHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

interface Payload {
  years: number[];
  report: YearReport;
  netWorth: NetWorthRow[];
  analysis: AnalysisData;
  rates: Record<string, number>;
  unmapped: string[];
  count: number;
}

/** 0 不写成 0 —— 一屏几百个 0 全是噪音，用一个淡点占位就够 */
function yen(v: number) {
  if (Math.round(v) === 0) return <span className="zero">·</span>;
  return Math.round(v).toLocaleString("en-US");
}

function pct(v: number | null) {
  if (v === null) return <span className="zero">·</span>;
  return `${(v * 100).toFixed(0)}%`;
}

export default function Ledger() {
  const [data, setData] = useState<Payload | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cell, setCell] = useState<{ month: number; detail?: string; group?: string } | null>(null);
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (y?: number) => {
    const res = await fetch(`/api/ledger${y ? `?year=${y}` : ""}`);
    if (!res.ok) {
      setMessage(t("ledger", "loadFailed"));
      return;
    }
    const d: Payload = await res.json();
    setData(d);
    setYear(d.report.year);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/ledger/import", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: await file.text(),
    });
    const r = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(r.error ?? t("ledger", "importFailed"));
      return;
    }
    setMessage(
      t("ledger", "importResult")(r.parsed, r.added, r.skipped) +
        (r.badRows?.length ? t("ledger", "importBad")(r.badRows.length) : "") +
        (r.unmapped?.length ? t("ledger", "importUnmapped")(r.unmapped.join("、")) : ""),
    );
    await load(year ?? undefined);
  }

  if (!data) {
    return (
      <div className="app">
        <header className="bar">
          <AppSwitch />
        </header>
        <div className="ledger-empty" />
      </div>
    );
  }

  const { report, netWorth } = data;
  const idx = data.years.indexOf(report.year);

  return (
    <div className="app">
      <header className="bar">
        <AppSwitch />
        <button
          className="nav"
          disabled={idx <= 0}
          onClick={() => load(data.years[idx - 1])}
        >
          <Chevron dir="left" />
        </button>
        <button
          className="nav"
          disabled={idx >= data.years.length - 1}
          onClick={() => load(data.years[idx + 1])}
        >
          <Chevron dir="right" />
        </button>
        <div className="bar-title">{report.year}</div>
        <div className="bar-spacer" />
        <LangToggle />
        <button className="import-btn" onClick={() => fileRef.current?.click()}>
          {busy ? "…" : t("ledger", "import")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </header>

      <div className="ledger">
        {message && <div className="ledger-msg">{message}</div>}

        {data.unmapped.length > 0 && (
          <UnmappedFixer names={data.unmapped} onDone={() => load(year ?? undefined)} />
        )}

        {/* ---- 占收入比例 ---- */}
        <section className="lsec">
          <h2>{t("ledger", "overview")}</h2>
          <div className="tscroll">
            <table className="ltable">
              <thead>
                <tr>
                  <th className="lname">{t("ledger", "group")}</th>
                  <th className="lnum">{t("ledger", "target")}</th>
                  {MONTHS.map((m) => (
                    <th className="lnum" key={m}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.overview.map((o) => (
                  <tr key={o.group}>
                    <td className="lname">{o.group}</td>
                    <td className="lnum lmuted">
                      {o.target === null ? <span className="zero">·</span> : `${o.target * 100}%`}
                    </td>
                    {o.pct.map((v, i) => (
                      <td
                        className={`lnum${v === null ? "" : " is-drill"}${
                          o.target !== null && v !== null && v > o.target ? " is-over" : ""
                        }`}
                        key={i}
                        onClick={() => v !== null && setCell({ month: i + 1, group: o.group })}
                      >
                        {pct(v)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="lrow-strong">
                  <td className="lname">{t("ledger", "savingsRate")}</td>
                  <td className="lnum" />
                  {report.savingsRate.map((v, i) => (
                    <td className={`lnum${v !== null && v < 0 ? " is-over" : ""}`} key={i}>
                      {pct(v)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Analysis a={data.analysis} />

        {/* ---- 年度透视 ---- */}
        <section className="lsec">
          <h2>{report.year}</h2>
          <div className="tscroll">
            <table className="ltable">
              <thead>
                <tr>
                  <th className="lname">{t("ledger", "detail")}</th>
                  {MONTHS.map((m) => (
                    <th className="lnum" key={m}>{m}</th>
                  ))}
                  <th className="lnum">{t("ledger", "total")}</th>
                </tr>
              </thead>
              <tbody>
                {GROUP_ORDER.map((g: Group) => {
                  const rows = report.details.filter((d) => d.group === g);
                  if (!rows.length) return null;
                  const total = report.groups.find((x) => x.group === g)!;
                  return (
                    <Fragment key={g}>
                      {rows.map((d) => (
                        <tr key={`${g}-${d.detail}`}>
                          <td className="lname lindent">{d.detail}</td>
                          {d.months.map((v, i) => (
                            <td
                              className={`lnum${v ? " is-drill" : ""}`}
                              key={i}
                              onClick={() => v && setCell({ month: i + 1, detail: d.detail })}
                            >
                              {yen(v)}
                            </td>
                          ))}
                          <td className="lnum lmuted">{yen(d.total)}</td>
                        </tr>
                      ))}
                      <tr className="lrow-sub">
                        <td className="lname">{g}</td>
                        {total.months.map((v, i) => (
                          <td
                            className={`lnum${v ? " is-drill" : ""}`}
                            key={i}
                            onClick={() => v && setCell({ month: i + 1, group: g })}
                          >
                            {yen(v)}
                          </td>
                        ))}
                        <td className="lnum">{yen(total.total)}</td>
                      </tr>
                    </Fragment>
                  );
                })}
                <tr className="lrow-strong">
                  <td className="lname">{t("ledger", "spendingTotal")}</td>
                  {report.spending.map((v, i) => (
                    <td className="lnum" key={i}>{yen(v)}</td>
                  ))}
                  <td className="lnum">{yen(report.spendingTotal)}</td>
                </tr>
                <tr className="lrow-strong">
                  <td className="lname">{t("ledger", "savings")}</td>
                  {report.savings.map((v, i) => (
                    <td className={`lnum${v < 0 ? " is-over" : ""}`} key={i}>{yen(v)}</td>
                  ))}
                  <td className={`lnum${report.savingsTotal < 0 ? " is-over" : ""}`}>
                    {yen(report.savingsTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ---- 净值 ---- */}
        <section className="lsec">
          <h2>{t("ledger", "netWorth")}</h2>
          <div className="tscroll">
            <table className="ltable">
              <thead>
                <tr>
                  <th className="lname">{t("ledger", "month")}</th>
                  <th className="lnum">{t("ledger", "savings")}</th>
                  <th className="lnum">{t("ledger", "nisaAdded")}</th>
                  <th className="lnum">{t("ledger", "bank")}</th>
                  <th className="lnum">{t("ledger", "investment")}</th>
                  <th className="lnum">{t("ledger", "net")}</th>
                </tr>
              </thead>
              <tbody>
                {netWorth.map((r) => (
                  <tr key={r.month}>
                    <td className="lname">{r.month}</td>
                    <td className={`lnum${r.savings < 0 ? " is-over" : ""}`}>{yen(r.savings)}</td>
                    <td className="lnum lmuted">{yen(r.nisa)}</td>
                    <td className="lnum lmuted">{yen(r.bank)}</td>
                    <td className="lnum lmuted">{yen(r.investment)}</td>
                    <td className="lnum lstrong">{yen(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="ledger-foot">
          {data.count} {t("ledger", "txnCount")} · {t("ledger", "rates")}{" "}
          {Object.entries(data.rates)
            .filter(([c]) => c !== "日元")
            .map(([c, r]) => `${c} ${r}`)
            .join(" · ")}
        </div>
        {cell && (
          <CellDetail
            year={report.year}
            month={cell.month}
            detail={cell.detail}
            group={cell.group}
            onClose={() => setCell(null)}
          />
        )}
      </div>
    </div>
  );
}

function UnmappedFixer({ names, onDone }: { names: string[]; onDone: () => void }) {
  const t = useT();
  const [group, setGroup] = useState<Group>("Needs");
  const [detail, setDetail] = useState("");
  const [current, setCurrent] = useState(names[0]);

  async function save() {
    if (!detail.trim()) return;
    await fetch("/api/ledger/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: current, group, detail }),
    });
    setDetail("");
    onDone();
  }

  return (
    <section className="lsec unmapped">
      <h2>{t("ledger", "unmapped")}</h2>
      <div className="unmapped-row">
        <select value={current} onChange={(e) => setCurrent(e.target.value)}>
          {names.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={group} onChange={(e) => setGroup(e.target.value as Group)}>
          {GROUP_ORDER.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <input
          placeholder="Detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) void save();
          }}
        />
        <button onClick={save}>{t("ledger", "save")}</button>
      </div>
    </section>
  );
}
