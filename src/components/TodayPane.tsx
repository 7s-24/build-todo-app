"use client";

import { XIcon } from "./icons";
import type { ISODate, TaskDTO } from "@/lib/types";

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

export default function TodayPane({
  today,
  tasks,
  onToggle,
  onDelete,
}: {
  today: ISODate;
  tasks: TaskDTO[];
  onToggle: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
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
            className={`trow${t.done ? " is-done" : ""}`}
            style={{ ["--pc" as string]: `var(--p${t.priority})` }}
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
