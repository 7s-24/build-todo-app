"use client";

import { XIcon } from "./icons";
import { isLate } from "./MonthGrid";
import type { ISODate, TaskDTO } from "@/lib/types";

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

export default function TodayPane({
  today,
  tasks,
  onToggle,
  onDelete,
  onMenu,
}: {
  today: ISODate;
  tasks: TaskDTO[];
  onToggle: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onMenu: (task: TaskDTO, x: number, y: number) => void;
}) {
  const d = new Date(`${today}T00:00:00`);

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
            <button className="tbox" onClick={() => onToggle(t)} />
            <div className="trow-text" onClick={() => onToggle(t)}>
              {t.title}
            </div>
            <button className="trow-x" onClick={() => onDelete(t)}>
              <XIcon />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
