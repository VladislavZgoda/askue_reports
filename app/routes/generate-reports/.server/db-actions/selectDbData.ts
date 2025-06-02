import { getMeterQuantityAtDate } from "~/.server/db-queries/electricityMeters";
import { getUnregisteredMeterCountAtDate } from "~/.server/db-queries/unregisteredMeters";
import { selectYearMetersOnDate } from "~/.server/db-queries/newYearMeters";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";
import type { FormData } from "../../generateReports";
import type { Substations } from "../writeDbData";

import {
  selectMonthMetersOnDate,
  selectMonthPeriodMeters,
} from "~/.server/db-queries/newMonthMeters";

// Key - номер ТП (ТП-777), value - количество счетчиков.
type MetersOnSubstation = Record<string, number>;
type SelectMetersFuncArgs = Parameters<typeof getMeterQuantityAtDate>[number];
type SelectMetersFuncReturnType = ReturnType<typeof getMeterQuantityAtDate>;

interface SelectMeters {
  substations: Substations;
  balanceGroup: BalanceGroup;
  targetDate: string;
  func: (args: SelectMetersFuncArgs) => SelectMetersFuncReturnType;
}

export async function selectMeters({
  substations,
  balanceGroup,
  targetDate,
  func,
}: SelectMeters) {
  const meters: MetersOnSubstation = {};

  for (const substation of substations) {
    const quantity = await func({
      balanceGroup,
      targetDate,
      dateComparison: "upTo",
      transformerSubstationId: substation.id,
    });

    meters[substation.name] = quantity;
  }

  return meters;
}

export async function selectLegalMeters(
  substations: Substations,
  targetDate: string,
) {
  const [sims, p2] = await Promise.all([
    selectMeters({
      substations,
      balanceGroup: "ЮР Sims",
      targetDate,
      func: getMeterQuantityAtDate,
    }),
    selectMeters({
      substations,
      balanceGroup: "ЮР П2",
      targetDate,
      func: getMeterQuantityAtDate,
    }),
  ]);

  const meters = {
    sims,
    p2,
  } as const;

  return meters;
}

export async function selectNotInSystem(
  substations: Substations,
  formData: FormData,
) {
  const [privateMeters, legalMetersSims, legalMetersP2] = await Promise.all([
    selectMeters({
      substations,
      balanceGroup: "Быт",
      targetDate: formData.privateDate,
      func: getUnregisteredMeterCountAtDate,
    }),
    selectMeters({
      substations,
      balanceGroup: "ЮР Sims",
      targetDate: formData.legalDate,
      func: getUnregisteredMeterCountAtDate,
    }),
    selectMeters({
      substations,
      balanceGroup: "ЮР П2",
      targetDate: formData.legalDate,
      func: getUnregisteredMeterCountAtDate,
    }),
  ]);

  const meters: MetersOnSubstation = {};

  for (const substation of substations) {
    const name = substation.name;

    const privateM = privateMeters[name];
    const legalSims = legalMetersSims[name];
    const legalP2 = legalMetersP2[name];

    meters[name] = privateM + legalSims + legalP2;
  }

  return meters;
}

interface Meters {
  quantity: number;
  addedToSystem: number;
}

// Key - номер ТП (ТП-777)
type PeriodMeters = Record<string, Meters>;

interface GetPeriodMeters {
  date: string;
  substations: Substations;
  balanceGroup: BalanceGroup;
  periodType?: "month";
}

async function getPeriodMeters({
  substations,
  balanceGroup,
  date,
  periodType,
}: GetPeriodMeters) {
  const meters: PeriodMeters = {};

  const year = cutOutYear(date);
  const month = cutOutMonth(date);

  const args = {
    date,
    year,
    balanceGroup,
  };

  let metersAtSubstation: Meters;

  for (const substation of substations) {
    if (periodType === "month") {
      metersAtSubstation = await selectMonthMetersOnDate({
        transformerSubstationId: substation.id,
        month,
        ...args,
      });
    } else {
      metersAtSubstation = await selectYearMetersOnDate({
        transformerSubstationId: substation.id,
        ...args,
      });
    }

    meters[substation.name] = metersAtSubstation;
  }

  return meters;
}

interface SelectPeriodMeters {
  substations: Substations;
  formData: FormData;
  periodType?: "month";
}

export async function selectPeriodMeters({
  substations,
  formData,
  periodType,
}: SelectPeriodMeters) {
  const [privateMeters, legalMetersSims, legalMetersP2] = await Promise.all([
    getPeriodMeters({
      substations,
      balanceGroup: "Быт",
      date: formData.privateDate,
      periodType,
    }),
    getPeriodMeters({
      substations,
      balanceGroup: "ЮР Sims",
      date: formData.legalDate,
      periodType,
    }),
    getPeriodMeters({
      substations,
      balanceGroup: "ЮР П2",
      date: formData.legalDate,
      periodType,
    }),
  ]);

  const meters: PeriodMeters = {};

  for (const substation of substations) {
    const name = substation.name;

    const privateM = privateMeters[name];
    const legalSims = legalMetersSims[name];
    const legalP2 = legalMetersP2[name];

    const quantity =
      (privateM?.quantity ?? 0) +
      (legalSims?.quantity ?? 0) +
      (legalP2?.quantity ?? 0);

    const addedToSystem =
      (privateM?.addedToSystem ?? 0) +
      (legalSims?.addedToSystem ?? 0) +
      (legalP2?.addedToSystem ?? 0);

    meters[name] = { quantity, addedToSystem };
  }

  return meters;
}

export async function selectMonthMeters(
  substations: Substations,
  formData: FormData,
) {
  const meters = await selectPeriodMeters({
    substations,
    formData,
    periodType: "month",
  });

  if (formData?.privateMonth) {
    const date = formData.privateMonth;
    await addPreviousMonth(date, meters, substations, "Быт");
  }

  if (formData?.legalMonth) {
    const date = formData.legalMonth;
    await addPreviousMonth(date, meters, substations, "ЮР Sims");
    await addPreviousMonth(date, meters, substations, "ЮР П2");
  }

  return meters;
}

async function addPreviousMonth(
  date: string,
  meters: PeriodMeters,
  substations: Substations,
  balanceGroup: BalanceGroup,
) {
  const year = cutOutYear(date);
  const month = cutOutMonth(date);
  const lastMonthDatePrivate = selectLastMonthDate(year, Number(month));

  for (const substation of substations) {
    const periodMeters = await selectMonthPeriodMeters({
      balanceGroup,
      firstDate: date,
      lastDate: lastMonthDatePrivate,
      transformerSubstationId: substation.id,
    });

    if (typeof periodMeters === "undefined") continue;

    const metersBeforeFirstDate = await selectMonthMetersOnDate({
      transformerSubstationId: substation.id,
      balanceGroup,
      date,
      month,
      year,
    });

    const quantity =
      periodMeters.quantity - (metersBeforeFirstDate?.quantity ?? 0);

    const addedToSystem =
      periodMeters.addedToSystem - (metersBeforeFirstDate?.addedToSystem ?? 0);

    meters[substation.name].quantity += quantity;
    meters[substation.name].addedToSystem += addedToSystem;
  }
}

function selectLastMonthDate(year: number, month: number) {
  // Первый месяц имеет индекс 0,
  // поэтому month здесь это следующий месяц, а не текущий.
  // При передаче 0 в "date?: number" даст последний день предыдущего месяца.
  const lastDayOfMonth = new Date(year, month, 0).toLocaleDateString("en-CA");

  return lastDayOfMonth;
}

export async function selectOdpy(formData: FormData, substations: Substations) {
  const odpy = {
    quantity: 0,
    notInSystem: 0,
    year: {
      quantity: 0,
      addedToSystem: 0,
    },
    month: {
      quantity: 0,
      addedToSystem: 0,
    },
  };

  const year = cutOutYear(formData.odpyDate);
  const month = cutOutMonth(formData.odpyDate);

  for (const substation of substations) {
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
      getMeterQuantityAtDate({
        balanceGroup: "ОДПУ Sims",
        targetDate: formData.odpyDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
      }),
      getMeterQuantityAtDate({
        balanceGroup: "ОДПУ П2",
        targetDate: formData.odpyDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
      }),
      getUnregisteredMeterCountAtDate({
        balanceGroup: "ОДПУ Sims",
        targetDate: formData.odpyDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
      }),
      getUnregisteredMeterCountAtDate({
        balanceGroup: "ОДПУ П2",
        targetDate: formData.odpyDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
      }),
      selectYearMetersOnDate({
        transformerSubstationId: substation.id,
        balanceGroup: "ОДПУ Sims",
        date: formData.odpyDate,
        year,
      }),
      selectYearMetersOnDate({
        transformerSubstationId: substation.id,
        balanceGroup: "ОДПУ П2",
        date: formData.odpyDate,
        year,
      }),
      selectMonthMetersOnDate({
        transformerSubstationId: substation.id,
        balanceGroup: "ОДПУ Sims",
        date: formData.odpyDate,
        month,
        year,
      }),
      selectMonthMetersOnDate({
        transformerSubstationId: substation.id,
        balanceGroup: "ОДПУ П2",
        date: formData.odpyDate,
        month,
        year,
      }),
    ]);

    odpy.quantity += quantitySims + quantityP2;
    odpy.notInSystem += notInSystemSims + notInSystemP2;
    odpy.year.quantity += (yearSims?.quantity ?? 0) + (yearP2?.quantity ?? 0);
    odpy.year.addedToSystem +=
      (yearSims?.addedToSystem ?? 0) + (yearP2?.addedToSystem ?? 0);
    odpy.month.quantity +=
      (monthSims?.quantity ?? 0) + (monthP2?.quantity ?? 0);
    odpy.month.addedToSystem +=
      (monthSims?.addedToSystem ?? 0) + (monthP2?.addedToSystem ?? 0);
  }

  if (formData?.odpyMonth) {
    const date = formData.odpyMonth;
    const prevMonthMeters = await calculatePreviousMonthOdpy(date, substations);
    odpy.month.quantity += prevMonthMeters.quantity;
    odpy.month.addedToSystem += prevMonthMeters.addedToSystem;
  }

  return odpy;
}

async function calculatePreviousMonthOdpy(
  date: string,
  substations: Substations,
) {
  const year = cutOutYear(date);
  const month = cutOutMonth(date);
  const lastMonthDatePrivate = selectLastMonthDate(year, Number(month));

  const meters = {
    quantity: 0,
    addedToSystem: 0,
  };

  const calculate = async (balanceGroup: "ОДПУ Sims" | "ОДПУ П2") => {
    for (const substation of substations) {
      const periodMeters = await selectMonthPeriodMeters({
        balanceGroup,
        firstDate: date,
        lastDate: lastMonthDatePrivate,
        transformerSubstationId: substation.id,
      });

      if (typeof periodMeters === "undefined") continue;

      const metersBeforeFirstDate = await selectMonthMetersOnDate({
        transformerSubstationId: substation.id,
        balanceGroup,
        date,
        month,
        year,
      });

      const quantity =
        periodMeters.quantity - (metersBeforeFirstDate?.quantity ?? 0);

      const addedToSystem =
        periodMeters.addedToSystem -
        (metersBeforeFirstDate?.addedToSystem ?? 0);

      meters.quantity += quantity;
      meters.addedToSystem += addedToSystem;
    }
  };

  await calculate("ОДПУ Sims");
  await calculate("ОДПУ П2");

  return meters;
}
