export type TransSubs = {
  transSubs: {
    id: number;
    name: string;
  }[] | undefined,
  q: string | null | undefined
};

export type TransSubName = {
  transSub: {
    id: number;
    name: string;
  } | undefined,
  isSubmitting: boolean,
  actionData: {
    error: string;
    name: string;
  } | undefined,
  formAction: string,
  buttonNames: {
    submitName: string;
    idleName: string;
  }
};

export type BalanceType = 'Быт' | 'ЮР Sims' | 'ЮР П2' | 'ОДПУ Sims' | 'ОДПУ П2';

export type MetersValues = {
  quantity: number,
  type: BalanceType,
  date: string,
  transformerSubstationId: number
};

export interface InsertMetersValues extends MetersValues {
  added_to_system: number
}

export interface YearMetersValues extends InsertMetersValues {
  year: number
}

export interface MonthMetersValues extends YearMetersValues {
  month: string
}

export type CheckRecordValues = {
  type: BalanceType,
  date: string,
  transformerSubstationId: number
};

export interface SelectYearQuantity extends CheckRecordValues {
  year: number
}

export interface SelectMonthQuantity extends SelectYearQuantity {
  month: string
}

export type LastQuantity = {
  transformerSubstationId: number,
  type: BalanceType
};

export interface LastYearQuantity extends LastQuantity {
  year: number
}

export interface LastMonthQuantity extends LastYearQuantity {
  month: string
}

export type TotalMeters = {
  quantity: number;
  added_to_system: number;
};

export type DisabledLegalMetersValues = {
  quantity: number,
  transformerSubstationId: number
};

export interface FailedMetersValues extends DisabledLegalMetersValues {
  type: BalanceType
}

export type FindFailedMeters = LastQuantity;
export type FailedMetersAction = {
  transSubId: string;
  brokenMeters: string;
  type: BalanceType;
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

export interface UpdateYearOnIdType extends UpdateOnIdType {
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

export type DbDataType = {
  inSystem: number;
  notInSystem: number;
  failedMeters: number;
  disabledMeters?: number;
};

export type QuantityForInsert = {
  transformerSubstationId: number;
  type: BalanceType;
  date: string;
};
