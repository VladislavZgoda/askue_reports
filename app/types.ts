import type { NavigateFunction } from "@remix-run/react";

export type TransSubs = {
  transSubs: {
    id: number;
    name: string;
  }[]
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
  navigate: NavigateFunction,
  formAction: string,
  buttonNames: {
    submitName: string;
    idleName: string;
  }
};
