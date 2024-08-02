import type { FetcherWithComponents, FormMethod } from "@remix-run/react";
import type { SerializeFrom } from "@remix-run/node";

export type TransSubs = {
  transSubs: {
    id: number;
    name: string;
  }[],
  q: string | null
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

export type NameForInput = {
  labelName: string;
  inputName: string;
  error: string | undefined;
};

export type BalanceType = 'Быт' | 'ЮР Sims' | 'ЮР П2' | 'ОДПУ Sims' | 'ОДПУ П2';

export type ActionValues = {
  transSubId: string;
  newMeters: string;
  addedToSystem: string;
  type: BalanceType;
  date: string;
};

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

export type TechnicalMetersAction = {
  transSubId: string;
  techMeters: string;
  underVoltage: string;
};

export type TechnicalMetersValues = {
  quantity: number,
  underVoltage: number,
  transformerSubstationId: number
};

export type DisabledLegalMetersAction = {
  transSubId: string;
  disabledMeters: string;
};

export type DisabledLegalMetersValues = {
  quantity: number,
  transformerSubstationId: number
}

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

export type FetcherFormType = {
  children: React.ReactNode;
  fetcher: FetcherWithComponents<SerializeFrom<{
    errors: {
      [k: string]: string;
    };
  }> | null>;
  isSubmitting: boolean;
  metesRef: React.RefObject<HTMLFormElement>;
  h2Title: string;
  formID: string;
};

export type LinkType = {
  id: number;
  name: string;
};

export type NavigateFormType = {
  actionName: string;
  btnText: string;
  onDelete: ((e: React.FormEvent) => void) | undefined;
  methodType: FormMethod;
};

export type DateInputType = {
  labelText: string;
  inputName: string;
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
