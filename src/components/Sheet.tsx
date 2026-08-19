"use client";

import { useEffect } from "react";
import { useLang, useT } from "@/lib/i18n";
import type { FeedStatus, SettingsDTO } from "@/lib/types";

/** 设置面板允许出现文字标签 —— 这里是配置，不是状态展示 */
function Feeds({ status }: { status: FeedStatus }) {
  if (status.total === 0) return null;
  return (
    <span className={`feeds${status.ok < status.total ? " is-bad" : ""}`}>
      {status.ok}/{status.total}
    </span>
  );
}

export default function Sheet({
  settings,
  feeds,
  onPatch,
  onClose,
}: {
  settings: SettingsDTO;
  feeds: { own: FeedStatus; shared: FeedStatus };
  onPatch: (patch: Partial<SettingsDTO>) => void;
  onClose: () => void;
}) {
  const t = useT();
  const { lang, setLang } = useLang();

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
      <div className="sheet">
        <div className="field">
          <label>{t("settings", "dailyLimit")}</label>
          <input
            type="number"
            min={1}
            max={50}
            value={settings.dailyLimit}
            onChange={(e) => onPatch({ dailyLimit: Number(e.target.value) })}
          />
        </div>

        <div className="field">
          <label>
            {t("settings", "myCalendars")}
            <Feeds status={feeds.own} />
          </label>
          <textarea
            rows={4}
            placeholder="webcal://..."
            defaultValue={settings.icsUrls ?? ""}
            onBlur={(e) => onPatch({ icsUrls: e.target.value })}
          />
          <div className="hint">{t("settings", "myHint")}</div>
        </div>

        <div className="field">
          <label>
            {t("settings", "sharedCalendars")}
            <Feeds status={feeds.shared} />
          </label>
          <textarea
            rows={4}
            placeholder="webcal:// 或 https://...ics"
            defaultValue={settings.sharedUrls ?? ""}
            onBlur={(e) => onPatch({ sharedUrls: e.target.value })}
          />
          <div className="hint">{t("settings", "sharedHint")}</div>
        </div>

        <div className="field">
          <label>{t("settings", "language")}</label>
          <select value={lang} onChange={(e) => setLang(e.target.value as "zh" | "en")}>
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="field">
          <label>{t("settings", "theme")}</label>
          <select
            value={settings.theme}
            onChange={(e) => onPatch({ theme: e.target.value })}
          >
            <option value="mono">{t("settings", "themeMono")}</option>
            <option value="dark">{t("settings", "themeDark")}</option>
            <option value="auto">{t("settings", "themeAuto")}</option>
          </select>
        </div>
      </div>
    </>
  );
}
