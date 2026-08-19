"use client";

import { useEffect, useState } from "react";

interface Row {
  occurredAt: string;
  category: string;
  detail: string;
  note: string | null;
  amount: number;
  currency: string;
  jpy: number;
}

/** 某一格背后的流水。数字对不上时，这是唯一能查下去的地方 */
export default function CellDetail({
  year,
  month,
  detail,
  group,
  onClose,
}: {
  year: number;
  month: number; // 1-12
  detail?: string;
  group?: string;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);
  const key = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    const q = new URLSearchParams({ month: key });
    if (detail) q.set("detail", detail);
    else if (group) q.set("group", group);
    let alive = true;
    fetch(`/api/ledger/txns?${q}`)
      .then((r) => (r.ok ? r.json() : { rows: [], total: 0 }))
      .then((d) => {
        if (!alive) return;
        setRows(d.rows ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [key, detail, group]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="sheet-mask" onClick={onClose} />
      <div className="sheet celldetail">
        <div className="cd-head">
          <span className="cd-title">{detail ?? group}</span>
          <span className="cd-month">{key}</span>
          <div className="bar-spacer" />
          <span className="cd-total">{Math.round(total).toLocaleString("en-US")}</span>
        </div>

        <div className="cd-body">
          {rows === null && <div className="today-empty" />}
          {rows?.length === 0 && <div className="cd-none">这一格没有流水</div>}
          {rows?.map((r, i) => (
            <div className="cd-row" key={i}>
              <span className="cd-date">{r.occurredAt.slice(5, 10)}</span>
              <span className="cd-cat">{r.category}</span>
              <span className="cd-note">{r.note}</span>
              <span className="cd-amt">
                {Math.round(r.jpy).toLocaleString("en-US")}
                {r.currency !== "日元" && (
                  <em className="cd-orig">
                    {r.amount.toLocaleString("en-US")} {r.currency}
                  </em>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
