import { sql, and, eq, gt, lt, desc, inArray } from "drizzle-orm";
import { monthlyMeterInstallations } from "~/.server/schema";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";
import { validateInstallationParams } from "../utils/installation-params";

import type { InstallationStats } from "../utils/installation-params";

type MonthlyMeterInstallations = typeof monthlyMeterInstallations.$inferSelect;

interface MonthlyMeterInstallationsStatsParams {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  date: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

/**
 * Retrieves monthly installation stats for a specific date
 *
 * @returns Installation stats or undefined if not found
 */
async function getMonthlyMeterInstallationStats(
  executor: Executor,
  {
    balanceGroup,
    date,
    substationId,
    month,
    year,
  }: MonthlyMeterInstallationsStatsParams,
): Promise<InstallationStats | undefined> {
  const result = await executor.query.monthlyMeterInstallations.findFirst({
    columns: {
      totalInstalled: true,
      registeredCount: true,
    },
    where: and(
      eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
      eq(monthlyMeterInstallations.date, date),
      eq(monthlyMeterInstallations.transformerSubstationId, substationId),
      eq(monthlyMeterInstallations.month, month),
      eq(monthlyMeterInstallations.year, year),
    ),
  });

  return result;
}

interface MonthlyInstallationUpdateParams {
  totalInstalled: MonthlyMeterInstallations["totalInstalled"];
  registeredCount: MonthlyMeterInstallations["registeredCount"];
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  date: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

async function updateMonthlyInstallationRecord(
  executor: Executor,
  params: MonthlyInstallationUpdateParams,
) {
  validateInstallationParams(params);

  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(monthlyMeterInstallations)
    .set({
      totalInstalled: params.totalInstalled,
      registeredCount: params.registeredCount,
      updatedAt,
    })
    .where(
      and(
        eq(monthlyMeterInstallations.balanceGroup, params.balanceGroup),
        eq(monthlyMeterInstallations.date, params.date),
        eq(
          monthlyMeterInstallations.transformerSubstationId,
          params.substationId,
        ),
        eq(monthlyMeterInstallations.month, params.month),
        eq(monthlyMeterInstallations.year, params.year),
      ),
    )
    .returning();

  if (!updatedRecord) {
    throw new Error("No monthly installation record found to update");
  }
}

interface MonthlyInstallationSummaryQuery {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  cutoffDate: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

/**
 * Gets the latest installation summary before a cutoff date
 *
 * @returns Installation stats with zero values if not found
 */
async function getMonthlyInstallationSummaryBeforeCutoff(
  executor: Executor,
  {
    balanceGroup,
    cutoffDate,
    substationId,
    month,
    year,
  }: MonthlyInstallationSummaryQuery,
): Promise<InstallationStats> {
  const result = await executor.query.monthlyMeterInstallations.findFirst({
    columns: {
      totalInstalled: true,
      registeredCount: true,
    },
    where: and(
      eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
      eq(monthlyMeterInstallations.year, year),
      eq(monthlyMeterInstallations.month, month),
      eq(monthlyMeterInstallations.transformerSubstationId, substationId),
      lt(monthlyMeterInstallations.date, cutoffDate),
    ),
    orderBy: [desc(monthlyMeterInstallations.date)],
  });

  return result ?? { totalInstalled: 0, registeredCount: 0 };
}

interface MonthlyInstallationInput {
  totalInstalled: MonthlyMeterInstallations["totalInstalled"];
  registeredCount: MonthlyMeterInstallations["registeredCount"];
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  date: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

async function createMonthlyInstallationRecord(
  executor: Executor,
  params: MonthlyInstallationInput,
) {
  validateInstallationParams(params);

  await executor.insert(monthlyMeterInstallations).values({
    totalInstalled: params.totalInstalled,
    registeredCount: params.registeredCount,
    balanceGroup: params.balanceGroup,
    date: params.date,
    transformerSubstationId: params.substationId,
    month: params.month,
    year: params.year,
  });
}

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

interface MonthlyInstallationRecordQuery {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  startDate: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

async function getMonthlyInstallationRecordsAfterDate(
  executor: Executor,
  {
    balanceGroup,
    startDate,
    substationId,
    month,
    year,
  }: MonthlyInstallationRecordQuery,
): Promise<number[]> {
  const result = await executor.query.monthlyMeterInstallations.findMany({
    columns: {
      id: true,
    },
    where: and(
      eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
      gt(monthlyMeterInstallations.date, startDate),
      eq(monthlyMeterInstallations.transformerSubstationId, substationId),
      eq(monthlyMeterInstallations.month, month),
      eq(monthlyMeterInstallations.year, year),
    ),
  });

  return result.map((r) => r.id);
}

/**
 * Batched update of future installation records
 *
 * Atomically increments counts with safety validation
 *
 * @param executor - Database executor
 * @param ids - Record IDs to update
 * @param totalIncrement - Value to add to total_installed
 * @param registeredIncrement - Value to add to registered_count
 * @returns Number of updated records
 *
 * @throws May propagate database errors
 */
async function incrementMonthlyInstallationRecords(
  executor: Executor,
  ids: number[],
  totalIncrement: number,
  registeredIncrement: number,
): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await executor
    .update(monthlyMeterInstallations)
    .set({
      totalInstalled: sql`${monthlyMeterInstallations.totalInstalled} + ${totalIncrement}`,
      registeredCount: sql`${monthlyMeterInstallations.registeredCount} + ${registeredIncrement}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(monthlyMeterInstallations.id, ids),
        sql`${monthlyMeterInstallations.registeredCount} + ${registeredIncrement}
            <= ${monthlyMeterInstallations.totalInstalled} + ${totalIncrement}`,
      ),
    )
    .returning();

  return result.length;
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
 * 1. Updates or creates monthly accumulation records
 * 2. Propagates counts to future records in the same month
 *
 * Performs all operations within a database transaction
 *
 * @param executor - Database executor
 * @param monthlyInstallation - Validated installation data
 *   @property totalCount - Total meters installed
 *   @property registeredCount - Meters registered in system
 *   @property balanceGroup - Balance group category
 *   @property date - Installation date (YYYY-MM-DD)
 *   @property substationId - Associated substation ID
 *
 * @throws {Error} When:
 *   - Registered count exceeds total installed
 *   - Batch update partially fails
 *   - Database constraints are violated
 *
 * @example
 * await processMonthlyInstallations({
 *   totalCount: 15,
 *   registeredCount: 12,
 *   balanceGroup: 'ЮР Sims',
 *   date: '2023-06-15',
 *   substationId: 42
 * });
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
