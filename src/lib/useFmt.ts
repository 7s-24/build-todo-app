"use client";

import { useMemo } from "react";
import { useLang } from "./i18n";

/**
 * 星期和月份名交给 Intl，不进词典 ——
 * 词典里再抄一份 12 个月名，只会有一份迟早对不上。
 */
export function useFmt() {
  const { lang } = useLang();
  return useMemo(() => {
    const locale = lang === "zh" ? "zh-CN" : "en-US";
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const month = new Intl.DateTimeFormat(locale, { month: "short" });
    return {
      locale,
      weekday: (d: Date) => weekday.format(d),
      month: (d: Date) => month.format(d),
      monthOfIndex: (m: number) => month.format(new Date(2020, m, 1)),
    };
  }, [lang]);
}
