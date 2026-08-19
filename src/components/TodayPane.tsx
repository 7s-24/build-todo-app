"use client";

import { useState } from "react";
import { XIcon } from "./icons";
import { isLate } from "./MonthGrid";
import type { ISODate, TaskDTO } from "@/lib/types";

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

export default function TodayPane({
  today,
  tasks,
  onToggle,
  onDelete,
  onRename,
  onMenu,
}: {
  today: ISODate;
  tasks: TaskDTO[];
  onToggle: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onRename: (task: TaskDTO, title: string) => void;
  onMenu: (task: TaskDTO, x: number, y: number) => void;
}) {
  const d = new Date(`${today}T00:00:00`);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  function commit(task: TaskDTO) {
    const title = draft.trim();
    if (title && title !== task.title) onRename(task, title);
    setEditing(null);
  }

  return (
    <aside className="today">
      <div className="today-head">
        <div className="today-num">{d.getDate()}</div>
        <div className="today-sub">
          星期{WEEKDAY[d.getDay()]} · {d.getMonth() + 1}月
        </div>
      </div>
      <div className="today-list">
        {tasks.length === 0 && <div className="today-empty" />}
        {tasks.map((t) => (
          <div
            key={t.id}
            className={[
              "trow",
              t.done ? "is-done" : "",
              t.due ? "has-due" : "",
              isLate(t, today) ? "is-late" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ ["--pc" as string]: `var(--p${t.priority})` }}
            onContextMenu={(e) => {
              e.preventDefault();
              onMenu(t, e.clientX, e.clientY);
            }}
          >
            {/* 方框 = 完成，文字 = 编辑，两个动作不抢 */}
            <button className="tbox" onClick={() => onToggle(t)} />

            {editing === t.id ? (
              <input
                className="trow-input"
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commit(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) commit(t);
                  if (e.key === "Escape") setEditing(null);
                }}
              />
            ) : (
              <div
                className="trow-text"
                onClick={() => {
                  setDraft(t.title);
                  setEditing(t.id);
                }}
              >
                {t.title}
              </div>
            )}

            {t.due && <span className="trow-due">{t.due.slice(5).replace("-", "/")}</span>}

            <button className="trow-x" onClick={() => onDelete(t)}>
              <XIcon />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
