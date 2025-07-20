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

declare interface MeterSelectionCriteria {
  balanceGroup: BalanceGroup;
  date: string;
  transformerSubstationId: number;
}

declare interface YearlyMeterSelectionCriteria extends MeterSelectionCriteria {
  year: number;
}

declare interface MonthlyMeterSelectionCriteria
  extends YearlyMeterSelectionCriteria {
  month: string;
}

declare interface LastQuantity {
  transformerSubstationId: number;
  balanceGroup: BalanceGroup;
}

declare interface LastYearQuantity extends LastQuantity {
  year: number;
}

declare interface LastMonthQuantity extends LastYearQuantity {
  month: string;
}

declare interface SubmitButtonValues {
  buttonValue: string;
  isSubmitting: boolean;
}

declare interface UpdateTotalMetersType {
  totalMeters: number;
  inSystemTotal: number;
  id: number;
  balanceGroup: BalanceGroup;
  date: string;
}

declare interface UpdateTotalYearMetersType {
  year: number;
  id: number;
  balanceGroup: BalanceGroup;
  date: string;
  inSystemYear: number;
  yearTotal: number;
}

declare interface UpdateTotalMonthMetersType {
  year: number;
  id: number;
  balanceGroup: BalanceGroup;
  date: string;
  month: string;
  monthTotal: number;
  inSystemMonth: number;
}

declare interface InputType {
  defValue: number;
  name: string;
  label: string;
  error?: string | undefined;
  errors?: boolean;
}
