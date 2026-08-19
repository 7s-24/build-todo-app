"use client";

import { useState } from "react";
import type { ISODate, Priority } from "@/lib/types";

const LEVELS: Priority[] = [1, 2, 3];

/**
 * 底部快速录入。三档只用颜色区分 —— 没有 "高/中/低" 这种标签。
 * 日期填的是「最晚完成日期」，不是「排在哪天」：排在哪天由档位自动决定，
 * 截止日只是给排期设一条不许越过的上限，外加事后提醒。
 */
export default function Dock({
  priority,
  onPriority,
  onAdd,
}: {
  priority: Priority;
  onPriority: (p: Priority) => void;
  onAdd: (title: string, priority: Priority, due?: ISODate) => void;
}) {
  const [text, setText] = useState("");
  const [due, setDue] = useState("");

  function submit() {
    const title = text.trim();
    if (!title) return;
    onAdd(title, priority, due || undefined);
    setText("");
    // 截止日不粘连：留空才是常态，设 deadline 应该每次都是明确动作
    setDue("");
  }

  return (
    <form
      className="dock"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="picker">
        {LEVELS.map((p) => (
          <button
            key={p}
            type="button"
            className={`swatch${p === priority ? " is-on" : ""}`}
            style={{ ["--pc" as string]: `var(--p${p})` }}
            onClick={() => onPriority(p)}
          />
        ))}
      </div>
      <input
        className="dock-input"
        value={text}
        placeholder="—"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // 中文输入法里回车是「确认候选词」，不能当成提交
          if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
          e.preventDefault();
          submit();
        }}
      />
      <input
        type="date"
        className={`dock-date${due ? " is-set" : ""}`}
        value={due}
        onChange={(e) => setDue(e.target.value)}
      />
    </form>
  );
}
