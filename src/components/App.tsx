"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dock from "./Dock";
import MonthGrid from "./MonthGrid";
import Sheet from "./Sheet";
import Sidebar from "./Sidebar";
import TaskMenu from "./TaskMenu";
import AppSwitch from "./AppSwitch";
import LangToggle from "./LangToggle";
import DayDetail from "./DayDetail";
import Projects from "./Projects";
import { CalIcon, Chevron, FlagIcon, GearIcon, GridIcon, ListIcon, SharedCalIcon } from "./icons";
import { monthGrid, shift, todayLocal } from "@/lib/date";
import { useCompact } from "@/lib/useCompact";
import { useFmt } from "@/lib/useFmt";
import type {
  CalEvent,
  ProjectDTO,
  ProjectKind,
  CalendarResult,
  FeedStatus,
  ISODate,
  Priority,
  SettingsDTO,
  StateDTO,
  TaskDTO,
} from "@/lib/types";

const DEFAULT_SETTINGS: SettingsDTO = {
  dailyLimit: 5,
  icsUrls: null,
  showCalendar: true,
  sharedUrls: null,
  showShared: true,
  theme: "mono",
};

function groupBy(items: TaskDTO[]): Map<string, TaskDTO[]> {
  const map = new Map<string, TaskDTO[]>();
  for (const t of items) {
    const list = map.get(t.date);
    if (list) list.push(t);
    else map.set(t.date, [t]);
  }
  return map;
}

function groupEvents(items: CalEvent[]): Map<string, CalEvent[]> {
  const map = new Map<string, CalEvent[]>();
  for (const e of items) {
    const list = map.get(e.date);
    if (list) list.push(e);
    else map.set(e.date, [e]);
  }
  return map;
}

export default function App() {
  const [today] = useState<ISODate>(() => todayLocal());
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<SettingsDTO>(DEFAULT_SETTINGS);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [feeds, setFeeds] = useState<{ own: FeedStatus; shared: FeedStatus }>({
    own: { ok: 0, total: 0 },
    shared: { ok: 0, total: 0 },
  });
  const [priority, setPriority] = useState<Priority>(2);
  const [sheet, setSheet] = useState(false);
  const compact = useCompact();
  const fmt = useFmt();
  // 手机上队列和月视图分成两个 tab，队列是默认那个
  const [view, setView] = useState<"queue" | "month" | "projects">("queue");
  const [selected, setSelected] = useState<ISODate>(() => todayLocal());
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [menu, setMenu] = useState<{ task: TaskDTO; x: number; y: number } | null>(null);

  // 窗口 = 当前月视图 ∪ [今天, 今天+180天]。
  // 后半段是给左侧队列用的：它显示的是「我还欠着什么」，
  // 不该因为你翻到别的月份就变了内容。
  const range = useMemo(() => {
    const cells = monthGrid(cursor.year, cursor.month);
    const ahead = shift(today, 180);
    const start = cells[0] < today ? cells[0] : today;
    const end = cells[41] > ahead ? cells[41] : ahead;
    return { start, end };
  }, [cursor, today]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/state?start=${range.start}&end=${range.end}`);
    if (!res.ok) return;
    const data: StateDTO = await res.json();
    setTasks(data.tasks);
    setLocked(new Set(data.locked));
    setSettings(data.settings);
  }, [range]);

  const rolled = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // 每次打开先把过期未完成的任务顺延，再拉数据 ——
      // 反过来会先闪一屏过期任务
      if (!rolled.current) {
        rolled.current = true;
        await fetch("/api/rollover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ today }),
        }).catch(() => {});
      }
      if (alive) await load();
    })();
    return () => {
      alive = false;
    };
  }, [load, today]);

  // 项目面板和日期无关，挂载时拉一次就够
  useEffect(() => {
    let alive = true;
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => alive && setProjects(d.projects ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 两组日历一次拉完、都带标记，显示与否在渲染时过滤 ——
  // 开关因此是即时的，不用等网络
  useEffect(() => {
    if (!settings.icsUrls && !settings.sharedUrls) {
      setEvents([]);
      return;
    }
    let alive = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch(
      `/api/calendar?start=${range.start}&end=${range.end}&tz=${encodeURIComponent(tz)}`,
    )
      .then((r) =>
        r.ok
          ? r.json()
          : { events: [], own: { ok: 0, total: 0 }, shared: { ok: 0, total: 0 } },
      )
      .then((d: CalendarResult) => {
        if (!alive) return;
        setEvents(d.events ?? []);
        setFeeds({ own: d.own, shared: d.shared });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [range, settings.icsUrls, settings.sharedUrls]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  // 回到今天所在的月份
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "t" || e.metaKey || e.ctrlKey) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) return;
      const d = new Date();
      setCursor({ year: d.getFullYear(), month: d.getMonth() });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const addTask = useCallback(
    async (
      title: string,
      p: Priority,
      // date = 点格子时指定「排在哪天」；due = 底部输入框填的最晚完成日期
      opts: { date?: ISODate; due?: ISODate } = {},
    ) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority: p, today, ...opts }),
      });
      if (!res.ok) return;
      const created: TaskDTO = await res.json();
      // 自动排期可能把任务放到当前窗口之外，那种情况下只能靠翻月看到
      setTasks((prev) =>
        created.date >= range.start && created.date <= range.end
          ? [...prev, created]
          : prev,
      );
    },
    [today, range],
  );

  /** 乐观更新 + 失败回滚，改完成 / 优先级 / 日期 / 截止日都走这条 */
  const patchTask = useCallback(
    async (task: TaskDTO, patch: Partial<TaskDTO>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...patch } : t)),
      );
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        return;
      }
      const saved: TaskDTO = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    },
    [],
  );

  const toggleTask = useCallback(
    (task: TaskDTO) => patchTask(task, { done: !task.done }),
    [patchTask],
  );

  const renameTask = useCallback(
    (task: TaskDTO, title: string) => patchTask(task, { title }),
    [patchTask],
  );

  const moveTask = useCallback(
    (task: TaskDTO, date: ISODate) => patchTask(task, { date }),
    [patchTask],
  );

  const deleteTask = useCallback(async (task: TaskDTO) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
  }, []);

  const toggleLock = useCallback(async (date: ISODate, next: boolean) => {
    setLocked((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(date);
      else copy.delete(date);
      return copy;
    });
    await fetch("/api/days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, locked: next }),
    });
  }, []);

  const addProject = useCallback(async (title: string, kind: ProjectKind) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, kind }),
    });
    if (!res.ok) return;
    const created: ProjectDTO = await res.json();
    setProjects((prev) => [...prev, created]);
  }, []);

  const patchProject = useCallback(
    async (project: ProjectDTO, patch: Partial<ProjectDTO>) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, ...patch } : p)),
      );
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
      }
    },
    [],
  );

  const deleteProject = useCallback(async (project: ProjectDTO) => {
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
  }, []);

  const patchSettings = useCallback(async (patch: Partial<SettingsDTO>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) setSettings(await res.json());
  }, []);

  const menuTask = menu ? (tasks.find((t) => t.id === menu.task.id) ?? null) : null;

  const byDate = useMemo(() => groupBy(tasks), [tasks]);
  const eventsByDate = useMemo(
    () =>
      groupEvents(
        events.filter((e) =>
          e.shared ? settings.showShared : settings.showCalendar,
        ),
      ),
    [events, settings.showCalendar, settings.showShared],
  );
  // 队列只放未完成的 —— 它回答的是「还剩多少」，勾掉的不该继续占位置
  const queue = useMemo(
    () =>
      tasks
        .filter((t) => !t.done)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            a.priority - b.priority ||
            a.id - b.id,
        ),
    [tasks],
  );

  const showMonth = !compact || view === "month";

  function step(delta: number) {
    setCursor((c) => {
      const m = c.month + delta;
      return {
        year: c.year + Math.floor(m / 12),
        month: ((m % 12) + 12) % 12,
      };
    });
  }

  return (
    <div className="app">
      <header className="bar">
        <AppSwitch />
        {compact && (
          <div className="tabs">
            <button
              className={`tab-btn${view === "queue" ? " is-on" : ""}`}
              onClick={() => setView("queue")}
            >
              <ListIcon />
            </button>
            <button
              className={`tab-btn${view === "month" ? " is-on" : ""}`}
              onClick={() => setView("month")}
            >
              <GridIcon />
            </button>
            <button
              className={`tab-btn${view === "projects" ? " is-on" : ""}`}
              onClick={() => setView("projects")}
            >
              <FlagIcon />
            </button>
          </div>
        )}

        {showMonth && (
          <>
            <button className="nav" onClick={() => step(-1)}>
              <Chevron dir="left" />
            </button>
            <button className="nav" onClick={() => step(1)}>
              <Chevron dir="right" />
            </button>
            <div className="bar-title">
              {fmt.monthOfIndex(cursor.month)}
              {!compact && <em>{cursor.year}</em>}
            </div>
          </>
        )}

        <div className="bar-spacer" />

        {/* 日历开关只在能看到日历的时候才有意义 */}
        {showMonth && (
          <>
            <button
              className={`icon-btn${settings.showCalendar ? " is-on" : ""}`}
              onClick={() => patchSettings({ showCalendar: !settings.showCalendar })}
            >
              <CalIcon on={settings.showCalendar} />
            </button>
            <button
              className={`icon-btn${settings.showShared ? " is-on" : ""}`}
              onClick={() => patchSettings({ showShared: !settings.showShared })}
            >
              <SharedCalIcon on={settings.showShared} />
            </button>
          </>
        )}

        <LangToggle />
        <button className="icon-btn" onClick={() => setSheet(true)}>
          <GearIcon />
        </button>
      </header>

      <div className="body">
        {(!compact || view === "queue") && (
          <Sidebar
            today={today}
            tasks={queue}
            scroll={compact}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onRename={renameTask}
            onMenu={(task, x, y) => setMenu({ task, x, y })}
          />
        )}
        {showMonth && (
        <MonthGrid
          year={cursor.year}
          month={cursor.month}
          today={today}
          tasks={byDate}
          events={eventsByDate}
          locked={locked}
          dailyLimit={settings.dailyLimit}
          priority={priority}
          onToggle={toggleTask}
          onLock={toggleLock}
          onAdd={(title, p, date) => addTask(title, p, { date })}
          onMove={moveTask}
          onMenu={(task, x, y) => setMenu({ task, x, y })}
          compact={compact}
          selected={compact ? selected : null}
          onSelect={setSelected}
        />
        )}
        {(!compact || view === "projects") && (
          <Projects
            projects={projects}
            onAdd={addProject}
            onRename={(p, title) => patchProject(p, { title })}
            onMove={(p, kind) => patchProject(p, { kind })}
            onDelete={deleteProject}
          />
        )}
        {compact && view === "month" && (
          <DayDetail
            date={selected}
            today={today}
            tasks={byDate.get(selected) ?? []}
            events={eventsByDate.get(selected) ?? []}
            locked={locked.has(selected)}
            priority={priority}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onRename={renameTask}
            onMenu={(task, x, y) => setMenu({ task, x, y })}
            onAdd={(title, p, date) => addTask(title, p, { date })}
            onLock={toggleLock}
          />
        )}
      </div>

      <Dock
        priority={priority}
        onPriority={setPriority}
        onAdd={(title, p, due) => addTask(title, p, { due })}
      />

      {menu && menuTask && (
        <TaskMenu
          task={menuTask}
          x={menu.x}
          y={menu.y}
          onPatch={(patch) => patchTask(menuTask, patch)}
          onDelete={() => {
            deleteTask(menuTask);
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}

      {sheet && (
        <Sheet
          settings={settings}
          feeds={feeds}
          onPatch={patchSettings}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  );
}
