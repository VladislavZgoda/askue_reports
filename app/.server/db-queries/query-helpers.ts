import { sql } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

export function increment(column: AnyColumn, value: number) {
  return sql`${column} + ${value}`;
}
