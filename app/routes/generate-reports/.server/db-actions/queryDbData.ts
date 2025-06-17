import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";

import {
  getSubstationMeterReportsAtDate,
  getLatestMeterInstallationsBySubstation,
  getLatestMonthlyInstallationsBySubstation,
} from "~/.server/db-queries/transformerSubstations";

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

  const [previousMonthInstallations, prePeriodInstallations] =
    await Promise.all([
      getInstallationsForPeriod({
        balanceGroup: "Быт",
        periodStart: adjustmentPeriodStart,
        periodEnd: adjustmentPeriodEnd,
      }),
      getPrePeriodInstallations({
        balanceGroup: "Быт",
        cutoffDate: adjustmentPeriodStart,
        month: adjustMonth,
        year: adjustYear,
      }),
    ]);

  applyAdjustmentsToReport(
    baseReport,
    previousMonthInstallations,
    prePeriodInstallations,
  );

  return baseReport;
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

type Installations = Awaited<
  ReturnType<typeof getLatestMeterInstallationsBySubstation>
>[number]["installation"];

function calculateMonthlyInstallationChange(
  end: Installations,
  start: Installations,
) {
  const total = end.totalInstalled - start.totalInstalled;
  const registered = end.registeredCount - start.registeredCount;

  return {
    total,
    registered,
  } as const;
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

export async function getMeterReportsWithAdjustments(
  balanceGroup: "legal" | "odpu",
  reportDate: string,
  adjustmentPeriodStart: string | undefined,
) {
  let groups: ["ЮР Sims", "ЮР П2"] | ["ОДПУ Sims", "ОДПУ П2"];

  if (balanceGroup === "legal") {
    groups = ["ЮР Sims", "ЮР П2"];
  } else {
    groups = ["ОДПУ Sims", "ОДПУ П2"];
  }

  const [sims, p2] = groups;

  const reportYear = cutOutYear(reportDate);
  const reportMonth = cutOutMonth(reportDate);

  const [baseSimsReport, baseP2Report] = await Promise.all([
    getSubstationMeterReportsAtDate({
      balanceGroup: sims,
      targetDate: reportDate,
      month: reportMonth,
      year: reportYear,
    }),
    getSubstationMeterReportsAtDate({
      balanceGroup: p2,
      targetDate: reportDate,
      month: reportMonth,
      year: reportYear,
    }),
  ]);

  if (!adjustmentPeriodStart) {
    return {
      simsReport: baseSimsReport,
      p2Report: baseP2Report,
    } as const;
  }

  const adjustYear = cutOutYear(adjustmentPeriodStart);
  const adjustMonth = cutOutMonth(adjustmentPeriodStart);
  const adjustmentPeriodEnd = getMonthEndDate(adjustYear, Number(adjustMonth));

  const [
    previousSimsMonthInstallations,
    preSimsPeriodInstallations,
    previousP2MonthInstallations,
    preP2PeriodInstallations,
  ] = await Promise.all([
    getInstallationsForPeriod({
      balanceGroup: sims,
      periodStart: adjustmentPeriodStart,
      periodEnd: adjustmentPeriodEnd,
    }),
    getPrePeriodInstallations({
      balanceGroup: sims,
      cutoffDate: adjustmentPeriodStart,
      month: adjustMonth,
      year: adjustYear,
    }),
    getInstallationsForPeriod({
      balanceGroup: p2,
      periodStart: adjustmentPeriodStart,
      periodEnd: adjustmentPeriodEnd,
    }),
    getPrePeriodInstallations({
      balanceGroup: p2,
      cutoffDate: adjustmentPeriodStart,
      month: adjustMonth,
      year: adjustYear,
    }),
  ]);

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
