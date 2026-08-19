import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = ReturnType<typeof make>;

function make() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL 未设置。复制 .env.example 为 .env.local 并填入 Neon 连接串。",
    );
  }
  return drizzle(neon(url), { schema });
}

let cached: DB | null = null;

/** 懒初始化，避免缺少 DATABASE_URL 时构建期就崩 */
export function getDb(): DB {
  if (!cached) cached = make();
  return cached;
}
