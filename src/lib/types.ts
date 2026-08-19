import type { Priority } from "./schedule";
import type { ISODate } from "./date";

export type { Priority, ISODate };

export interface TaskDTO {
  id: number;
  title: string;
  date: ISODate;
  due: ISODate | null;
  priority: Priority;
  done: boolean;
  position: number;
}

export interface SettingsDTO {
  dailyLimit: number;
  icsUrls: string | null; // 自己的，一行一个
  showCalendar: boolean;
  sharedUrls: string | null; // 他人的，一行一个
  showShared: boolean;
  theme: string;
}

/** 拉了几个源、成了几个 —— 让设置面板能显示 "2/3" 这种 */
export interface FeedStatus {
  ok: number;
  total: number;
}

export interface CalendarResult {
  events: CalEvent[];
  own: FeedStatus;
  shared: FeedStatus;
}

export interface CalEvent {
  date: ISODate;
  title: string;
  allDay: boolean;
  time: string | null; // HH:mm，全天事件为 null
  shared: boolean; // 来自他人的日历
}

export interface StateDTO {
  tasks: TaskDTO[];
  locked: ISODate[];
  settings: SettingsDTO;
}
