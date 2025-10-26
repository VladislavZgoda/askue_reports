import { cutOutYear } from "~/utils/date-functions";

import {
  createYearlyMeterInstallation,
  updateYearlyMeterInstallation,
  getYearlyMeterInstallationStats,
  incrementYearlyInstallationRecords,
  getYearlyInstallationRecordsAfterDate,
  getYearlyInstallationSummaryBeforeCutoff,
} from "~/.server/db-queries/yearly-meter-installations";

import type { InstallationStats } from "../../../../../utils/installation-params";

/**
 * Updates existing yearly accumulation record with new installation data
 *
 * @param executor Database executor
 * @param installationData New installation data
 * @param currentYearStats Existing accumulation record
 * @param targetYear Target year for accumulation
 */
async function updateYearlyMeterAccumulations(
  executor: Executor,
  installationData: YearlyInstallationData,
  currentYearStats: InstallationStats,
  targetYear: number,
) {
  const accumulatedTotalInstallations =
    installationData.totalCount + currentYearStats.totalInstalled;
  const accumulatedRegisteredMeters =
    installationData.registeredCount + currentYearStats.registeredCount;

  await updateYearlyMeterInstallation(executor, {
    totalInstalled: accumulatedTotalInstallations,
    registeredCount: accumulatedRegisteredMeters,
    balanceGroup: installationData.balanceGroup,
    substationId: installationData.substationId,
    date: installationData.date,
    year: targetYear,
  });
}

/**
 * Creates a new yearly accumulation record when none exists
 *
 * Calculates accumulations based on previous records
 *
 * @param executor Database executor
 * @param installationData New installation data
 * @param targetYear Target year for accumulation
 */
async function createAccumulatedYearlyInstallation(
  executor: Executor,
  installationData: YearlyInstallationData,
  targetYear: number,
) {
  const currentYearSummary = await getYearlyInstallationSummaryBeforeCutoff(
    executor,
    {
      balanceGroup: installationData.balanceGroup,
      cutoffDate: installationData.date,
      substationId: installationData.substationId,
      year: targetYear,
    },
  );

  const accumulatedTotalInstallations =
    installationData.totalCount + currentYearSummary.totalInstalled;
  const accumulatedRegisteredMeters =
    installationData.registeredCount + currentYearSummary.registeredCount;

  await createYearlyMeterInstallation(executor, {
    totalInstalled: accumulatedTotalInstallations,
    registeredCount: accumulatedRegisteredMeters,
    balanceGroup: installationData.balanceGroup,
    date: installationData.date,
    substationId: installationData.substationId,
    year: targetYear,
  });
}

interface YearlyInstallationData {
  readonly balanceGroup: BalanceGroup;
  readonly totalCount: number;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Processes yearly meter installation data atomically:
 *
 * 1. Updates or creates yearly accumulation records
 * 2. Propagates installation counts to future records
 *
 * Performs all operations within a database transaction to ensure data
 * consistency
 *
 * @example
 *   await processYearlyInstallations({
 *     totalCount: 15,
 *     registeredCount: 12,
 *     balanceGroup: "Быт",
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
 * @param yearlyInstallation Installation data with validation
 * @throws Error if:
 *
 *   - Validation fails (registered > total)
 *   - Batch update partially fails
 *   - Database constraints are violated
 */
export default async function processYearlyInstallations(
  executor: Executor,
  yearlyInstallation: YearlyInstallationData,
) {
  const { totalCount, registeredCount, balanceGroup, date, substationId } =
    yearlyInstallation;

  const year = cutOutYear(date);

  // 1. Get current stats (transactional)
  const currentYearStats = await getYearlyMeterInstallationStats(executor, {
    balanceGroup,
    date,
    substationId,
    year,
  });

  // 2. Update or create accumulation (transactional)
  if (currentYearStats) {
    await updateYearlyMeterAccumulations(
      executor,
      yearlyInstallation,
      currentYearStats,
      year,
    );
  } else {
    await createAccumulatedYearlyInstallation(
      executor,
      yearlyInstallation,
      year,
    );
  }

  // 3. Get future records (transactional)
  const futureRecordIds = await getYearlyInstallationRecordsAfterDate(
    executor,
    {
      balanceGroup,
      startDate: date,
      substationId,
      year,
    },
  );

  // 4. Batch update future records (transactional)
  if (futureRecordIds.length > 0) {
    const updatedCount = await incrementYearlyInstallationRecords(
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
