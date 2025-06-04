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

declare interface YearlyMetersQueryParams {
  totalInstalled: number;
  registeredCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  transformerSubstationId: number;
  year: number;
}

declare interface MetersValues {
  quantity: number;
  balanceGroup: BalanceGroup;
  date: string;
  transformerSubstationId: number;
}

declare interface InsertMetersValues extends MetersValues {
  addedToSystem: number;
}

declare interface YearMetersValues extends InsertMetersValues {
  year: number;
}

declare interface MonthMetersValues extends YearMetersValues {
  month: string;
}

declare interface MeterCountQueryParams {
  balanceGroup: BalanceGroup;
  targetDate: string;
  dateComparison: "before" | "upTo";
  transformerSubstationId: number;
}

declare interface YearlyMeterCountQueryParams extends MeterCountQueryParams {
  year: number;
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

declare interface TotalMeters {
  quantity: number;
  addedToSystem: number;
}

declare interface SubmitButtonValues {
  buttonValue: string;
  isSubmitting: boolean;
}

declare interface UpdateOnIdType {
  id: number;
  quantity: number;
}

declare interface UpdateTotalMetersType {
  totalMeters: number;
  inSystemTotal: number;
  id: number;
  balanceGroup: BalanceGroup;
  date: string;
}

declare interface UpdateYearOnIdType extends UpdateOnIdType {
  addedToSystem: number;
}

declare interface UpdateTotalYearMetersType {
  year: number;
  id: number;
  balanceGroup: BalanceGroup;
  date: string;
  inSystemYear: number;
  yearTotal: number;
}

declare type UpdateMonthOnIdType = UpdateYearOnIdType;

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

declare interface DbData {
  inSystem: number;
  notInSystem: number;
}

declare interface QuantityForInsert {
  transformerSubstationId: number;
  balanceGroup: BalanceGroup;
  date: string;
}
