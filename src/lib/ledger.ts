export const GROUP_ORDER = [
  "Income",
  "Needs",
  "Wants",
  "Investment",
  "Family & Gifts",
] as const;

export type Group = (typeof GROUP_ORDER)[number];

/** 有支出目标的三组；Family & Gifts 故意没有目标 */
export const TARGET_GROUPS: Group[] = ["Needs", "Wants", "Investment"];

export interface RawTxn {
  category: string;
  occurredAt: string; // YYYY-MM-DD HH:mm:ss
  amount: number;
  currency: string;
  note: string | null;
}

export interface CategoryMap {
  [category: string]: { group: Group; detail: string };
}

export interface DetailRow {
  group: Group;
  detail: string;
  months: number[]; // 12
  total: number;
}

export interface GroupRow {
  group: Group;
  months: number[];
  total: number;
}

export interface YearReport {
  year: number;
  details: DetailRow[];
  groups: GroupRow[];
  income: number[]; // 12
  spending: number[]; // 12，负数
  savings: number[]; // 12
  incomeTotal: number;
  spendingTotal: number;
  savingsTotal: number;
  /** 各组占当月收入的比例；当月没有收入时为 null（空白，不是 0） */
  overview: { group: Group; target: number | null; pct: (number | null)[] }[];
  savingsRate: (number | null)[];
}

export interface NetWorthRow {
  month: string; // YYYY-MM
  savings: number;
  nisa: number;
  bank: number;
  investment: number;
  net: number;
}

const EMPTY12 = () => Array(12).fill(0) as number[];

/** 汇率是固定近似值，不是实时价 */
export function toJpy(t: RawTxn, rates: Record<string, number>): number {
  return t.amount * (rates[t.currency] ?? 1);
}

export function monthKey(occurredAt: string): string {
  return occurredAt.slice(0, 7);
}

/**
 * 一年的透视：每个 Detail 一行，12 个月 + 合计。
 *
 * 符号沿用喵喵的原样：支出为负、收入为正，
 * 所以 SAVINGS = 收入合计 + 支出合计（不是相减）。
 */
export function buildYear(
  txns: RawTxn[],
  cats: CategoryMap,
  rates: Record<string, number>,
  year: number,
): YearReport {
  const byDetail = new Map<string, DetailRow>();
  const income = EMPTY12();
  const spending = EMPTY12();

  for (const t of txns) {
    if (Number(t.occurredAt.slice(0, 4)) !== year) continue;
    const map = cats[t.category];
    if (!map) continue; // 未映射的分类由上层单独报出来，不该悄悄计入
    const m = Number(t.occurredAt.slice(5, 7)) - 1;
    const jpy = toJpy(t, rates);

    const key = `${map.group}|${map.detail}`;
    let row = byDetail.get(key);
    if (!row) {
      row = { group: map.group, detail: map.detail, months: EMPTY12(), total: 0 };
      byDetail.set(key, row);
    }
    row.months[m] += jpy;
    row.total += jpy;

    if (map.group === "Income") income[m] += jpy;
    else spending[m] += jpy;
  }

  const details = [...byDetail.values()].sort(
    (a, b) =>
      GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) ||
      a.detail.localeCompare(b.detail),
  );

  const groups: GroupRow[] = GROUP_ORDER.map((g) => {
    const months = EMPTY12();
    let total = 0;
    for (const d of details) {
      if (d.group !== g) continue;
      d.months.forEach((v, i) => (months[i] += v));
      total += d.total;
    }
    return { group: g, months, total };
  });

  const savings = income.map((v, i) => v + spending[i]);

  // 当月没有收入就留空 —— 0 会被读成「花了 0%」，那是假的
  const ratio = (num: number, i: number) =>
    income[i] === 0 ? null : num / income[i];

  const overview = GROUP_ORDER.filter((g) => g !== "Income").map((g) => {
    const row = groups.find((x) => x.group === g)!;
    return {
      group: g,
      target: null as number | null,
      pct: row.months.map((v, i) => ratio(-v, i)),
    };
  });

  return {
    year,
    details,
    groups,
    income,
    spending,
    savings,
    incomeTotal: income.reduce((a, b) => a + b, 0),
    spendingTotal: spending.reduce((a, b) => a + b, 0),
    savingsTotal: savings.reduce((a, b) => a + b, 0),
    overview,
    savingsRate: savings.map((v, i) => ratio(v, i)),
  };
}

/**
 * 净值：逐月滚动。
 *
 * NISA 在 SPENDING TOTAL 里是流出（所以 SAVINGS = 银行账户的变化），
 * 这里再把它加回投资账户 —— 那笔钱没有消失，只是换了个地方。
 * NET WORTH = 银行 + 投资。
 */
export function buildNetWorth(
  txns: RawTxn[],
  cats: CategoryMap,
  rates: Record<string, number>,
  startBank: number,
  startInvestment: number,
): NetWorthRow[] {
  const months = new Map<string, { savings: number; nisa: number }>();

  for (const t of txns) {
    const map = cats[t.category];
    if (!map) continue;
    const key = monthKey(t.occurredAt);
    let m = months.get(key);
    if (!m) {
      m = { savings: 0, nisa: 0 };
      months.set(key, m);
    }
    const jpy = toJpy(t, rates);
    m.savings += jpy; // 收入正、支出负，直接累加就是当月净存
    if (map.detail === "NISA") m.nisa += -jpy; // 流出转成投资账户的流入
  }

  let bank = startBank;
  let investment = startInvestment;

  return [...months.keys()]
    .sort()
    .map((key) => {
      const m = months.get(key)!;
      bank += m.savings;
      investment += m.nisa;
      return {
        month: key,
        savings: m.savings,
        nisa: m.nisa,
        bank,
        investment,
        net: bank + investment,
      };
    });
}

/* ===========================================================
   分析
   =========================================================== */

export interface TrendPoint {
  month: string;
  /** 截至该月的过去 12 个月合计 */
  income: number;
  needs: number;
  wants: number;
  investment: number;
  savings: number;
  savingsRate: number | null;
}

export interface IncomeMix {
  month: string;
  stable: number;
  temporary: number;
}

export interface RankRow {
  group: Group;
  detail: string;
  total: number;
  share: number;
}

/** 分析统一用同一个窗口：最近 12 个月 */
export interface Window12 {
  from: string;
  to: string;
  months: number;
}

export interface Baseline {
  /** 过去 12 个月里，每个 Detail 的月度中位数之和。中位数对一次性支出不敏感 */
  needs: number;
  discretionary: number;
  /** 银行余额 ÷ 必要基线 = 还能撑几个月 */
  runwayMonths: number | null;
  bank: number;
  months: number;
}

export interface Analysis {
  trend: TrendPoint[];
  incomeMix: IncomeMix[];
  baseline: Baseline;
  ranking: RankRow[];
  window: Window12;
}

/** 稳定收入 = 每月都会来的那部分 */
const STABLE_INCOME = new Set(["Salary", "Scholarship"]);

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** 把流水摊成「每月 x 每个 Detail」的方阵，后面几个统计都从这里长出来 */
function monthlyMatrix(
  txns: RawTxn[],
  cats: CategoryMap,
  rates: Record<string, number>,
) {
  const months = new Map<string, Map<string, number>>();
  const detailGroup = new Map<string, Group>();

  for (const t of txns) {
    const map = cats[t.category];
    if (!map) continue;
    const key = monthKey(t.occurredAt);
    let row = months.get(key);
    if (!row) {
      row = new Map();
      months.set(key, row);
    }
    row.set(map.detail, (row.get(map.detail) ?? 0) + toJpy(t, rates));
    detailGroup.set(map.detail, map.group);
  }

  return { months, detailGroup, keys: [...months.keys()].sort() };
}

export function buildAnalysis(
  txns: RawTxn[],
  cats: CategoryMap,
  rates: Record<string, number>,
  bank: number,
): Analysis {
  const { months, detailGroup, keys } = monthlyMatrix(txns, cats, rates);
  // 所有统计共用这一个窗口，口径才可比
  const recent = keys.slice(-12);

  const groupOf = (detail: string) => detailGroup.get(detail)!;
  const sumWhere = (key: string, pred: (g: Group, d: string) => boolean) => {
    let s = 0;
    for (const [detail, v] of months.get(key) ?? []) {
      if (pred(groupOf(detail), detail)) s += v;
    }
    return s;
  };

  // ---- 滚动 12 个月 ----
  const trend: TrendPoint[] = [];
  for (let i = 11; i < keys.length; i++) {
    const window = keys.slice(i - 11, i + 1);
    const agg = (pred: (g: Group, d: string) => boolean) =>
      window.reduce((s, k) => s + sumWhere(k, pred), 0);

    const income = agg((g) => g === "Income");
    const needs = agg((g) => g === "Needs");
    const wants = agg((g) => g === "Wants");
    const investment = agg((g) => g === "Investment");
    const spending = agg((g) => g !== "Income");
    trend.push({
      month: keys[i],
      income,
      needs,
      wants,
      investment,
      savings: income + spending,
      savingsRate: income === 0 ? null : (income + spending) / income,
    });
  }

  // ---- 收入构成 ----
  const incomeMix: IncomeMix[] = recent.map((k) => ({
    month: k,
    stable: sumWhere(k, (g, d) => g === "Income" && STABLE_INCOME.has(d)),
    temporary: sumWhere(k, (g, d) => g === "Income" && !STABLE_INCOME.has(d)),
  }));

  // ---- 固定开支基线 ----
  // 用「每个 Detail 的月度中位数」之和，而不是平均：
  // 平均会被一次性大额（搬家、机票、补发）拉偏，中位数不会。
  const detailMedian = (pred: (g: Group) => boolean) => {
    let sum = 0;
    for (const [detail, group] of detailGroup) {
      if (!pred(group)) continue;
      sum += median(recent.map((k) => months.get(k)?.get(detail) ?? 0));
    }
    return sum;
  };
  const needsBaseline = -detailMedian((g) => g === "Needs");
  const discretionary = -detailMedian((g) => g === "Wants" || g === "Family & Gifts");

  // ---- 分类排行 ----
  const totals = new Map<string, number>();
  for (const k of recent) {
    for (const [detail, v] of months.get(k) ?? []) {
      if (groupOf(detail) === "Income") continue;
      totals.set(detail, (totals.get(detail) ?? 0) + v);
    }
  }
  const spendTotal = [...totals.values()].reduce((a, b) => a + b, 0);
  const ranking: RankRow[] = [...totals.entries()]
    .filter(([, v]) => v !== 0)
    .map(([detail, total]) => ({
      group: groupOf(detail),
      detail,
      total,
      share: spendTotal === 0 ? 0 : total / spendTotal,
    }))
    .sort((a, b) => a.total - b.total); // 支出是负数，最负的排最前

  return {
    trend,
    incomeMix,
    baseline: {
      needs: needsBaseline,
      discretionary,
      bank,
      months: recent.length,
      runwayMonths: needsBaseline > 0 ? bank / needsBaseline : null,
    },
    ranking,
    window: {
      from: recent[0] ?? "",
      to: recent.at(-1) ?? "",
      months: recent.length,
    },
  };
}
