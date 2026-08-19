"use client";

import { useState } from "react";
import type { Priority } from "@/lib/types";

const LEVELS: Priority[] = [1, 2, 3];

/**
 * 底部快速录入。三档只用颜色区分 —— 没有 "高/中/低" 这种标签。
 * 这里不指定日期，交给服务端按紧急程度自动落位。
 */
export default function Dock({
  priority,
  onPriority,
  onAdd,
}: {
  priority: Priority;
  onPriority: (p: Priority) => void;
  onAdd: (title: string, priority: Priority) => void;
}) {
  const [text, setText] = useState("");

  return (
    <form
      className="dock"
      onSubmit={(e) => {
        e.preventDefault();
        const title = text.trim();
        if (!title) return;
        onAdd(title, priority);
        setText("");
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
      />
    </form>
  );
}
