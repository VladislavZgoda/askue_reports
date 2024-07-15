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
  labelName: string,
  inputName: string
};

export type BalanceType = 'Быт' | 'ЮР Sims' | 'ЮР П2' | 'ОДПУ Sims' | 'ОДПУ П2';

export type ActionValues = {
  transSubId: string;
  newMeters: string;
  addedToSystem: string;
  type: BalanceType;
  date: string;
}

export type MetersValues = {
  quantity: number,
  type: BalanceType,
  date: string,
  transformerSubstationId: number
};

export interface YearMetersValues extends MetersValues {
  year: number,
  added_to_system: number
}

export type CheckRecordValues = {
  type: BalanceType,
  date: string,
  transformerSubstationId: number
}
