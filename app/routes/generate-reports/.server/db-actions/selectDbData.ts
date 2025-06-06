import { getRegisteredMeterCountAtDate } from "~/.server/db-queries/registeredMeters";
import { getUnregisteredMeterCountAtDate } from "~/.server/db-queries/unregisteredMeters";
import { getYearlyMeterInstallationSummary } from "~/.server/db-queries/yearlyMeterInstallations";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";
import type { FormData } from "../../generateReports";
import type { Substations } from "../writeDbData";

import {
  selectMonthMetersOnDate,
  selectMonthPeriodMeters,
} from "~/.server/db-queries/monthlyMeterInstallations";

// Key - номер ТП (ТП-777), value - количество счетчиков.
type MetersOnSubstation = Record<string, number>;

type SelectMetersFuncArgs = Parameters<
  typeof getRegisteredMeterCountAtDate
>[number];

type SelectMetersFuncReturnType = ReturnType<
  typeof getRegisteredMeterCountAtDate
>;

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
      func: getRegisteredMeterCountAtDate,
    }),
    selectMeters({
      substations,
      balanceGroup: "ЮР П2",
      targetDate,
      func: getRegisteredMeterCountAtDate,
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

type Meters = Awaited<ReturnType<typeof getYearlyMeterInstallationSummary>>;

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
      metersAtSubstation = await getYearlyMeterInstallationSummary({
        balanceGroup,
        targetDate: date,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        year,
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

    const totalInstalled =
      (privateM?.totalInstalled ?? 0) +
      (legalSims?.totalInstalled ?? 0) +
      (legalP2?.totalInstalled ?? 0);

    const registeredCount =
      (privateM?.registeredCount ?? 0) +
      (legalSims?.registeredCount ?? 0) +
      (legalP2?.registeredCount ?? 0);

    meters[name] = { totalInstalled, registeredCount };
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

    const totalInstalled =
      periodMeters.totalInstalled -
      (metersBeforeFirstDate?.totalInstalled ?? 0);

    const registeredCount =
      periodMeters.registeredCount -
      (metersBeforeFirstDate?.registeredCount ?? 0);

    meters[substation.name].totalInstalled += totalInstalled;
    meters[substation.name].registeredCount += registeredCount;
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
      getRegisteredMeterCountAtDate({
        balanceGroup: "ОДПУ Sims",
        targetDate: formData.odpyDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
      }),
      getRegisteredMeterCountAtDate({
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
      getYearlyMeterInstallationSummary({
        balanceGroup: "ОДПУ Sims",
        targetDate: formData.odpyDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        year,
      }),
      getYearlyMeterInstallationSummary({
        balanceGroup: "ОДПУ П2",
        targetDate: formData.odpyDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
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

    odpy.year.quantity +=
      (yearSims?.totalInstalled ?? 0) + (yearP2?.totalInstalled ?? 0);

    odpy.year.addedToSystem +=
      (yearSims?.registeredCount ?? 0) + (yearP2?.registeredCount ?? 0);

    odpy.month.quantity +=
      (monthSims?.totalInstalled ?? 0) + (monthP2?.totalInstalled ?? 0);

    odpy.month.addedToSystem +=
      (monthSims?.registeredCount ?? 0) + (monthP2?.registeredCount ?? 0);
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
        periodMeters.totalInstalled -
        (metersBeforeFirstDate?.totalInstalled ?? 0);

      const addedToSystem =
        periodMeters.registeredCount -
        (metersBeforeFirstDate?.registeredCount ?? 0);

      meters.quantity += quantity;
      meters.addedToSystem += addedToSystem;
    }
  };

  await calculate("ОДПУ Sims");
  await calculate("ОДПУ П2");

  return meters;
}
