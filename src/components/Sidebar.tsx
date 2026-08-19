"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { XIcon } from "./icons";
import { isLate } from "./MonthGrid";
import type { ISODate, TaskDTO } from "@/lib/types";

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

/**
 * 左侧待办队列：按日期 + 档位排好的未完成任务。
 *
 * 不滚动、也不强行显示全部 —— 视窗放得下几条就显示几条。
 * 排期本来就只是摆放建议，看不见的那几条到时候会自己滚上来。
 */
export default function Sidebar({
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
  const listRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<{ x: number; y: number; timer: number } | null>(null);
  // 长按弹出菜单之后，紧跟着那个 click 不能再去触发改名
  const swallowRef = useRef(false);

  const cancelPress = useCallback(() => {
    if (pressRef.current) {
      clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
  }, []);

  // 触摸设备没有右键，长按是唯一的入口
  function startPress(e: React.PointerEvent, task: TaskDTO) {
    if (e.button !== 0) return;
    const { clientX: x, clientY: y } = e;
    const timer = window.setTimeout(() => {
      pressRef.current = null;
      swallowRef.current = true;
      onMenu(task, x, y);
    }, 500);
    pressRef.current = { x, y, timer };
  }

  function movePress(e: React.PointerEvent) {
    const p = pressRef.current;
    if (!p) return;
    if (Math.abs(e.clientX - p.x) > 8 || Math.abs(e.clientY - p.y) > 8) cancelPress();
  }

  // 放不下的整行直接藏掉，不留半截被切开的文字
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const fit = () => {
      const rows = Array.from(el.children) as HTMLElement[];
      rows.forEach((r) => r.classList.remove("is-clipped"));

      const top = el.getBoundingClientRect().top;
      const max = el.clientHeight;
      let cut = -1;
      rows.forEach((r, i) => {
        if (cut !== -1) return;
        if (r.getBoundingClientRect().bottom - top > max) cut = i;
      });
      if (cut === -1) return;

      // 日期分隔线不能落单在末尾
      if (cut > 0 && rows[cut - 1].dataset.sep === "1") cut -= 1;
      rows.slice(cut).forEach((r) => r.classList.add("is-clipped"));
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tasks]);

  function commit(task: TaskDTO) {
    const title = draft.trim();
    if (title && title !== task.title) onRename(task, title);
    setEditing(null);
  }

  const rows: React.ReactNode[] = [];
  let lastDate: string | null = null;

  for (const t of tasks) {
    // 今天的那批直接接在大日期下面，之后每换一天插一条分隔线
    if (t.date !== today && t.date !== lastDate) {
      rows.push(
        <div className="day-sep" key={`sep-${t.date}`} data-sep="1">
          {Number(t.date.slice(5, 7))}/{Number(t.date.slice(8, 10))}
        </div>,
      );
    }
    lastDate = t.date;

    rows.push(
      <div
        key={t.id}
        className={[
          "trow",
          t.due ? "has-due" : "",
          isLate(t, today) ? "is-late" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ ["--pc" as string]: `var(--p${t.priority})` }}
        onContextMenu={(e) => {
          e.preventDefault();
          cancelPress();
          onMenu(t, e.clientX, e.clientY);
        }}
        onPointerDown={(e) => startPress(e, t)}
        onPointerMove={movePress}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onClickCapture={(e) => {
          if (!swallowRef.current) return;
          e.stopPropagation();
          e.preventDefault();
          swallowRef.current = false;
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

        {t.due && (
          <span className="trow-due">{t.due.slice(5).replace("-", "/")}</span>
        )}

        <button className="trow-x" onClick={() => onDelete(t)}>
          <XIcon />
        </button>
      </div>,
    );
  }

  return (
    <aside className="today">
      <div className="today-head">
        <div className="today-num">{d.getDate()}</div>
        <div className="today-sub">
          星期{WEEKDAY[d.getDay()]} · {d.getMonth() + 1}月
        </div>
      </div>
      <div className="today-list" ref={listRef}>
        {rows.length === 0 && <div className="today-empty" />}
        {rows}
      </div>
    </aside>
  );
}
