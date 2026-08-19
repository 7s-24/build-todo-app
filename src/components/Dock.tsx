"use client";

import { useState } from "react";
import type { ISODate, Priority } from "@/lib/types";

const LEVELS: Priority[] = [1, 2, 3];

/**
 * 底部快速录入。三档只用颜色区分 —— 没有 "高/中/低" 这种标签。
 * 日期留空就交给服务端按紧急程度自动落位；填了就直接钉在那天。
 */
export default function Dock({
  priority,
  onPriority,
  onAdd,
}: {
  priority: Priority;
  onPriority: (p: Priority) => void;
  onAdd: (title: string, priority: Priority, date?: ISODate) => void;
}) {
  const [text, setText] = useState("");
  const [date, setDate] = useState("");

  function submit() {
    const title = text.trim();
    if (!title) return;
    onAdd(title, priority, date || undefined);
    setText("");
    // 日期不粘连：留空才是常态，钉住某天应该每次都是明确动作
    setDate("");
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
        className={`dock-date${date ? " is-set" : ""}`}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
    </form>
  );
}
