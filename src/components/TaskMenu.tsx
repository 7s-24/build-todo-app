"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { XIcon } from "./icons";
import type { Priority, TaskDTO } from "@/lib/types";

const LEVELS: Priority[] = [1, 2, 3];

/**
 * 右键任务弹出的小面板：改优先级、记最晚完成日期、删除。
 * 优先级仍然只用颜色区分，面板里也不写「高中低」。
 */
export default function TaskMenu({
  task,
  x,
  y,
  onPatch,
  onDelete,
  onClose,
}: {
  task: TaskDTO;
  x: number;
  y: number;
  onPatch: (patch: Partial<TaskDTO>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // 贴着窗口边缘右键时把面板拉回可视范围
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({
      x: Math.max(4, Math.min(x, window.innerWidth - width - 4)),
      y: Math.max(4, Math.min(y, window.innerHeight - height - 4)),
    });
  }, [x, y]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="menu" ref={ref} style={{ left: pos.x, top: pos.y }}>
      <div className="menu-row">
        {LEVELS.map((p) => (
          <button
            key={p}
            className={`swatch${p === task.priority ? " is-on" : ""}`}
            style={{ ["--pc" as string]: `var(--p${p})` }}
            onClick={() => onPatch({ priority: p })}
          />
        ))}
        <div className="menu-gap" />
        <button className="menu-x" onClick={onDelete}>
          <XIcon />
        </button>
      </div>
      <div className="menu-row">
        <input
          type="date"
          className="menu-date"
          value={task.due ?? ""}
          onChange={(e) => onPatch({ due: e.target.value || null })}
        />
      </div>
    </div>
  );
}
