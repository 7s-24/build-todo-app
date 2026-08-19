"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Dock from "./Dock";
import MonthGrid from "./MonthGrid";
import Sheet from "./Sheet";
import TodayPane from "./TodayPane";
import { CalIcon, Chevron, GearIcon } from "./icons";
import { monthGrid, todayLocal } from "@/lib/date";
import type {
  CalEvent,
  CalendarResult,
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
  const [feeds, setFeeds] = useState({ ok: 0, total: 0 });
  const [priority, setPriority] = useState<Priority>(2);
  const [sheet, setSheet] = useState(false);

  // 视图窗口要把「今天」也包进去，否则翻到别的月份时今日栏会空
  const range = useMemo(() => {
    const cells = monthGrid(cursor.year, cursor.month);
    const start = cells[0] < today ? cells[0] : today;
    const end = cells[41] > today ? cells[41] : today;
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

  useEffect(() => {
    void load();
  }, [load]);

  // 日历是「参考」，关掉时直接不拉，省得白跑一趟
  useEffect(() => {
    if (!settings.showCalendar || !settings.icsUrls) {
      setEvents([]);
      return;
    }
    let alive = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch(
      `/api/calendar?start=${range.start}&end=${range.end}&tz=${encodeURIComponent(tz)}`,
    )
      .then((r) => (r.ok ? r.json() : { events: [], ok: 0, total: 0 }))
      .then((d: CalendarResult) => {
        if (!alive) return;
        setEvents(d.events ?? []);
        setFeeds({ ok: d.ok ?? 0, total: d.total ?? 0 });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [range, settings.showCalendar, settings.icsUrls]);

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
    async (title: string, p: Priority, date?: ISODate) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority: p, date, today }),
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

  const toggleTask = useCallback(async (task: TaskDTO) => {
    const done = !task.done;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done } : t)),
    );
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    if (!res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: !done } : t)),
      );
    }
  }, []);

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

  const patchSettings = useCallback(async (patch: Partial<SettingsDTO>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) setSettings(await res.json());
  }, []);

  const byDate = useMemo(() => groupBy(tasks), [tasks]);
  const eventsByDate = useMemo(() => groupEvents(events), [events]);
  const todayTasks = useMemo(
    () =>
      (byDate.get(today) ?? [])
        .slice()
        .sort((a, b) => Number(a.done) - Number(b.done) || a.priority - b.priority),
    [byDate, today],
  );

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
        <button className="nav" onClick={() => step(-1)}>
          <Chevron dir="left" />
        </button>
        <button className="nav" onClick={() => step(1)}>
          <Chevron dir="right" />
        </button>
        <div className="bar-title">
          {cursor.month + 1}月<em>{cursor.year}</em>
        </div>
        <div className="bar-spacer" />
        <button
          className={`icon-btn${settings.showCalendar ? " is-on" : ""}`}
          onClick={() => patchSettings({ showCalendar: !settings.showCalendar })}
        >
          <CalIcon on={settings.showCalendar} />
        </button>
        <button className="icon-btn" onClick={() => setSheet(true)}>
          <GearIcon />
        </button>
      </header>

      <div className="body">
        <TodayPane
          today={today}
          tasks={todayTasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
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
          onAdd={addTask}
        />
      </div>

      <Dock
        priority={priority}
        onPriority={setPriority}
        onAdd={(title, p) => addTask(title, p)}
      />

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
