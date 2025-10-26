import { cutOutMonth, cutOutYear } from "~/utils/date-functions";

import {
  createMonthlyInstallationRecord,
  updateMonthlyInstallationRecord,
  getMonthlyMeterInstallationStats,
  incrementMonthlyInstallationRecords,
  getMonthlyInstallationRecordsAfterDate,
  getMonthlyInstallationSummaryBeforeCutoff,
} from "~/.server/db-queries/monthly-meter-installations";

import type { InstallationStats } from "../../../../../utils/installation-params";

/**
 * Creates accumulated monthly installation record
 *
 * Calculates new totals based on previous records before the cutoff date
 *
 * @param executor - Database executor
 * @param installationData - New installation data
 * @param targetMonth - Target month (MM format)
 * @param targetYear - Target year (YYYY)
 */
async function createAccumulatedMonthlyInstallation(
  executor: Executor,
  installationData: MonthlyInstallationData,
  targetMonth: string,
  targetYear: number,
) {
  const currentMonthSummary = await getMonthlyInstallationSummaryBeforeCutoff(
    executor,
    {
      balanceGroup: installationData.balanceGroup,
      cutoffDate: installationData.date,
      substationId: installationData.substationId,
      month: targetMonth,
      year: targetYear,
    },
  );

  const accumulatedTotalInstallations =
    installationData.totalCount + currentMonthSummary.totalInstalled;

  const accumulatedRegisteredMeters =
    installationData.registeredCount + currentMonthSummary.registeredCount;

  await createMonthlyInstallationRecord(executor, {
    totalInstalled: accumulatedTotalInstallations,
    registeredCount: accumulatedRegisteredMeters,
    balanceGroup: installationData.balanceGroup,
    date: installationData.date,
    substationId: installationData.substationId,
    month: targetMonth,
    year: targetYear,
  });
}

type CurrentMonthlyInstallationsStats = NonNullable<InstallationStats>;

/**
 * Updates monthly accumulation records with new installations
 *
 * @param executor - Database executor
 * @param installationData - New installation data
 * @param currentMonthStats - Existing accumulation record
 * @param targetMonth - Target month (MM format)
 * @param targetYear - Target year (YYYY)
 */
async function updateMonthlyMeterAccumulations(
  executor: Executor,
  installationData: MonthlyInstallationData,
  currentMonthStats: CurrentMonthlyInstallationsStats,
  targetMonth: string,
  targetYear: number,
) {
  const accumulatedTotalInstallations =
    installationData.totalCount + currentMonthStats.totalInstalled;

  const acumulatedRegisteredMeters =
    installationData.registeredCount + currentMonthStats.registeredCount;

  await updateMonthlyInstallationRecord(executor, {
    totalInstalled: accumulatedTotalInstallations,
    registeredCount: acumulatedRegisteredMeters,
    balanceGroup: installationData.balanceGroup,
    date: installationData.date,
    substationId: installationData.substationId,
    month: targetMonth,
    year: targetYear,
  });
}

interface MonthlyInstallationData {
  readonly balanceGroup: BalanceGroup;
  readonly totalCount: number;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Processes monthly meter installation data atomically:
 *
 * 1. Updates or creates monthly accumulation records
 * 2. Propagates counts to future records in the same month
 *
 * Performs all operations within a database transaction
 *
 * @example
 *   await processMonthlyInstallations({
 *     totalCount: 15,
 *     registeredCount: 12,
 *     balanceGroup: "ЮР Sims",
 *     date: "2023-06-15",
 *     substationId: 42,
 *   });
 *
 * @property totalCount - Total meters installed
 * @property registeredCount - Meters registered in system
 * @property balanceGroup - Balance group category
 * @property date - Installation date (YYYY-MM-DD)
 * @property substationId - Associated substation ID
 * @param executor - Database executor
 * @param monthlyInstallation - Validated installation data
 * @throws {Error} When:
 *
 *   - Registered count exceeds total installed
 *   - Batch update partially fails
 *   - Database constraints are violated
 */
export default async function processMonthlyInstallations(
  executor: Executor,
  monthlyInstallation: MonthlyInstallationData,
) {
  const { totalCount, registeredCount, balanceGroup, date, substationId } =
    monthlyInstallation;

  const year = cutOutYear(date);
  const month = cutOutMonth(date);

  // 1. Get current stats (transactional)
  const currentMonthStats = await getMonthlyMeterInstallationStats(executor, {
    balanceGroup,
    date,
    substationId,
    month,
    year,
  });

  // 2. Update or create accumulation (transactional)
  if (currentMonthStats) {
    await updateMonthlyMeterAccumulations(
      executor,
      monthlyInstallation,
      currentMonthStats,
      month,
      year,
    );
  } else {
    await createAccumulatedMonthlyInstallation(
      executor,
      monthlyInstallation,
      month,
      year,
    );
  }

  // 3. Get future records (transactional)
  const futureRecordIds = await getMonthlyInstallationRecordsAfterDate(
    executor,
    {
      balanceGroup,
      startDate: date,
      substationId,
      month,
      year,
    },
  );

  // 4. Batch update future records (transactional)
  if (futureRecordIds.length > 0) {
    const updatedCount = await incrementMonthlyInstallationRecords(
      executor,
      futureRecordIds,
      totalCount,
      registeredCount,
    );

    if (updatedCount !== futureRecordIds.length) {
      const failedCount = futureRecordIds.length - updatedCount;
      throw new Error(
        `Failed to update ${failedCount} records. ` +
          "Update would violate registered_count <= total_installed constraint.",
      );
    }
  }
}
