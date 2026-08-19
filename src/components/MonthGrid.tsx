"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { monthGrid } from "@/lib/date";
import type { CalEvent, ISODate, Priority, TaskDTO } from "@/lib/types";

const WEEK = ["一", "二", "三", "四", "五", "六", "日"];
/** 按住多久算「长按」而不是点击 */
const HOLD_MS = 220;
/** 长按成立前挪动超过这么多像素，就当成误触，不进入拖动 */
const SLOP = 6;

interface Drag {
  task: TaskDTO;
  x: number;
  y: number;
  over: ISODate | null;
}

/** 计划日期越过了截止日，或者截止日已经过去 —— 两种都算「晚了」 */
export function isLate(task: TaskDTO, today: ISODate): boolean {
  if (task.done || !task.due) return false;
  return task.date > task.due || today > task.due;
}

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
  onMove,
  onMenu,
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
  onMove: (task: TaskDTO, date: ISODate) => void;
  onMenu: (task: TaskDTO, x: number, y: number) => void;
}) {
  const [editing, setEditing] = useState<ISODate | null>(null);
  const [draft, setDraft] = useState("");
  const [drag, setDragState] = useState<Drag | null>(null);

  const dragRef = useRef<Drag | null>(null);
  const pressRef = useRef<{ task: TaskDTO; x: number; y: number; timer: number } | null>(null);
  // 拖完之后紧跟着的那个 click 要吞掉，否则会顺手切换完成 / 打开新建输入框
  const swallowRef = useRef(false);

  const setDrag = useCallback((d: Drag | null) => {
    dragRef.current = d;
    setDragState(d);
  }, []);

  const cancelPress = useCallback(() => {
    if (pressRef.current) {
      clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
  }, []);

  useEffect(() => {
    function dropTarget(e: PointerEvent): ISODate | null {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cell = el instanceof Element ? el.closest<HTMLElement>("[data-date]") : null;
      // 锁定的日子不接受落点，和「点空白格不给输入框」保持一致
      if (!cell || cell.dataset.locked === "1") return null;
      return cell.dataset.date ?? null;
    }

    function onMove_(e: PointerEvent) {
      const p = pressRef.current;
      if (p) {
        if (Math.abs(e.clientX - p.x) > SLOP || Math.abs(e.clientY - p.y) > SLOP) {
          cancelPress();
        }
        return;
      }
      const d = dragRef.current;
      if (!d) return;
      setDrag({ ...d, x: e.clientX, y: e.clientY, over: dropTarget(e) });
    }

    function onUp() {
      cancelPress();
      const d = dragRef.current;
      if (!d) return;
      setDrag(null);
      swallowRef.current = true;
      setTimeout(() => (swallowRef.current = false), 0);
      if (d.over && d.over !== d.task.date) onMove(d.task, d.over);
    }

    window.addEventListener("pointermove", onMove_);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove_);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [cancelPress, onMove, setDrag]);

  function startPress(e: React.PointerEvent, task: TaskDTO) {
    if (e.button !== 0) return;
    const { clientX: x, clientY: y } = e;
    const timer = window.setTimeout(() => {
      pressRef.current = null;
      setDrag({ task, x, y, over: null });
    }, HOLD_MS);
    pressRef.current = { task, x, y, timer };
  }

  function commit(date: ISODate) {
    const title = draft.trim();
    if (title) onAdd(title, priority, date);
    setDraft("");
    setEditing(null);
  }

  const cells = monthGrid(year, month);

  return (
    <div className="month">
      <div className="week-head">
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className={`grid${drag ? " is-dragging" : ""}`}>
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
            drag?.over === date ? "is-drop" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={date}
              className={cls}
              data-date={date}
              data-locked={isLocked ? "1" : undefined}
              onClick={() => {
                if (swallowRef.current) return;
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
                    className={[
                      "chip",
                      t.done ? "is-done" : "",
                      t.due ? "has-due" : "",
                      isLate(t, today) ? "is-late" : "",
                      drag?.task.id === t.id ? "is-held" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ ["--pc" as string]: `var(--p${t.priority})` }}
                    onPointerDown={(e) => startPress(e, t)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      cancelPress();
                      onMenu(t, e.clientX, e.clientY);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (swallowRef.current) return;
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

      {drag && (
        <div
          className="ghost"
          style={{
            left: drag.x,
            top: drag.y,
            ["--pc" as string]: `var(--p${drag.task.priority})`,
          }}
        >
          <span className="chip-bar" />
          <span className="chip-text">{drag.task.title}</span>
        </div>
      )}
    </div>
  );
}
