"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LANG_COOKIE, type Lang } from "./lang";

export type { Lang };


/**
 * 界面文案词典。
 *
 * 不收录账簿里的 Group / Detail 名（Income、Needs、Dining……）——
 * 那些是 categories 表里的数据，不是界面文案。翻译它们等于再造一份
 * 映射，而且和喵喵导出的对不上。
 */
const DICT = {
  nav: { schedule: ["日程", "Schedule"], ledger: ["账簿", "Ledger"] },

  settings: {
    dailyLimit: ["每日任务上限", "Tasks per day"],
    myCalendars: ["我的日历", "My calendars"],
    sharedCalendars: ["他人日历", "Others' calendars"],
    myHint: [
      "一行一个。Mac 日历 → 右键日历 → 共享设置 → 勾选「公开日历」→ 复制链接。",
      "One per line. Calendar.app → right-click → Sharing → Public Calendar → copy link.",
    ],
    sharedHint: [
      "家人等别人的日历，一行一个，和自己的分开开关。Apple 同上；Google 日历 → 设置 → 选中该日历 → 「日历的秘密地址（iCal 格式）」。对方把链接给你就行，两边都是只读订阅。",
      "Family and others, one per line, toggled separately. Apple as above; Google Calendar → Settings → pick the calendar → “Secret address in iCal format”. They just send you the link; both are read-only.",
    ],
    theme: ["皮肤", "Theme"],
    themeMono: ["黑白", "Mono"],
    themeDark: ["反色", "Inverted"],
    themeAuto: ["跟随系统", "System"],
    language: ["语言", "Language"],
    trash: ["回收站", "Trash"],
    trashEmpty: ["空的", "Empty"],
    trashHint: [
      "删掉的任务和项目会先进这里，不会立刻消失。点箭头放回原处 —— 任务回到它原本排的那一天，项目回到原来的分组。",
      "Deleted tasks and projects land here instead of disappearing. The arrow puts one back where it was — a task returns to the day it was scheduled on, a project to its group.",
    ],
  },

  ledger: {
    import: ["导入 CSV", "Import CSV"],
    overview: ["占收入比例", "Overview — % of income"],
    group: ["分组", "Group"],
    target: ["目标", "Target"],
    savingsRate: ["储蓄率", "Savings rate"],
    detail: ["明细", "Detail"],
    total: ["合计", "Total"],
    spendingTotal: ["支出合计", "SPENDING TOTAL"],
    savings: ["储蓄", "SAVINGS"],
    netWorth: ["净值 — 银行 + 投资", "Net worth — bank + investment"],
    month: ["月份", "Month"],
    nisaAdded: ["NISA 转入", "NISA added"],
    bank: ["银行", "Bank"],
    investment: ["投资", "Investment"],
    net: ["净值", "Net worth"],
    txnCount: ["笔", "transactions"],
    rates: ["汇率", "rates"],
    noRows: ["这一格没有流水", "No transactions behind this cell"],
    analysis: ["分析", "Analysis"],
    unmappedShort: ["未映射的分类", "Unmapped categories"],
    unmapped: [
      "这些分类还没映射到 Group / Detail，它们的钱不会出现在任何一张表里。补上映射才会被算进去。",
      "These categories have no Group / Detail mapping, so their money appears in no table. Map them and they get counted.",
    ],
    save: ["保存", "Save"],
    loadFailed: ["读取失败", "Failed to load"],
    importFailed: ["导入失败", "Import failed"],
    importResult: [
      (p: number, a: number, s: number) => `解析 ${p} 行：新增 ${a}，重复跳过 ${s}`,
      (p: number, a: number, s: number) =>
        `Parsed ${p} rows: ${a} added, ${s} duplicates skipped`,
    ],
    importBad: [
      (n: number) => `，${n} 行解析不了`,
      (n: number) => `, ${n} rows could not be parsed`,
    ],
    importUnmapped: [
      (list: string) => `。未映射分类：${list}`,
      (list: string) => `. Unmapped categories: ${list}`,
    ],
  },

  analysis: {
    trailing: ["滚动 12 个月", "Trailing 12 months"],
    trailingNote: [
      "单月数字摆动太大，读不出趋势。这里每个点都是「截至该月的过去 12 个月」合计。",
      "Monthly figures swing too much to read a trend. Each point is the sum of the 12 months ending that month.",
    ],
    income: ["收入", "Income"],
    needs: ["必要", "Needs"],
    wants: ["想要", "Wants"],
    investmentRow: ["投资", "Investment"],
    savingsRow: ["储蓄", "Savings"],
    savingsRateRow: ["储蓄率", "Savings rate"],
    incomeMix: ["收入构成 — 稳定 vs 临时", "Income — stable vs temporary"],
    incomeMixNote: [
      "实心是每月都会来的（Salary、Scholarship），空心是不一定会来的（Red Packets、Other Income）。注意 RA 的那部分混在 Salary 里，导出数据分不出来。",
      "Solid = arrives every month (Salary, Scholarship); outlined = may not (Red Packets, Other Income). Note the RA portion sits inside Salary and the export cannot separate it.",
    ],
    baseline: ["月度基线与可撑月数", "Monthly baseline & runway"],
    baselineNote: [
      (n: number) =>
        `取过去 ${n} 个月里每个 Detail 的月度中位数再求和 —— 用中位数而不是平均，是为了不被搬家、机票、补发这类一次性大额带偏。`,
      (n: number) =>
        `Sum of each detail's median month over the last ${n} months — median rather than mean, so one-offs like a move, a flight, or back-pay don't skew it.`,
    ],
    needsPerMonth: ["必要开支 / 月（Needs）", "Essentials / month (Needs)"],
    discretionary: [
      "可自由支配 / 月（Wants + Family）",
      "Discretionary / month (Wants + Family)",
    ],
    bankBalance: ["银行余额", "Bank balance"],
    runway: ["按必要开支还能撑（月）", "Months covered by essentials"],
    ranking: ["钱去哪了", "Where it went"],
  },
} as const;

type Dict = typeof DICT;

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "zh",
  setLang: () => {},
});

export function LangProvider({
  initial,
  children,
}: {
  initial: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    // cookie 而不是 localStorage：服务端渲染时就能读到，避免先闪一下中文再变英文
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l === "zh" ? "zh" : "en";
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

/** 词条要么是两个字符串，要么是两个同款函数 —— 取哪一个只看语言 */
type Entry<T> = T extends readonly [infer A, unknown] ? A : never;

/** t("ledger", "import") → 当前语言的那一条 */
export function useT() {
  const { lang } = useLang();
  const i = lang === "zh" ? 0 : 1;
  return useCallback(
    <S extends keyof Dict, K extends keyof Dict[S]>(
      section: S,
      key: K,
    ): Entry<Dict[S][K]> =>
      (DICT[section][key] as readonly unknown[])[i] as Entry<Dict[S][K]>,
    [i],
  );
}
