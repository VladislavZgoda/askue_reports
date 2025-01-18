declare type TransSubs = {
  transSubs:
    | {
        id: number;
        name: string;
      }[]
    | undefined;
  q: string | null | undefined;
};

declare type BalanceType = "Быт" | "ЮР Sims" | "ЮР П2" | "ОДПУ Sims" | "ОДПУ П2";

declare type MetersValues = {
  quantity: number;
  type: BalanceType;
  date: string;
  transformerSubstationId: number;
};

declare type InsertMetersValues = MetersValues & {
  added_to_system: number;
};

declare type YearMetersValues = InsertMetersValues & {
  year: number;
};

declare type MonthMetersValues = YearMetersValues & {
  month: string;
};

declare type CheckRecordValues = {
  type: BalanceType;
  date: string;
  transformerSubstationId: number;
};

declare type SelectYearQuantity = CheckRecordValues & {
  year: number;
};

declare type SelectMonthQuantity = SelectYearQuantity & {
  month: string;
};

declare type LastQuantity = {
  transformerSubstationId: number;
  type: BalanceType;
};

declare type LastYearQuantity = LastQuantity & {
  year: number;
};

declare type LastMonthQuantity = LastYearQuantity & {
  month: string;
};

declare type TotalMeters = {
  quantity: number;
  added_to_system: number;
};

declare type SubmitButtonValues = {
  buttonValue: string;
  isSubmitting: boolean;
};

declare type UpdateOnIdType = {
  id: number;
  quantity: number;
};

declare type UpdateTotalMetersType = {
  totalMeters: number;
  inSystemTotal: number;
  id: number;
  type: BalanceType;
  date: string;
};

declare type UpdateYearOnIdType = UpdateOnIdType & {
  added_to_system: number;
};

declare type UpdateTotalYearMetersType = {
  year: number;
  id: number;
  type: BalanceType;
  date: string;
  inSystemYear: number;
  yearTotal: number;
};

declare type UpdateMonthOnIdType = UpdateYearOnIdType;

declare type UpdateTotalMonthMetersType = {
  year: number;
  id: number;
  type: BalanceType;
  date: string;
  month: string;
  monthTotal: number;
  inSystemMonth: number;
};

declare type InputType = {
  defValue: number;
  name: string;
  label: string;
  error?: string | undefined;
  errors?: boolean;
};

declare type DbData = {
  inSystem: number;
  notInSystem: number;
};

declare type QuantityForInsert = {
  transformerSubstationId: number;
  type: BalanceType;
  date: string;
};
