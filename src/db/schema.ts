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
  /** 最晚完成日期。只作记录与提醒，不参与自动排期 */
  dueDate: date("due_date"),
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
  /** 自己的日历，一行一个订阅地址 */
  icsUrls: text("ics_urls"),
  showCalendar: boolean("show_calendar").notNull().default(true),
  /** 他人的日历（家人等），一行一个。和自己的分开存、分开开关 */
  sharedUrls: text("shared_urls"),
  showShared: boolean("show_shared").notNull().default(true),
  theme: text("theme").notNull().default("mono"),
});

/**
 * 常驻的科研项目面板。和 tasks 是两回事：
 * 这里只标注「现在在做什么」，不排期、不排序到某一天、没有完成态。
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  /** funded | personal | idea */
  kind: text("kind").notNull().default("idea"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type Day = typeof days.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Project = typeof projects.$inferSelect;
