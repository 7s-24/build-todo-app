import type { Priority } from "./schedule";
import type { ISODate } from "./date";

export type { Priority, ISODate };

export interface TaskDTO {
  id: number;
  title: string;
  date: ISODate;
  priority: Priority;
  done: boolean;
  position: number;
}

export interface SettingsDTO {
  dailyLimit: number;
  icsUrl: string | null;
  showCalendar: boolean;
  theme: string;
}

export interface CalEvent {
  date: ISODate;
  title: string;
  allDay: boolean;
  time: string | null; // HH:mm，全天事件为 null
}

export interface StateDTO {
  tasks: TaskDTO[];
  locked: ISODate[];
  settings: SettingsDTO;
}
