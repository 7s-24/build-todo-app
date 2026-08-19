"use client";

import { useState } from "react";
import TaskRow from "./TaskRow";
import type { CalEvent, ISODate, Priority, TaskDTO } from "@/lib/types";

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

/**
 * 手机月视图下半屏：被点中那天的详情。
 *
 * 网格只回答「这天有没有事」，具体是什么在这里 —— 苹果日历就是这么分工的。
 * 格子里放不下的东西（事件标题、截止日、新建输入框）都收在这。
 */
export default function DayDetail({
  date,
  today,
  tasks,
  events,
  locked,
  priority,
  onToggle,
  onDelete,
  onRename,
  onMenu,
  onAdd,
  onLock,
}: {
  date: ISODate;
  today: ISODate;
  tasks: TaskDTO[];
  events: CalEvent[];
  locked: boolean;
  priority: Priority;
  onToggle: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onRename: (task: TaskDTO, title: string) => void;
  onMenu: (task: TaskDTO, x: number, y: number) => void;
  onAdd: (title: string, priority: Priority, date: ISODate) => void;
  onLock: (date: ISODate, locked: boolean) => void;
}) {
  const [draft, setDraft] = useState("");
  const d = new Date(`${date}T00:00:00`);

  function commit() {
    const title = draft.trim();
    if (!title) return;
    onAdd(title, priority, date);
    setDraft("");
  }

  return (
    <section className={`detail${locked ? " is-locked" : ""}`}>
      <div className="detail-head">
        <span className="detail-date">
          {d.getMonth() + 1}月{d.getDate()}日
        </span>
        <span className="detail-week">星期{WEEKDAY[d.getDay()]}</span>
        <div className="bar-spacer" />
        {/* 锁定在这里是个看得见的开关，不用去猜长按 */}
        <button
          className={`detail-lock${locked ? " is-on" : ""}`}
          onClick={() => onLock(date, !locked)}
        />
      </div>

      <div className="detail-body">
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            today={today}
            onToggle={onToggle}
            onDelete={onDelete}
            onRename={onRename}
            onMenu={onMenu}
          />
        ))}

        {events.map((ev, i) => (
          <div className={`ev${ev.shared ? " is-shared" : ""}`} key={`${ev.title}-${i}`}>
            {ev.time && <span className="ev-time">{ev.time}</span>}
            <span>{ev.title}</span>
          </div>
        ))}

        {tasks.length === 0 && events.length === 0 && <div className="today-empty" />}
      </div>

      {/* 锁定的日子不接受新任务，输入框直接不给 */}
      {!locked && (
        <input
          className="detail-add"
          value={draft}
          placeholder="—"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            commit();
          }}
        />
      )}
    </section>
  );
}
