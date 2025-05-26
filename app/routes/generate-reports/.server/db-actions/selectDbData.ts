import { selectMetersOnDate } from "~/.server/db-queries/electricityMeters";
import { selectNotInSystemOnDate } from "~/.server/db-queries/notInSystemTable";
import { selectYearMetersOnDate } from "~/.server/db-queries/newYearMetersTable";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";
import type { FormData } from "../../generateReports";

import {
  selectMonthMetersOnDate,
  selectMonthPeriodMeters,
} from "~/.server/db-queries/newMonthMetersTable";

export type TransSubs = {
  id: number;
  name: string;
}[];

export type MetersType = Record<string, number>;

interface SelectMetersArgs {
  transSubs: TransSubs;
  type: BalanceType;
  date: FormDataEntryValue;
  func: ({
    type,
    date,
    transformerSubstationId,
  }: CheckRecordValues) => Promise<number>;
}

export async function selectMeters({
  transSubs,
  type,
  date,
  func,
}: SelectMetersArgs) {
  const meters: MetersType = {};

  for (const transSub of transSubs) {
    const quantity = await func({
      type,
      date: date as string,
      transformerSubstationId: transSub.id,
    });

    meters[transSub.name] = quantity;
  }

  return meters;
}

export interface DifferentMeters {
  sims: MetersType;
  p2: MetersType;
}

export async function selectLegalMeters(
  transSubs: TransSubs,
  date: FormDataEntryValue,
) {
  const [sims, p2] = await Promise.all([
    selectMeters({
      transSubs,
      type: "ЮР Sims",
      date,
      func: selectMetersOnDate,
    }),
    selectMeters({
      transSubs,
      type: "ЮР П2",
      date,
      func: selectMetersOnDate,
    }),
  ]);

  const meters: DifferentMeters = {
    sims,
    p2,
  };

  return meters;
}

export async function selectNotInSystem(
  transSubs: TransSubs,
  formData: FormData,
) {
  const [privateMeters, legalMetersSims, legalMetersP2] = await Promise.all([
    selectMeters({
      transSubs,
      type: "Быт",
      date: formData.privateDate,
      func: selectNotInSystemOnDate,
    }),
    selectMeters({
      transSubs,
      type: "ЮР Sims",
      date: formData.legalDate,
      func: selectNotInSystemOnDate,
    }),
    selectMeters({
      transSubs,
      type: "ЮР П2",
      date: formData.legalDate,
      func: selectNotInSystemOnDate,
    }),
  ]);

  const meters: MetersType = {};

  for (const transSub of transSubs) {
    const name = transSub.name;

    const privateM = privateMeters[name];
    const legalSims = legalMetersSims[name];
    const legalP2 = legalMetersP2[name];

    meters[name] = privateM + legalSims + legalP2;
  }

  return meters;
}

type PeriodMetersType = Record<
  string,
  {
    quantity: number;
    added_to_system: number;
  }
>;

interface FuncArgs {
  type: BalanceType;
  date: string;
  year: number;
}

interface GetPeriodMeters {
  transSubs: TransSubs;
  type: BalanceType;
  date: string;
  periodType?: "month";
}

async function getPeriodMeters({
  transSubs,
  type,
  date,
  periodType,
}: GetPeriodMeters) {
  const meters: PeriodMetersType = {};

  const year = cutOutYear(date);
  const month = cutOutMonth(date);

  const args: FuncArgs = {
    type,
    date,
    year,
  };

  let data: {
    quantity: number;
    added_to_system: number;
  };

  for (const transSub of transSubs) {
    if (periodType === "month") {
      data = await selectMonthMetersOnDate({
        transformerSubstationId: transSub.id,
        month,
        ...args,
      });
    } else {
      data = await selectYearMetersOnDate({
        transformerSubstationId: transSub.id,
        ...args,
      });
    }

    meters[transSub.name] = data;
  }

  return meters;
}

interface SelectPeriodMeters {
  transSubs: TransSubs;
  formData: FormData;
  periodType?: "month";
}

export async function selectPeriodMeters({
  transSubs,
  formData,
  periodType,
}: SelectPeriodMeters) {
  const [privateMeters, legalMetersSims, legalMetersP2] = await Promise.all([
    getPeriodMeters({
      transSubs,
      type: "Быт",
      date: formData.privateDate,
      periodType,
    }),
    getPeriodMeters({
      transSubs,
      type: "ЮР Sims",
      date: formData.legalDate,
      periodType,
    }),
    getPeriodMeters({
      transSubs,
      type: "ЮР П2",
      date: formData.legalDate,
      periodType,
    }),
  ]);

  const meters: PeriodMetersType = {};

  for (const transSub of transSubs) {
    const name = transSub.name;

    const privateM = privateMeters[name];
    const legalSims = legalMetersSims[name];
    const legalP2 = legalMetersP2[name];

    const quantity =
      (privateM?.quantity ?? 0) +
      (legalSims?.quantity ?? 0) +
      (legalP2?.quantity ?? 0);

    const added_to_system =
      (privateM?.added_to_system ?? 0) +
      (legalSims?.added_to_system ?? 0) +
      (legalP2?.added_to_system ?? 0);

    meters[name] = { quantity, added_to_system };
  }

  return meters;
}

export async function selectMonthMeters(
  transSubs: TransSubs,
  formData: FormData,
) {
  const meters = await selectPeriodMeters({
    transSubs,
    formData,
    periodType: "month",
  });

  if (formData?.privateMonth) {
    const date = formData.privateMonth;
    await addPreviousMonth(transSubs, meters, date, "Быт");
  }

  if (formData?.legalMonth) {
    const date = formData.legalMonth;
    await addPreviousMonth(transSubs, meters, date, "ЮР Sims");
    await addPreviousMonth(transSubs, meters, date, "ЮР П2");
  }

  return meters;
}

async function addPreviousMonth(
  transSubs: TransSubs,
  meters: PeriodMetersType,
  date: string,
  type: BalanceType,
) {
  const year = cutOutYear(date);
  const month = cutOutMonth(date);
  const lastMonthDatePrivate = selectLastMonthDate(year, Number(month));

  for (const transSub of transSubs) {
    const periodMeters = await selectMonthPeriodMeters({
      type,
      firstDate: date,
      lastDate: lastMonthDatePrivate,
      transformerSubstationId: transSub.id,
    });

    if (typeof periodMeters === "undefined") continue;

    const metersBeforeFirstDate = await selectMonthMetersOnDate({
      transformerSubstationId: transSub.id,
      type,
      date,
      month,
      year,
    });

    const quantity =
      periodMeters.quantity - (metersBeforeFirstDate?.quantity ?? 0);

    const addedToSystem =
      periodMeters.added_to_system -
      (metersBeforeFirstDate?.added_to_system ?? 0);

    meters[transSub.name].quantity += quantity;
    meters[transSub.name].added_to_system += addedToSystem;
  }
}

function selectLastMonthDate(year: number, month: number) {
  // Первый месяц имеет индекс 0,
  // поэтому month здесь это следующий месяц, а не текущий.
  // При передаче 0 в "date?: number" даст последний день предыдущего месяца.
  const lastDayOfMonth = new Date(year, month, 0).toLocaleDateString("en-CA");

  return lastDayOfMonth;
}

export interface Odpy {
  quantity: number;
  notInSystem: number;
  year: {
    quantity: number;
    added_to_system: number;
  };
  month: {
    quantity: number;
    added_to_system: number;
  };
}

export async function calculateOdpy(formData: FormData, transSubs: TransSubs) {
  const odpyData = {
    quantity: 0,
    notInSystem: 0,
    year: {
      quantity: 0,
      added_to_system: 0,
    },
    month: {
      quantity: 0,
      added_to_system: 0,
    },
  };

  const year = cutOutYear(formData.odpyDate);
  const month = cutOutMonth(formData.odpyDate);

  for (const transSub of transSubs) {
    const [
      quantitySims,
      quantityP2,
      notInSystemSims,
      notInSystemP2,
      yearSims,
      yearP2,
      monthSims,
      monthP2,
    ] = await Promise.all([
      selectMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ Sims",
        date: formData.odpyDate,
      }),
      selectMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ П2",
        date: formData.odpyDate,
      }),
      selectNotInSystemOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ Sims",
        date: formData.odpyDate,
      }),
      selectNotInSystemOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ П2",
        date: formData.odpyDate,
      }),
      selectYearMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ Sims",
        date: formData.odpyDate,
        year,
      }),
      selectYearMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ П2",
        date: formData.odpyDate,
        year,
      }),
      selectMonthMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ Sims",
        date: formData.odpyDate,
        month,
        year,
      }),
      selectMonthMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ П2",
        date: formData.odpyDate,
        month,
        year,
      }),
    ]);

    odpyData.quantity += quantitySims + quantityP2;
    odpyData.notInSystem += notInSystemSims + notInSystemP2;
    odpyData.year.quantity +=
      (yearSims?.quantity ?? 0) + (yearP2?.quantity ?? 0);
    odpyData.year.added_to_system +=
      (yearSims?.added_to_system ?? 0) + (yearP2?.added_to_system ?? 0);
    odpyData.month.quantity +=
      (monthSims?.quantity ?? 0) + (monthP2?.quantity ?? 0);
    odpyData.month.added_to_system +=
      (monthSims?.added_to_system ?? 0) + (monthP2?.added_to_system ?? 0);
  }

  if (formData?.odpyMonth) {
    const date = formData.odpyMonth;
    const prevMonthMeters = await calculatePreviousMonthOdpy(transSubs, date);
    odpyData.month.quantity += prevMonthMeters.quantity;
    odpyData.month.added_to_system += prevMonthMeters.addedToSystem;
  }

  return odpyData;
}

async function calculatePreviousMonthOdpy(transSubs: TransSubs, date: string) {
  const year = cutOutYear(date);
  const month = cutOutMonth(date);
  const lastMonthDatePrivate = selectLastMonthDate(year, Number(month));

  const meters = {
    quantity: 0,
    addedToSystem: 0,
  };

  const calculate = async (type: "ОДПУ Sims" | "ОДПУ П2") => {
    for (const transSub of transSubs) {
      const periodMeters = await selectMonthPeriodMeters({
        type,
        firstDate: date,
        lastDate: lastMonthDatePrivate,
        transformerSubstationId: transSub.id,
      });

      if (typeof periodMeters === "undefined") continue;

      const metersBeforeFirstDate = await selectMonthMetersOnDate({
        transformerSubstationId: transSub.id,
        type,
        date: date,
        month,
        year,
      });

      const quantity =
        periodMeters.quantity - (metersBeforeFirstDate?.quantity ?? 0);

      const addedToSystem =
        periodMeters.added_to_system -
        (metersBeforeFirstDate?.added_to_system ?? 0);

      meters.quantity += quantity;
      meters.addedToSystem += addedToSystem;
    }
  };

  await calculate("ОДПУ Sims");
  await calculate("ОДПУ П2");

  return meters;
}
