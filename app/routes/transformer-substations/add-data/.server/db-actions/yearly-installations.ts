import { sql, and, eq, gt, inArray } from "drizzle-orm";
import { yearlyMeterInstallations } from "~/.server/schema";
import { cutOutYear } from "~/utils/dateFunctions";

import {
  createYearlyMeterInstallation,
  updateYearlyMeterInstallation,
  getYearlyMeterInstallationsStats,
  getYearlyInstallationSummaryBeforeCutoff,
} from "~/.server/db-queries/yearlyMeterInstallations";

import type { InstallationStats } from "../../../../../utils/installation-params";

type YearlyMeterInstallations = typeof yearlyMeterInstallations.$inferSelect;

interface YearlyInstallationRecordQuery {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  startDate: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

async function getYearlyInstallationRecordsAfterDate(
  executor: Executor,
  {
    balanceGroup,
    startDate,
    substationId,
    year,
  }: YearlyInstallationRecordQuery,
): Promise<number[]> {
  const result = await executor.query.yearlyMeterInstallations.findMany({
    columns: { id: true },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      gt(yearlyMeterInstallations.date, startDate),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
      eq(yearlyMeterInstallations.year, year),
    ),
  });

  return result.map((r) => r.id);
}

/**
 * Updates yearly installation records in batch with safety validation
 *
 * @param executor Database executor
 * @param ids Record IDs to update
 * @param totalIncrement Value to add to total_installed
 * @param registeredIncrement Value to add to registered_count
 * @returns Number of successfully updated records
 *
 * @throws Error if validation fails (registered > total)
 */
async function incrementYearlyInstallationRecords(
  executor: Executor,
  ids: number[],
  totalIncrement: number,
  registeredIncrement: number,
): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await executor
    .update(yearlyMeterInstallations)
    .set({
      totalInstalled: sql`${yearlyMeterInstallations.totalInstalled} + ${totalIncrement}`,
      registeredCount: sql`${yearlyMeterInstallations.registeredCount} + ${registeredIncrement}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(yearlyMeterInstallations.id, ids),
        sql`${yearlyMeterInstallations.registeredCount} + ${registeredIncrement}
            <= ${yearlyMeterInstallations.totalInstalled} + ${totalIncrement}`,
      ),
    )
    .returning();

  return result.length;
}

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
 * 1. Updates or creates yearly accumulation records
 * 2. Propagates installation counts to future records
 *
 * Performs all operations within a database transaction to ensure data consistency
 *
 * @param executor - Database executor
 * @param yearlyInstallation Installation data with validation
 *   @property totalCount - Total meters installed
 *   @property registeredCount - Meters registered in system
 *   @property balanceGroup - Balance group category
 *   @property date - Installation date (YYYY-MM-DD)
 *   @property substationId - Associated substation ID
 *
 * @throws Error if:
 *   - Validation fails (registered > total)
 *   - Batch update partially fails
 *   - Database constraints are violated
 *
 * @example
 * await processYearlyInstallations({
 *   totalCount: 15,
 *   registeredCount: 12,
 *   balanceGroup: 'Быт',
 *   date: '2023-06-15',
 *   substationId: 42
 * });
 */
export default async function processYearlyInstallations(
  executor: Executor,
  yearlyInstallation: YearlyInstallationData,
) {
  const { totalCount, registeredCount, balanceGroup, date, substationId } =
    yearlyInstallation;

  const year = cutOutYear(date);

  // 1. Get current stats (transactional)
  const currentYearStats = await getYearlyMeterInstallationsStats(executor, {
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
