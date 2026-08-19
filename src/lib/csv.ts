/** 最小的 RFC4180 解析：备注里可能有逗号和引号，不能直接 split */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, ""); // 喵喵导出带 BOM
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}

/**
 * 喵喵的时间列格式不固定，见过 "2024-01-01 01:36:42" 和 "2024/1/1 1:36"。
 * 统一成 Postgres 认的 "YYYY-MM-DD HH:mm:ss"，且全程当墙上时间处理，
 * 不构造 Date —— 一构造就会引入时区。
 */
export function normalizeStamp(raw: string): string | null {
  const s = raw.trim().replace(/\//g, "-");
  const m = s.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (!m) return null;
  const p = (v: string | undefined, d = "00") => (v ?? d).padStart(2, "0");
  return `${m[1]}-${p(m[2])}-${p(m[3])} ${p(m[4])}:${p(m[5])}:${p(m[6])}`;
}

export function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/[,\s¥￥$]/g, ""));
  return Number.isFinite(n) ? n : null;
}
