"use client";

import { useCallback, useRef, useState } from "react";
import { XIcon } from "./icons";
import { isLate } from "./MonthGrid";
import type { ISODate, TaskDTO } from "@/lib/types";

/**
 * 一行任务。队列和月视图 tab 下面的当日详情用的是同一个东西 ——
 * 两处的交互约定必须一模一样，抽出来才不会各写各的。
 *
 * 方框 = 完成，文字 = 改名，右键 / 长按 = 菜单。
 */
export default function TaskRow({
  task,
  today,
  onToggle,
  onDelete,
  onRename,
  onMenu,
}: {
  task: TaskDTO;
  today: ISODate;
  onToggle: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onRename: (task: TaskDTO, title: string) => void;
  onMenu: (task: TaskDTO, x: number, y: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
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
  function startPress(e: React.PointerEvent) {
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

  function commit() {
    const title = draft.trim();
    if (title && title !== task.title) onRename(task, title);
    setEditing(false);
  }

  return (
    <div
      className={[
        "trow",
        task.done ? "is-done" : "",
        task.due ? "has-due" : "",
        isLate(task, today) ? "is-late" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--pc" as string]: `var(--p${task.priority})` }}
      onContextMenu={(e) => {
        e.preventDefault();
        cancelPress();
        onMenu(task, e.clientX, e.clientY);
      }}
      onPointerDown={startPress}
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
      <button className="tbox" onClick={() => onToggle(task)} />

      {editing ? (
        <input
          className="trow-input"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) commit();
            if (e.key === "Escape") setEditing(false);
          }}
        />
      ) : (
        <div
          className="trow-text"
          onClick={() => {
            setDraft(task.title);
            setEditing(true);
          }}
        >
          {task.title}
        </div>
      )}

      {task.due && (
        <span className="trow-due">{task.due.slice(5).replace("-", "/")}</span>
      )}

      <button className="trow-x" onClick={() => onDelete(task)}>
        <XIcon />
      </button>
    </div>
  );
}
