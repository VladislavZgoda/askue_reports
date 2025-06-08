import { getRegisteredMeterCountAtDate } from "~/.server/db-queries/registeredMeters";
import { getUnregisteredMeterCountAtDate } from "~/.server/db-queries/unregisteredMeters";
import { getYearlyMeterInstallationSummary } from "~/.server/db-queries/yearlyMeterInstallations";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";
import type { FormData } from "../../generateReports";
import type { Substations } from "../writeDbData";

import {
  getMonthlyMeterInstallationSummary,
  getPreviousMonthInstallationSummary,
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

type Period = "month" | "year";
type Meters = Awaited<ReturnType<typeof getYearlyMeterInstallationSummary>>;

// Key - номер ТП (ТП-777)
type PeriodMeters = Record<string, Meters>;

interface GetPeriodMeters {
  targetDate: string;
  substations: Substations;
  balanceGroup: BalanceGroup;
  period: Period;
}

async function getPeriodMeters({
  substations,
  balanceGroup,
  targetDate,
  period,
}: GetPeriodMeters) {
  const meters: PeriodMeters = {};

  const year = cutOutYear(targetDate);
  const month = cutOutMonth(targetDate);

  let metersAtSubstation: Meters;

  for (const substation of substations) {
    if (period === "month") {
      metersAtSubstation = await getMonthlyMeterInstallationSummary({
        balanceGroup,
        targetDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        month,
        year,
      });
    } else {
      metersAtSubstation = await getYearlyMeterInstallationSummary({
        balanceGroup,
        targetDate,
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
  period: Period;
}

export async function selectPeriodMeters({
  substations,
  formData,
  period,
}: SelectPeriodMeters) {
  const [privateMeters, legalMetersSims, legalMetersP2] = await Promise.all([
    getPeriodMeters({
      substations,
      balanceGroup: "Быт",
      targetDate: formData.privateDate,
      period,
    }),
    getPeriodMeters({
      substations,
      balanceGroup: "ЮР Sims",
      targetDate: formData.legalDate,
      period,
    }),
    getPeriodMeters({
      substations,
      balanceGroup: "ЮР П2",
      targetDate: formData.legalDate,
      period,
    }),
  ]);

  const meters: PeriodMeters = {};

  for (const substation of substations) {
    const name = substation.name;

    const privateM = privateMeters[name];
    const legalSims = legalMetersSims[name];
    const legalP2 = legalMetersP2[name];

    const totalInstalled =
      privateM.totalInstalled +
      legalSims.totalInstalled +
      legalP2.totalInstalled;

    const registeredCount =
      privateM.registeredCount +
      legalSims.registeredCount +
      legalP2.registeredCount;

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
    period: "month",
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
  const lastPreviousMonthDay = getPreviousMonthDay(year, Number(month));

  for (const substation of substations) {
    const periodMeters = await getPreviousMonthInstallationSummary({
      balanceGroup,
      periodStart: date,
      periodEnd: lastPreviousMonthDay,
      transformerSubstationId: substation.id,
    });

    if (typeof periodMeters === "undefined") continue;

    const metersBeforeFirstDate = await getMonthlyMeterInstallationSummary({
      balanceGroup,
      targetDate: date,
      dateComparison: "upTo",
      transformerSubstationId: substation.id,
      month,
      year,
    });

    const totalInstalled =
      periodMeters.totalInstalled - metersBeforeFirstDate.totalInstalled;

    const registeredCount =
      periodMeters.registeredCount - metersBeforeFirstDate.registeredCount;

    meters[substation.name].totalInstalled += totalInstalled;
    meters[substation.name].registeredCount += registeredCount;
  }
}

function getPreviousMonthDay(year: number, month: number) {
  // Первый месяц имеет индекс 0,
  // поэтому month здесь это следующий месяц, а не текущий.
  // При передаче 0 в "date?: number" даст последний день предыдущего месяца.
  const lastPreviousMonthDay = new Date(year, month, 0).toLocaleDateString(
    "en-CA",
  );

  return lastPreviousMonthDay;
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
      getMonthlyMeterInstallationSummary({
        balanceGroup: "ОДПУ Sims",
        targetDate: formData.odpyDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        month,
        year,
      }),
      getMonthlyMeterInstallationSummary({
        balanceGroup: "ОДПУ П2",
        targetDate: formData.odpyDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        month,
        year,
      }),
    ]);

    odpy.quantity += quantitySims + quantityP2;
    odpy.notInSystem += notInSystemSims + notInSystemP2;

    odpy.year.quantity += yearSims.totalInstalled + yearP2.totalInstalled;

    odpy.year.addedToSystem +=
      yearSims.registeredCount + yearP2.registeredCount;

    odpy.month.quantity += monthSims.totalInstalled + monthP2.totalInstalled;

    odpy.month.addedToSystem +=
      monthSims.registeredCount + monthP2.registeredCount;
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
  const lastPreviousMonthDay = getPreviousMonthDay(year, Number(month));

  const meters = {
    quantity: 0,
    addedToSystem: 0,
  };

  const calculate = async (balanceGroup: "ОДПУ Sims" | "ОДПУ П2") => {
    for (const substation of substations) {
      const periodMeters = await getPreviousMonthInstallationSummary({
        balanceGroup,
        periodStart: date,
        periodEnd: lastPreviousMonthDay,
        transformerSubstationId: substation.id,
      });

      if (typeof periodMeters === "undefined") continue;

      const metersBeforeFirstDate = await getMonthlyMeterInstallationSummary({
        balanceGroup,
        targetDate: date,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        month,
        year,
      });

      const quantity =
        periodMeters.totalInstalled - metersBeforeFirstDate.totalInstalled;

      const addedToSystem =
        periodMeters.registeredCount - metersBeforeFirstDate.registeredCount;

      meters.quantity += quantity;
      meters.addedToSystem += addedToSystem;
    }
  };

  await calculate("ОДПУ Sims");
  await calculate("ОДПУ П2");

  return meters;
}
