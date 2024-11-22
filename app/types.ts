export type TransSubs = {
  transSubs: {
    id: number;
    name: string;
  }[] | undefined,
  q: string | null | undefined
};

export type BalanceType = 'Быт' | 'ЮР Sims' | 'ЮР П2' | 'ОДПУ Sims' | 'ОДПУ П2';

export type MetersValues = {
  quantity: number;
  type: BalanceType;
  date: string;
  transformerSubstationId: number;
};

export type InsertMetersValues = MetersValues & {
  added_to_system: number;
};

export type YearMetersValues = InsertMetersValues & {
  year: number;
};

export type MonthMetersValues = YearMetersValues & {
  month: string;
};

export type CheckRecordValues = {
  type: BalanceType;
  date: string;
  transformerSubstationId: number;
};

export type SelectYearQuantity = CheckRecordValues & {
  year: number;
};

export type SelectMonthQuantity = SelectYearQuantity & {
  month: string;
};

export type LastQuantity = {
  transformerSubstationId: number;
  type: BalanceType;
};

export type LastYearQuantity = LastQuantity & {
  year: number;
};

export type LastMonthQuantity = LastYearQuantity & {
  month: string;
};

export type TotalMeters = {
  quantity: number;
  added_to_system: number;
};

export type SubmitButtonValues = {
  buttonValue: string;
  isSubmitting: boolean;
};

export type UpdateOnIdType = {
  id: number;
  quantity: number;
};

export type UpdateTotalMetersType = {
  totalMeters: number;
  inSystemTotal: number;
  id: number;
  type: BalanceType;
  date: string;
};

export type UpdateYearOnIdType = UpdateOnIdType & {
  added_to_system: number;
}

export type UpdateTotalYearMetersType = {
  year: number;
  id: number;
  type: BalanceType;
  date: string;
  inSystemYear: number;
  yearTotal: number;
};

export type UpdateMonthOnIdType = UpdateYearOnIdType;

export type UpdateTotalMonthMetersType = {
  year: number;
  id: number;
  type: BalanceType;
  date: string;
  month: string;
  monthTotal: number;
  inSystemMonth: number;
};

export type InputType = {
  defValue: number;
  name: string;
  label: string;
  error?: string | undefined;
  errors?: boolean;
};

export type DbData = {
  inSystem: number;
  notInSystem: number;
};

export type QuantityForInsert = {
  transformerSubstationId: number;
  type: BalanceType;
  date: string;
};
