import {
  pgTable,
  serial,
  text,
  date,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

/** priority: 1 = 最急, 2 = 普通, 3 = 可缓 */
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: date("date").notNull(),
  priority: integer("priority").notNull().default(2),
  done: boolean("done").notNull().default(false),
  doneAt: timestamp("done_at", { withTimezone: true }),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** 只存被显式改动过的日子，其余按默认（未锁定）处理 */
export const days = pgTable("days", {
  date: date("date").primaryKey(),
  locked: boolean("locked").notNull().default(false),
});

/** 单用户，永远只有 id = 1 这一行 */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  dailyLimit: integer("daily_limit").notNull().default(5),
  /** 一行一个订阅地址 */
  icsUrls: text("ics_urls"),
  showCalendar: boolean("show_calendar").notNull().default(true),
  theme: text("theme").notNull().default("mono"),
});

export type Task = typeof tasks.$inferSelect;
export type Day = typeof days.$inferSelect;
export type Settings = typeof settings.$inferSelect;
