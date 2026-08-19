"use client";

import { useEffect } from "react";
import type { SettingsDTO } from "@/lib/types";

/** 设置面板允许出现文字标签 —— 这里是配置，不是状态展示 */
export default function Sheet({
  settings,
  feeds,
  onPatch,
  onClose,
}: {
  settings: SettingsDTO;
  feeds: { ok: number; total: number };
  onPatch: (patch: Partial<SettingsDTO>) => void;
  onClose: () => void;
}) {
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
          <label>每日任务上限</label>
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
            Apple 日历订阅地址
            {feeds.total > 0 && (
              <span className={`feeds${feeds.ok < feeds.total ? " is-bad" : ""}`}>
                {feeds.ok}/{feeds.total}
              </span>
            )}
          </label>
          <textarea
            rows={5}
            placeholder="webcal://..."
            defaultValue={settings.icsUrls ?? ""}
            onBlur={(e) => onPatch({ icsUrls: e.target.value })}
          />
          <div className="hint">
            一行一个。Mac 日历 → 右键日历 → 共享设置 → 勾选「公开日历」 → 复制链接。
            只读订阅，本 app 不会写回你的日历。
          </div>
        </div>

        <div className="field">
          <label>皮肤</label>
          <select
            value={settings.theme}
            onChange={(e) => onPatch({ theme: e.target.value })}
          >
            <option value="mono">黑白</option>
            <option value="dark">反色</option>
            <option value="auto">跟随系统</option>
          </select>
        </div>
      </div>
    </>
  );
}
