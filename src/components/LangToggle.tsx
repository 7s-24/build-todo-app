"use client";

import { useLang } from "@/lib/i18n";

/**
 * 语言画不成图 —— 它本来就是文字这件事本身。
 * 所以退到最短：两个单字，和 macOS 输入法切换用的是同一个说法。
 */
export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="langtoggle">
      <button
        className={`lang-btn${lang === "zh" ? " is-on" : ""}`}
        onClick={() => setLang("zh")}
        title="中文"
        aria-label="中文"
      >
        中
      </button>
      <button
        className={`lang-btn${lang === "en" ? " is-on" : ""}`}
        onClick={() => setLang("en")}
        title="English"
        aria-label="English"
      >
        A
      </button>
    </div>
  );
}
