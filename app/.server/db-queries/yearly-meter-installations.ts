import { yearlyMeterInstallations } from "../schema";
import { eq, and, desc, lt, gt, sql, inArray } from "drizzle-orm";

import { validateInstallationParams } from "~/utils/installation-params";

import type { InstallationStats } from "~/utils/installation-params";

type YearlyMeterInstallations = typeof yearlyMeterInstallations.$inferSelect;

interface YearlyMeterInstallationInput {
  totalInstalled: YearlyMeterInstallations["totalInstalled"];
  registeredCount: YearlyMeterInstallations["registeredCount"];
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Creates a new yearly meter installation record
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Input data for the new record
 * @param params.totalInstalled - Total meters installed for the year
 * @param params.registeredCount - Meters registered in the system
 * @param params.balanceGroup - Balance group category
 * @param params.date - Date of the record
 * @param params.substationId - Transformer substation ID
 * @param params.year - Year of the installation record
 *
 * @throws Will throw if registeredCount more than totalInstalled
 *
 * @example
 * await createYearlyMeterInstallation(tx, {
 *   totalInstalled: 6,
 *   registeredCount: 5,
 *   balanceGroup: "Быт",
 *   date: "2025-08-14",
 *   substationId: 15,
 *   year: 2025
 * })
 */
export async function createYearlyMeterInstallation(
  executor: Executor,
  params: YearlyMeterInstallationInput,
): Promise<void> {
  const {
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    substationId,
    year,
  } = params;

  validateInstallationParams({
    totalInstalled,
    registeredCount,
  });

  await executor.insert(yearlyMeterInstallations).values({
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
    year,
  });
}

interface YearlyInstallationIdParams {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Retrieves the most recent yearly meter installation ID for a given combination of parameters
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Filter parameters
 * @param params.balanceGroup - Balance group category (e.g. "Быт")
 * @param params.substationId - Transformer substation ID
 * @param params.year - Year of the installation record
 *
 * @returns The latest installation record ID, or 'undefined' if no match found
 *
 * @example
 * const id = await getLatestYearlyInstallationId(tx, {
 *   balanceGroup: "Быт",
 *   substationId: 15,
 *   year: 2025
 * })
 */
export async function getLatestYearlyInstallationId(
  executor: Executor,
  { balanceGroup, substationId, year }: YearlyInstallationIdParams,
): Promise<number | undefined> {
  const result = await executor.query.yearlyMeterInstallations.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
      eq(yearlyMeterInstallations.year, year),
    ),
    orderBy: [desc(yearlyMeterInstallations.date)],
  });

  return result?.id;
}

interface YearlyInstallationUpdateInput {
  id: YearlyMeterInstallations["id"];
  totalInstalled: YearlyMeterInstallations["totalInstalled"];
  registeredCount: YearlyMeterInstallations["registeredCount"];
}

/**
 * Updates a yearly installation record by its ID
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.id - Record ID to update
 * @param params.totalInstalled - New total installed meters count
 * @param params.registeredCount - New registered meters count
 *
 * @throws Will throw if registeredCount more than totalInstalled
 * @throws Will throw if no record with the given ID exists
 *
 * @example
 * await updateYearlyInstallationRecordById(tx, {
 *   id: 12,
 *   totalInstalled: 5,
 *   registeredCount: 4
 * })
 */
export async function updateYearlyInstallationRecordById(
  executor: Executor,
  { id, totalInstalled, registeredCount }: YearlyInstallationUpdateInput,
): Promise<void> {
  validateInstallationParams({
    totalInstalled,
    registeredCount,
  });

  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(yearlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(eq(yearlyMeterInstallations.id, id))
    .returning();

  if (!updatedRecord) {
    throw new Error(`Yearly installation record with ID ${id} not found`);
  }
}

interface YearlyMeterInstallationsStatsParams {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  year: YearlyMeterInstallations["year"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
}

/**
 * Retrieves yearly meter installation statistics by exact match criteria
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Lookup parameters
 * @param params.balanceGroup - Balance group category (e.g., 'Быт', 'ЮР Sims', etc.)
 * @param params.date - Exact record date (ISO date string)
 * @param params.year - Year of installation statistics
 * @param params.substationId - Transformer substation ID
 *
 * @returns Object containing:
 *   - `totalInstalled`: Total meters installed
 *   - `registeredCount`: Currently registered meters
 *   Returns `undefined` if no matching record found
 *
 * @example
 * const stats = await getYearlyMeterInstallationStats(executor, {
 *   balanceGroup: 'ЮР П2',
 *   date: '2025-08-17',
 *   year: 2025,
 *   substationId: 789
 * });
 *
 * // Returns: { totalInstalled: 150, registeredCount: 145 } | undefined
 */
export async function getYearlyMeterInstallationStats(
  executor: Executor,
  {
    balanceGroup,
    date,
    substationId,
    year,
  }: YearlyMeterInstallationsStatsParams,
): Promise<InstallationStats | undefined> {
  const result = await executor.query.yearlyMeterInstallations.findFirst({
    columns: { totalInstalled: true, registeredCount: true },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.date, date),
      eq(yearlyMeterInstallations.year, year),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
    ),
  });

  return result;
}

interface YearlyInstallationSummaryQuery {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  cutoffDate: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Retrieves yearly installation statistics from the latest record BEFORE a cutoff date
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Query parameters
 * @param params.balanceGroup - Balance group category (e.g., 'Быт', 'ЮР Sims', etc.)
 * @param params.cutoffDate - Cutoff date (ISO string) - returns latest record BEFORE this date
 * @param params.year - Year of installation statistics
 * @param params.substationId - Transformer substation ID
 *
 * @returns Object containing:
 *   - `totalInstalled`: Total meters installed
 *   - `registeredCount`: Currently registered meters
 *   Returns `{ totalInstalled: 0, registeredCount: 0 }` if no matching record found
 *
 * @example
 * // Get latest 2025 stats before June 1st
 * const stats = await getYearlyInstallationSummaryBeforeCutoff(executor, {
 *   balanceGroup: 'ОДПУ П2',
 *   cutoffDate: '2025-06-01',
 *   substationId: 101,
 *   year: 2025
 * });
 *
 * // Returns: { totalInstalled: 85, registeredCount: 80 }
 * // Or zero stats: { totalInstalled: 0, registeredCount: 0 }
 */
export async function getYearlyInstallationSummaryBeforeCutoff(
  executor: Executor,
  {
    balanceGroup,
    cutoffDate,
    substationId,
    year,
  }: YearlyInstallationSummaryQuery,
): Promise<InstallationStats> {
  const result = await executor.query.yearlyMeterInstallations.findFirst({
    columns: { totalInstalled: true, registeredCount: true },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.year, year),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
      lt(yearlyMeterInstallations.date, cutoffDate),
    ),
    orderBy: [desc(yearlyMeterInstallations.date)],
  });

  return result ?? { totalInstalled: 0, registeredCount: 0 };
}

interface YearlyMeterInstallationUpdateParams {
  totalInstalled: YearlyMeterInstallations["totalInstalled"];
  registeredCount: YearlyMeterInstallations["registeredCount"];
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Updates an existing yearly meter installation record
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.totalInstalled - New total installed meters count
 * @param params.registeredCount - New registered meters count
 * @param params.balanceGroup - Balance group category (e.g., 'Быт', 'ЮР Sims', etc.)
 * @param params.date - Exact date of the record (YYYY-MM-DD format)
 * @param params.year - Year of installation record
 * @param param.substationId - Transformer substation ID
 *
 * @throws {Error} if no matching record is found
 *
 * @example
 * await updateYearlyMeterInstallation(executor, {
 *   totalInstalled: 10,
 *   registeredCount: 8,
 *   balanceGroup: "Быт",
 *   date: "2025-08-18",
 *   year: 2025,
 *   substationId: 4,
 * })
 */
export async function updateYearlyMeterInstallation(
  executor: Executor,
  params: YearlyMeterInstallationUpdateParams,
): Promise<void> {
  const {
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    year,
    substationId,
  } = params;

  validateInstallationParams({ totalInstalled, registeredCount });

  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(yearlyMeterInstallations)
    .set({
      totalInstalled,
      registeredCount,
      updatedAt,
    })
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(yearlyMeterInstallations.date, date),
        eq(yearlyMeterInstallations.transformerSubstationId, substationId),
        eq(yearlyMeterInstallations.year, year),
      ),
    )
    .returning();

  if (!updatedRecord) {
    throw new Error("Yearly installation record not found");
  }
}

interface YearlyInstallationRecordQuery {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  startDate: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Retrieves yearly installation record IDs created after a specific date
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Filter parameters
 * @param params.balanceGroup - Balance group category (e.g., 'Быт', 'ЮР Sims', etc.)
 * @param params.startDate - Minimum date threshold (exclusive) in YYYY-MM-DD
 * @param params.year - Year of installation record
 * @param params.substationId - Transformer substation ID
 *
 * @returns Array of record IDs. Empty array if no matches found.
 *
 * @example
 * const futureRecordIds = await getYearlyInstallationRecordsAfterDate(executor, {
 *   balanceGroup: "Быт",
 *   startDate: "2025-08-01",
 *   year: 2025,
 *   substationId: 12,
 * })
 */
export async function getYearlyInstallationRecordsAfterDate(
  executor: Executor,
  {
    balanceGroup,
    startDate,
    year,
    substationId,
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
 * @param executor - Database client for query execution (supports transactions)
 * @param ids - Record IDs to update
 * @param totalIncrement - Value to add to total_installed
 * @param registeredIncrement - Value to add to registered_count
 *
 * @returns Number of successfully updated records
 *
 * @throws Error if validation fails (registered > total)
 *
 * @example
 * const updatedCount = await incrementYearlyInstallationRecords(executor, [1, 15, 25], 2, 1)
 */
export async function incrementYearlyInstallationRecords(
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
