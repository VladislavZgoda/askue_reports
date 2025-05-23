import { selectMetersOnDate } from "~/.server/db-queries/electricityMetersTable";
import { selectNotInSystemOnDate } from "~/.server/db-queries/notInSystemTable";
import { selectYearMetersOnDate } from "~/.server/db-queries/newYearMetersTable";
import {
  selectMonthMetersOnDate,
  selectMonthPeriodMeters,
} from "~/.server/db-queries/newMothMetersTable";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";
import type { FormDates } from "../writeDbData";

export type TransSubs = {
  id: number;
  name: string;
}[];

export type Meters = { [k: string]: number };

type SelectMeters = {
  transSubs: TransSubs;
  type: BalanceType;
  date: FormDataEntryValue;
  func: ({
    type,
    date,
    transformerSubstationId,
  }: CheckRecordValues) => Promise<number>;
};

export async function selectMeters({
  transSubs,
  type,
  date,
  func,
}: SelectMeters) {
  const meters: Meters = {};

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

export type DifferentMeters = {
  sims: Meters;
  p2: Meters;
};

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
  dates: FormDates,
) {
  const [privateMeters, legalMetersSims, legalMetersP2] = await Promise.all([
    selectMeters({
      transSubs,
      type: "Быт",
      date: dates.privateDate,
      func: selectNotInSystemOnDate,
    }),
    selectMeters({
      transSubs,
      type: "ЮР Sims",
      date: dates.legalDate,
      func: selectNotInSystemOnDate,
    }),
    selectMeters({
      transSubs,
      type: "ЮР П2",
      date: dates.legalDate,
      func: selectNotInSystemOnDate,
    }),
  ]);

  const meters: Meters = {};

  for (const transSub of transSubs) {
    const name = transSub.name;

    const privateM = privateMeters[name];
    const legalSims = legalMetersSims[name];
    const legalP2 = legalMetersP2[name];

    meters[name] = privateM + legalSims + legalP2;
  }

  return meters;
}

type PeriodMeters = {
  [k: string]: {
    quantity: number;
    added_to_system: number;
  };
};

type FuncArgs = {
  type: BalanceType;
  date: string;
  year: number;
};

type GetPeriodMeters = {
  transSubs: TransSubs;
  type: BalanceType;
  date: FormDataEntryValue;
  periodType?: "month";
};

async function getPeriodMeters({
  transSubs,
  type,
  date,
  periodType,
}: GetPeriodMeters) {
  const meters: PeriodMeters = {};

  const year = cutOutYear(String(date));
  const month = cutOutMonth(String(date));

  const args: FuncArgs = {
    type,
    date: date as string,
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

type SelectPeriodMeters = {
  transSubs: TransSubs;
  dates: FormDates;
  periodType?: "month";
};

export async function selectPeriodMeters({
  transSubs,
  dates,
  periodType,
}: SelectPeriodMeters) {
  const [privateMeters, legalMetersSims, legalMetersP2] = await Promise.all([
    getPeriodMeters({
      transSubs,
      type: "Быт",
      date: dates.privateDate,
      periodType,
    }),
    getPeriodMeters({
      transSubs,
      type: "ЮР Sims",
      date: dates.legalDate,
      periodType,
    }),
    getPeriodMeters({
      transSubs,
      type: "ЮР П2",
      date: dates.legalDate,
      periodType,
    }),
  ]);

  const meters: PeriodMeters = {};

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
  dates: FormDates,
) {
  const meters = await selectPeriodMeters({
    transSubs,
    dates,
    periodType: "month",
  });

  if (
    dates?.privateMonth &&
    checkDates(String(dates.privateDate), String(String(dates.privateMonth)))
  ) {
    const date = String(dates.privateMonth);
    await addPreviousMonth(transSubs, meters, date, "Быт");
  }

  if (
    dates?.legalMonth &&
    checkDates(String(dates.legalDate), String(dates.legalMonth))
  ) {
    const date = String(dates.legalMonth);
    await addPreviousMonth(transSubs, meters, date, "ЮР Sims");
    await addPreviousMonth(transSubs, meters, date, "ЮР П2");
  }

  return meters;
}

function checkDates(currentMonth: string, previousMonth: string) {
  const difference =
    Number(cutOutMonth(currentMonth)) - Number(cutOutMonth(previousMonth));

  return difference === 1;
}

async function addPreviousMonth(
  transSubs: TransSubs,
  meters: PeriodMeters,
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
      date: date,
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

export type Odpy = {
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
};

export async function calculateOdpy(dates: FormDates, transSubs: TransSubs) {
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

  const year = cutOutYear(String(dates.odpyDate));
  const month = cutOutMonth(String(dates.odpyDate));

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
        date: dates.odpyDate as string,
      }),
      selectMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ П2",
        date: dates.odpyDate as string,
      }),
      selectNotInSystemOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ Sims",
        date: dates.odpyDate as string,
      }),
      selectNotInSystemOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ П2",
        date: dates.odpyDate as string,
      }),
      selectYearMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ Sims",
        date: dates.odpyDate as string,
        year,
      }),
      selectYearMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ П2",
        date: dates.odpyDate as string,
        year,
      }),
      selectMonthMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ Sims",
        date: dates.odpyDate as string,
        month,
        year,
      }),
      selectMonthMetersOnDate({
        transformerSubstationId: transSub.id,
        type: "ОДПУ П2",
        date: dates.odpyDate as string,
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

  if (
    dates?.odpyMonth &&
    checkDates(String(dates.odpyDate), String(String(dates.odpyMonth)))
  ) {
    const date = String(dates.odpyMonth);
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
