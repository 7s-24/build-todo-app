"use client";

import { useLayoutEffect, useRef } from "react";
import TaskRow from "./TaskRow";
import { useFmt } from "@/lib/useFmt";
import type { ISODate, TaskDTO } from "@/lib/types";

/**
 * 待办队列：按日期 + 档位排好的未完成任务。
 *
 * 桌面上它不滚动、也不强行显示全部 —— 视窗放得下几条就显示几条。
 * 手机上它是主视图，直接滚。
 */
export default function Sidebar({
  today,
  tasks,
  scroll = false,
  onToggle,
  onDelete,
  onRename,
  onMenu,
}: {
  today: ISODate;
  tasks: TaskDTO[];
  /** 手机上队列是主视图，允许滚动看全部 */
  scroll?: boolean;
  onToggle: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onRename: (task: TaskDTO, title: string) => void;
  onMenu: (task: TaskDTO, x: number, y: number) => void;
}) {
  const d = new Date(`${today}T00:00:00`);
  const fmt = useFmt();
  const listRef = useRef<HTMLDivElement>(null);

  // 放不下的整行直接藏掉，不留半截被切开的文字
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (scroll) {
      Array.from(el.children).forEach((r) => r.classList.remove("is-clipped"));
      return;
    }

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
  }, [tasks, scroll]);

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
      <TaskRow
        key={t.id}
        task={t}
        today={today}
        onToggle={onToggle}
        onDelete={onDelete}
        onRename={onRename}
        onMenu={onMenu}
      />,
    );
  }

  return (
    <aside className="today">
      <div className="today-head">
        <div className="today-num">{d.getDate()}</div>
        <div className="today-sub">
          {fmt.weekday(d)} · {fmt.month(d)}
        </div>
      </div>
      <div className={`today-list${scroll ? " is-scroll" : ""}`} ref={listRef}>
        {rows.length === 0 && <div className="today-empty" />}
        {rows}
      </div>
    </aside>
  );
}
