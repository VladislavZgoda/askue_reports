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