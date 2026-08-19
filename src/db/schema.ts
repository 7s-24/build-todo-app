import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  date,
  boolean,
  integer,
  numeric,
  timestamp,
  uniqueIndex,
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


/* ===========================================================
   账簿
   录入仍然在喵喵记账里做，这边只接它导出的 CSV。
   Excel 里 Raw 之下全是公式；这里只存 Raw 对应的原始字段，
   分组、汇率换算、透视、净值一律算出来，不落库。
   =========================================================== */

export const txns = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    /** 喵喵的分类名，映射到 (group, detail) 靠 categories 表 */
    category: text("category").notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    /** 按喵喵原样：支出为负、收入为正 */
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("日元"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  /**
   * 去重直接建在原始字段上。导出区间会重叠，同一笔重复上传必须是无害的。
   * 不另存一列指纹 —— 那样「怎么算指纹」就成了第二份真相，
   * 换个语言算一遍就对不上了。note 为空要归一，否则 NULL 之间互不冲突。
   */
  (t) => [
    uniqueIndex("txns_dedupe_idx").on(
      t.category,
      t.occurredAt,
      t.amount,
      t.currency,
      sql`coalesce(${t.note}, '')`,
    ),
  ],
);

/** 喵喵分类 → Group / Detail。Excel 里的 Reference!A:C */
export const categories = pgTable("categories", {
  name: text("name").primaryKey(),
  group: text("group").notNull(),
  detail: text("detail").notNull(),
  position: integer("position").notNull().default(0),
});

/** 固定近似汇率，不是实时价 —— 只有明确要求时才改 */
export const fxRates = pgTable("fx_rates", {
  currency: text("currency").primaryKey(),
  rate: numeric("rate", { precision: 12, scale: 4 }).notNull(),
});

/** 单行，id 恒为 1 */
export const ledgerSettings = pgTable("ledger_settings", {
  id: integer("id").primaryKey().default(1),
  needsTarget: numeric("needs_target", { precision: 5, scale: 4 }).notNull().default("0.6"),
  wantsTarget: numeric("wants_target", { precision: 5, scale: 4 }).notNull().default("0.1"),
  investmentTarget: numeric("investment_target", { precision: 5, scale: 4 })
    .notNull()
    .default("0.3"),
  /** 净值的起点。默认 0 —— 流水只从 2024-01 开始记 */
  startBank: numeric("start_bank", { precision: 14, scale: 2 }).notNull().default("0"),
  startInvestment: numeric("start_investment", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
});

export type Txn = typeof txns.$inferSelect;
export type Category = typeof categories.$inferSelect;
