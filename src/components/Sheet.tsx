"use client";

import { useEffect } from "react";
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
            我的日历
            <Feeds status={feeds.own} />
          </label>
          <textarea
            rows={4}
            placeholder="webcal://..."
            defaultValue={settings.icsUrls ?? ""}
            onBlur={(e) => onPatch({ icsUrls: e.target.value })}
          />
          <div className="hint">
            一行一个。Mac 日历 → 右键日历 → 共享设置 → 勾选「公开日历」 → 复制链接。
          </div>
        </div>

        <div className="field">
          <label>
            他人日历
            <Feeds status={feeds.shared} />
          </label>
          <textarea
            rows={4}
            placeholder="webcal:// 或 https://...ics"
            defaultValue={settings.sharedUrls ?? ""}
            onBlur={(e) => onPatch({ sharedUrls: e.target.value })}
          />
          <div className="hint">
            家人等别人的日历，一行一个，和自己的分开开关。
            Apple 同上；Google 日历 → 设置 → 选中该日历 → 「日历的秘密地址（iCal 格式）」。
            对方把链接给你就行，两边都是只读订阅。
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
