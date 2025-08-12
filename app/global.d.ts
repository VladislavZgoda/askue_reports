/**
 * Database executor type for transactional operations
 *
 * Handles both regular connections and transactions
 */
declare type Executor =
  | import("app/.server/db").Database
  | import("drizzle-orm/pg-core").PgTransaction<
      import("drizzle-orm/postgres-js").PostgresJsQueryResultHKT,
      typeof import("app/.server/schema"),
      import("drizzle-orm").ExtractTablesWithRelations<
        typeof import("app/.server/schema")
      >
    >;

declare interface TransSubs {
  transSubs:
    | {
        id: number;
        name: string;
      }[]
    | undefined;
  q: string | null | undefined;
}

declare type BalanceGroup = import("app/.server/schema").BalanceGroup;

declare interface MeterCountQueryParams {
  balanceGroup: BalanceGroup;
  targetDate: string;
  dateComparison: "before" | "upTo";
  substationId: number;
}
