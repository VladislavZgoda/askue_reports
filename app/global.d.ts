declare interface TransSubs {
  transSubs:
    | {
        id: number;
        name: string;
      }[]
    | undefined;
  q: string | null | undefined;
}

declare type BalanceGroup =
  | "Быт"
  | "ЮР Sims"
  | "ЮР П2"
  | "ОДПУ Sims"
  | "ОДПУ П2";

declare interface MetersValues {
  quantity: number;
  balanceGroup: BalanceGroup;
  date: string;
  transformerSubstationId: number;
}

declare interface InsertMetersValues extends MetersValues {
  added_to_system: number;
}

declare interface YearMetersValues extends InsertMetersValues {
  year: number;
}

declare interface MonthMetersValues extends YearMetersValues {
  month: string;
}

declare interface CheckRecordValues {
  balanceGroup: BalanceGroup;
  date: string;
  transformerSubstationId: number;
}

declare interface SelectYearQuantity extends CheckRecordValues {
  year: number;
}

declare interface SelectMonthQuantity extends SelectYearQuantity {
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
  added_to_system: number;
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
  added_to_system: number;
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
