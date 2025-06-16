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

import {
  getSubstationMeterReportsAtDate,
  getLatestMeterInstallationsBySubstation,
  getLatestMonthlyInstallationsBySubstation,
} from "~/.server/db-queries/transformerSubstations";

// Key - номер ТП (ТП-777), value - количество счетчиков.
type MetersOnSubstation = Record<string, number>;

type getMetersFuncArgs = Parameters<
  typeof getRegisteredMeterCountAtDate
>[number];

type getMetersFuncReturnType = ReturnType<typeof getRegisteredMeterCountAtDate>;

interface SelectMeters {
  substations: Substations;
  balanceGroup: BalanceGroup;
  targetDate: string;
  func: (args: getMetersFuncArgs) => getMetersFuncReturnType;
}

export async function getMeterCountAtDate({
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

export async function getLegalMeterCountAtDate(
  substations: Substations,
  targetDate: string,
) {
  const [sims, p2] = await Promise.all([
    getMeterCountAtDate({
      substations,
      balanceGroup: "ЮР Sims",
      targetDate,
      func: getRegisteredMeterCountAtDate,
    }),
    getMeterCountAtDate({
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

export async function countUnregisteredMetersAtDate(
  substations: Substations,
  formData: FormData,
) {
  const [privateMeters, legalMetersSims, legalMetersP2] = await Promise.all([
    getMeterCountAtDate({
      substations,
      balanceGroup: "Быт",
      targetDate: formData.privateDate,
      func: getUnregisteredMeterCountAtDate,
    }),
    getMeterCountAtDate({
      substations,
      balanceGroup: "ЮР Sims",
      targetDate: formData.legalDate,
      func: getUnregisteredMeterCountAtDate,
    }),
    getMeterCountAtDate({
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

async function getPeriodMeterInstallationSummary({
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

export async function accumulatePeriodInstallationChanges({
  substations,
  formData,
  period,
}: SelectPeriodMeters) {
  const [privateMeters, legalMetersSims, legalMetersP2] = await Promise.all([
    getPeriodMeterInstallationSummary({
      substations,
      balanceGroup: "Быт",
      targetDate: formData.privateDate,
      period,
    }),
    getPeriodMeterInstallationSummary({
      substations,
      balanceGroup: "ЮР Sims",
      targetDate: formData.legalDate,
      period,
    }),
    getPeriodMeterInstallationSummary({
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

export async function accumulateMonthInstallationChanges(
  substations: Substations,
  formData: FormData,
) {
  const meters = await accumulatePeriodInstallationChanges({
    substations,
    formData,
    period: "month",
  });

  if (formData?.privateMonth) {
    const date = formData.privateMonth;
    await accumulatePreviousMonthInstallationChanges(
      date,
      meters,
      substations,
      "Быт",
    );
  }

  if (formData?.legalMonth) {
    const date = formData.legalMonth;
    await accumulatePreviousMonthInstallationChanges(
      date,
      meters,
      substations,
      "ЮР Sims",
    );
    await accumulatePreviousMonthInstallationChanges(
      date,
      meters,
      substations,
      "ЮР П2",
    );
  }

  return meters;
}

/**
 * Accumulates monthly installation changes by calculating the difference between:
 * 1. Installations at the end of the previous month
 * 2. Installations before the start of the period
 *
 * For each substation, adds the net installation changes to the meter totals
 *
 * @param periodStart Start date of the period (YYYY-MM-DD format)
 * @param meters Record to accumulate changes into
 * @param substations List of substations to process
 * @param balanceGroup Balance group filter
 */
async function accumulatePreviousMonthInstallationChanges(
  periodStartDate: string,
  meters: PeriodMeters,
  substations: Substations,
  balanceGroup: BalanceGroup,
) {
  const year = cutOutYear(periodStartDate);
  const month = cutOutMonth(periodStartDate);
  const periodEndDate = getMonthEndDate(year, Number(month));

  for (const substation of substations) {
    const previousMonthInstallation = await getPreviousMonthInstallationSummary(
      {
        balanceGroup,
        periodStart: periodStartDate,
        periodEnd: periodEndDate,
        transformerSubstationId: substation.id,
      },
    );

    if (typeof previousMonthInstallation === "undefined") continue;

    const installationBeforePeriodStart =
      await getMonthlyMeterInstallationSummary({
        balanceGroup,
        targetDate: periodStartDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        month,
        year,
      });

    const monthlyChange = calculateMonthlyInstallationChange(
      previousMonthInstallation,
      installationBeforePeriodStart,
    );

    meters[substation.name].totalInstalled += monthlyChange.total;
    meters[substation.name].registeredCount += monthlyChange.registered;
  }
}

function getMonthEndDate(year: number, month: number) {
  // Первый месяц имеет индекс 0,
  // поэтому month здесь это следующий месяц, а не текущий.
  // При передаче 0 в "date?: number" даст последний день предыдущего месяца.
  const lastPreviousMonthDay = new Date(year, month, 0).toLocaleDateString(
    "en-CA",
  );

  return lastPreviousMonthDay;
}

function calculateMonthlyInstallationChange(end: Meters, start: Meters) {
  const total = end.totalInstalled - start.totalInstalled;
  const registered = end.registeredCount - start.registeredCount;

  return {
    total,
    registered,
  } as const;
}

export async function getODPUMeterCount(
  formData: FormData,
  substations: Substations,
) {
  const odpu = {
    registeredMeterCount: 0,
    unregisteredMeterCount: 0,
    year: {
      totalInstalled: 0,
      registeredCount: 0,
    },
    month: {
      totalInstalled: 0,
      registeredCount: 0,
    },
  };

  const year = cutOutYear(formData.odpuDate);
  const month = cutOutMonth(formData.odpuDate);

  for (const substation of substations) {
    const [
      registeredMeterCountSims,
      registeredMeterCountP2,
      unregisteredMeterCountSims,
      unregisteredMeterCountP2,
      yearSims,
      yearP2,
      monthSims,
      monthP2,
    ] = await Promise.all([
      getRegisteredMeterCountAtDate({
        balanceGroup: "ОДПУ Sims",
        targetDate: formData.odpuDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
      }),
      getRegisteredMeterCountAtDate({
        balanceGroup: "ОДПУ П2",
        targetDate: formData.odpuDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
      }),
      getUnregisteredMeterCountAtDate({
        balanceGroup: "ОДПУ Sims",
        targetDate: formData.odpuDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
      }),
      getUnregisteredMeterCountAtDate({
        balanceGroup: "ОДПУ П2",
        targetDate: formData.odpuDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
      }),
      getYearlyMeterInstallationSummary({
        balanceGroup: "ОДПУ Sims",
        targetDate: formData.odpuDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        year,
      }),
      getYearlyMeterInstallationSummary({
        balanceGroup: "ОДПУ П2",
        targetDate: formData.odpuDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        year,
      }),
      getMonthlyMeterInstallationSummary({
        balanceGroup: "ОДПУ Sims",
        targetDate: formData.odpuDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        month,
        year,
      }),
      getMonthlyMeterInstallationSummary({
        balanceGroup: "ОДПУ П2",
        targetDate: formData.odpuDate,
        dateComparison: "upTo",
        transformerSubstationId: substation.id,
        month,
        year,
      }),
    ]);

    odpu.registeredMeterCount +=
      registeredMeterCountSims + registeredMeterCountP2;

    odpu.unregisteredMeterCount +=
      unregisteredMeterCountSims + unregisteredMeterCountP2;

    odpu.year.totalInstalled += yearSims.totalInstalled + yearP2.totalInstalled;

    odpu.year.registeredCount +=
      yearSims.registeredCount + yearP2.registeredCount;

    odpu.month.totalInstalled +=
      monthSims.totalInstalled + monthP2.totalInstalled;

    odpu.month.registeredCount +=
      monthSims.registeredCount + monthP2.registeredCount;
  }

  if (formData?.odpuMonth) {
    const date = formData.odpuMonth;

    const previousMonthInstallations =
      await accumulatePreviousMonthODPUInstallationChanges(date, substations);

    odpu.month.totalInstalled += previousMonthInstallations.totalInstalled;
    odpu.month.registeredCount += previousMonthInstallations.registeredCount;
  }

  return odpu;
}

type ODPUBalanceGroup = "ОДПУ Sims" | "ОДПУ П2";

/**
 * Accumulates installation changes for ODPU balance groups ("ОДПУ Sims" and "ОДПУ П2")
 * across all substations for the previous month
 *
 * @param periodStartDate Start date of the period (YYYY-MM-DD format)
 * @param substations List of substations to process
 * @returns Aggregated installation changes for all ODPU groups
 */
async function accumulatePreviousMonthODPUInstallationChanges(
  periodStartDate: string,
  substations: Substations,
) {
  const year = cutOutYear(periodStartDate);
  const month = cutOutMonth(periodStartDate);
  const periodEndDate = getMonthEndDate(year, Number(month));

  const meters = {
    totalInstalled: 0,
    registeredCount: 0,
  };

  const accumulateForGroup = async (balanceGroup: ODPUBalanceGroup) => {
    for (const substation of substations) {
      const previousMonthInstallation =
        await getPreviousMonthInstallationSummary({
          balanceGroup,
          periodStart: periodStartDate,
          periodEnd: periodEndDate,
          transformerSubstationId: substation.id,
        });

      if (typeof previousMonthInstallation === "undefined") continue;

      const installationBeforePeriodStart =
        await getMonthlyMeterInstallationSummary({
          balanceGroup,
          targetDate: periodStartDate,
          dateComparison: "upTo",
          transformerSubstationId: substation.id,
          month,
          year,
        });

      const monthlyChange = calculateMonthlyInstallationChange(
        previousMonthInstallation,
        installationBeforePeriodStart,
      );

      meters.totalInstalled += monthlyChange.total;
      meters.registeredCount += monthlyChange.registered;
    }
  };

  await accumulateForGroup("ОДПУ Sims");
  await accumulateForGroup("ОДПУ П2");

  return meters;
}

/**
 * Generates a private meter report with optional adjustments for installation changes
 *
 * @param reportDate Primary date for the base report (YYYY-MM-DD)
 * @param adjustmentPeriodStart Optional start date for installation adjustments
 * @returns Meter report with installations adjusted if adjustment period is provided
 */
export async function getPrivateMeterReportWithAdjustments(
  reportDate: string,
  adjustmentPeriodStart: string | undefined,
) {
  const reportYear = cutOutYear(reportDate);
  const reportMonth = cutOutMonth(reportDate);

  const baseReport = await getSubstationMeterReportsAtDate({
    balanceGroup: "Быт",
    targetDate: reportDate,
    month: reportMonth,
    year: reportYear,
  });

  if (!adjustmentPeriodStart) return baseReport;

  const adjustYear = cutOutYear(adjustmentPeriodStart);
  const adjustMonth = cutOutMonth(adjustmentPeriodStart);
  const adjustmentPeriodEnd = getMonthEndDate(adjustYear, Number(adjustMonth));

  const previousMonthInstallations = await getInstallationsForPeriod({
    balanceGroup: "Быт",
    periodStart: adjustmentPeriodStart,
    periodEnd: adjustmentPeriodEnd,
  });

  const prePeriodInstallations = await getPrePeriodInstallations({
    balanceGroup: "Быт",
    cutoffDate: adjustmentPeriodStart,
    month: adjustMonth,
    year: adjustYear,
  });

  applyAdjustmentsToReport(
    baseReport,
    previousMonthInstallations,
    prePeriodInstallations,
  );

  return baseReport;
}

type SubstationReport = Awaited<
  ReturnType<typeof getSubstationMeterReportsAtDate>
>;

type InstallationData = Awaited<
  ReturnType<typeof getLatestMeterInstallationsBySubstation>
>;

function applyAdjustmentsToReport(
  baseReport: SubstationReport,
  endPeriodInstallations: InstallationData,
  startPeriodInstallations: InstallationData,
) {
  if (
    endPeriodInstallations.length !== startPeriodInstallations.length ||
    endPeriodInstallations.length !== baseReport.length
  ) {
    throw new Error("Installation data arrays have inconsistent lengths");
  }

  baseReport.forEach((stationReport, index) => {
    const endPeriodData = endPeriodInstallations[index].installation;
    const startPeriodData = startPeriodInstallations[index].installation;

    if (!endPeriodData?.totalInstalled) return;

    const monthlyChange = calculateMonthlyInstallationChange(
      endPeriodData,
      startPeriodData,
    );

    stationReport.monthlyMeterInstallations.totalInstalled +=
      monthlyChange.total;
    stationReport.monthlyMeterInstallations.registeredCount +=
      monthlyChange.registered;
  });
}

type InstallationsForPeriod = Parameters<
  typeof getLatestMeterInstallationsBySubstation
>[number];

async function getInstallationsForPeriod(params: InstallationsForPeriod) {
  return getLatestMeterInstallationsBySubstation(params);
}

type PrePeriodInstallations = Parameters<
  typeof getLatestMonthlyInstallationsBySubstation
>[number];

async function getPrePeriodInstallations(params: PrePeriodInstallations) {
  return getLatestMonthlyInstallationsBySubstation(params);
}

export async function getLegalMeterReportsWithAdjustments(
  reportDate: string,
  adjustmentPeriodStart: string | undefined,
) {
  const reportYear = cutOutYear(reportDate);
  const reportMonth = cutOutMonth(reportDate);

  const baseSimsReport = await getSubstationMeterReportsAtDate({
    balanceGroup: "ЮР Sims",
    targetDate: reportDate,
    month: reportMonth,
    year: reportYear,
  });

  const baseP2Report = await getSubstationMeterReportsAtDate({
    balanceGroup: "ЮР П2",
    targetDate: reportDate,
    month: reportMonth,
    year: reportYear,
  });

  if (!adjustmentPeriodStart) {
    return {
      simsReport: baseSimsReport,
      p2Report: baseP2Report,
    } as const;
  }

  const adjustYear = cutOutYear(adjustmentPeriodStart);
  const adjustMonth = cutOutMonth(adjustmentPeriodStart);
  const adjustmentPeriodEnd = getMonthEndDate(adjustYear, Number(adjustMonth));

  const previousSimsMonthInstallations = await getInstallationsForPeriod({
    balanceGroup: "ЮР Sims",
    periodStart: adjustmentPeriodStart,
    periodEnd: adjustmentPeriodEnd,
  });

  const preSimsPeriodInstallations = await getPrePeriodInstallations({
    balanceGroup: "ЮР Sims",
    cutoffDate: adjustmentPeriodStart,
    month: adjustMonth,
    year: adjustYear,
  });

  const previousP2MonthInstallations = await getInstallationsForPeriod({
    balanceGroup: "ЮР П2",
    periodStart: adjustmentPeriodStart,
    periodEnd: adjustmentPeriodEnd,
  });

  const preP2PeriodInstallations = await getPrePeriodInstallations({
    balanceGroup: "ЮР П2",
    cutoffDate: adjustmentPeriodStart,
    month: adjustMonth,
    year: adjustYear,
  });

  applyAdjustmentsToReport(
    baseSimsReport,
    previousSimsMonthInstallations,
    preSimsPeriodInstallations,
  );

  applyAdjustmentsToReport(
    baseP2Report,
    previousP2MonthInstallations,
    preP2PeriodInstallations,
  );

  return {
    simsReport: baseSimsReport,
    p2Report: baseP2Report,
  } as const;
}
