"use client";

import { useState } from "react";
import { monthGrid } from "@/lib/date";
import type { CalEvent, ISODate, Priority, TaskDTO } from "@/lib/types";

const WEEK = ["一", "二", "三", "四", "五", "六", "日"];

export default function MonthGrid({
  year,
  month,
  today,
  tasks,
  events,
  locked,
  dailyLimit,
  priority,
  onToggle,
  onLock,
  onAdd,
}: {
  year: number;
  month: number;
  today: ISODate;
  tasks: Map<string, TaskDTO[]>;
  events: Map<string, CalEvent[]>;
  locked: Set<string>;
  dailyLimit: number;
  priority: Priority;
  onToggle: (task: TaskDTO) => void;
  onLock: (date: ISODate, locked: boolean) => void;
  onAdd: (title: string, priority: Priority, date: ISODate) => void;
}) {
  const [editing, setEditing] = useState<ISODate | null>(null);
  const [draft, setDraft] = useState("");
  const cells = monthGrid(year, month);

  function commit(date: ISODate) {
    const title = draft.trim();
    if (title) onAdd(title, priority, date);
    setDraft("");
    setEditing(null);
  }

  return (
    <div className="month">
      <div className="week-head">
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid">
        {cells.map((date) => {
          const dayTasks = tasks.get(date) ?? [];
          const isLocked = locked.has(date);
          const open = dayTasks.filter((t) => !t.done).length;
          const cls = [
            "cell",
            Number(date.slice(5, 7)) - 1 === month ? "" : "is-out",
            date === today ? "is-today" : "",
            isLocked ? "is-locked" : "",
            open >= dailyLimit ? "is-full" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={date}
              className={cls}
              onClick={() => {
                // 锁定的日子不接受新任务，连输入框都不给
                if (!isLocked) setEditing(date);
              }}
            >
              <div className="cell-head">
                <button
                  className="cell-lock"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLock(date, !isLocked);
                  }}
                />
                <span className="cell-num">{Number(date.slice(8, 10))}</span>
              </div>

              <div className="cell-body">
                {dayTasks.map((t) => (
                  <button
                    key={t.id}
                    className={`chip${t.done ? " is-done" : ""}`}
                    style={{ ["--pc" as string]: `var(--p${t.priority})` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(t);
                    }}
                  >
                    <span className="chip-bar" />
                    <span className="chip-text">{t.title}</span>
                  </button>
                ))}

                {editing === date && (
                  <input
                    className="cell-input"
                    autoFocus
                    value={draft}
                    style={{ ["--pc" as string]: `var(--p${priority})` }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commit(date)}
                    onKeyDown={(e) => {
                      // 输入法组词途中的回车只是确认候选词，不是提交
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        commit(date);
                      }
                      if (e.key === "Escape") {
                        setDraft("");
                        setEditing(null);
                      }
                    }}
                  />
                )}

                {(events.get(date) ?? []).map((ev, i) => (
                  <div className="ev" key={`${ev.title}-${i}`}>
                    {ev.time && <span className="ev-time">{ev.time}</span>}
                    <span>{ev.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
