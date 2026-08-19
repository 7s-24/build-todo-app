"use client";

import { useLang } from "@/lib/i18n";

/** 语言不是状态，是选择 —— 直接把两个语言的名字摆出来，选中的反白 */
export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="langtoggle">
      <button
        className={`lang-btn${lang === "zh" ? " is-on" : ""}`}
        onClick={() => setLang("zh")}
      >
        中
      </button>
      <button
        className={`lang-btn${lang === "en" ? " is-on" : ""}`}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}
