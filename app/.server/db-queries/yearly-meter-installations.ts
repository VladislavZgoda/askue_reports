import { yearlyMeterInstallations } from "../schema";
import { eq, and, desc, lt, gt, inArray } from "drizzle-orm";

import { increment } from "./query-helpers";
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
 * @example
 *   await createYearlyMeterInstallation(tx, {
 *     totalInstalled: 6,
 *     registeredCount: 5,
 *     balanceGroup: "Быт",
 *     date: "2025-08-14",
 *     substationId: 15,
 *     year: 2025,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Input data for the new record
 * @param params.totalInstalled - Total meters installed for the year
 * @param params.registeredCount - Meters registered in the system
 * @param params.balanceGroup - Balance group category
 * @param params.date - Date of the record
 * @param params.substationId - Transformer substation ID
 * @param params.year - Year of the installation record
 * @throws Will throw if registeredCount more than totalInstalled
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
 * Retrieves the most recent yearly meter installation ID for a given
 * combination of parameters
 *
 * @example
 *   const id = await getLatestYearlyInstallationId(tx, {
 *     balanceGroup: "Быт",
 *     substationId: 15,
 *     year: 2025,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Filter parameters
 * @param params.balanceGroup - Balance group category (e.g. "Быт")
 * @param params.substationId - Transformer substation ID
 * @param params.year - Year of the installation record
 * @returns The latest installation record ID, or 'undefined' if no match found
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
 * @example
 *   await updateYearlyInstallationRecordById(tx, {
 *     id: 12,
 *     totalInstalled: 5,
 *     registeredCount: 4,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.id - Record ID to update
 * @param params.totalInstalled - New total installed meters count
 * @param params.registeredCount - New registered meters count
 * @throws Will throw if registeredCount more than totalInstalled
 * @throws Will throw if no record with the given ID exists
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

interface FindMeterInstallationParams {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  year: YearlyMeterInstallations["year"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
}

export async function findYearlyMeterInstallationId(
  executor: Executor,
  { balanceGroup, date, substationId, year }: FindMeterInstallationParams,
): Promise<number | undefined> {
  const result = await executor.query.yearlyMeterInstallations.findFirst({
    columns: { id: true },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.date, date),
      eq(yearlyMeterInstallations.year, year),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
    ),
  });

  return result?.id;
}

interface YearlyInstallationSummaryQuery {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  cutoffDate: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Retrieves yearly installation statistics from the latest record BEFORE a
 * cutoff date
 *
 * @example
 *   // Get latest 2025 stats before June 1st
 *   const stats = await getYearlyInstallationSummaryBeforeCutoff(executor, {
 *     balanceGroup: "ОДПУ П2",
 *     cutoffDate: "2025-06-01",
 *     substationId: 101,
 *     year: 2025,
 *   });
 *
 *   // Returns: { totalInstalled: 85, registeredCount: 80 }
 *   // Or zero stats: { totalInstalled: 0, registeredCount: 0 }
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Query parameters
 * @param params.balanceGroup - Balance group category (e.g., 'Быт', 'ЮР Sims',
 *   etc.)
 * @param params.cutoffDate - Cutoff date (ISO string) - returns latest record
 *   BEFORE this date
 * @param params.year - Year of installation statistics
 * @param params.substationId - Transformer substation ID
 * @returns Object containing:
 *
 *   - `totalInstalled`: Total meters installed
 *   - `registeredCount`: Currently registered meters Returns `{ totalInstalled: 0,
 *       registeredCount: 0 }` if no matching record found
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

interface YearlyMeterInstallationIncrementParams {
  recordId: YearlyMeterInstallations["id"];
  totalInstalled: YearlyMeterInstallations["totalInstalled"];
  registeredCount: YearlyMeterInstallations["registeredCount"];
}

/**
 * Increments the installation counts for a specific yearly meter installation
 * record.
 *
 * @param executor - Database client or transaction executor
 * @param params - Parameters for the increment operation
 * @param params.recordId - Database ID of the record to update
 * @param params.totalInstalled - Number to add to the current `totalInstalled`
 *   count
 * @param params.registeredCount - Number to add to the current
 *   `registeredCount` count
 * @throws {Error} If the record with the given ID is not found
 */
export async function incrementYearlyMeterInstallationCountsById(
  executor: Executor,
  {
    recordId,
    totalInstalled,
    registeredCount,
  }: YearlyMeterInstallationIncrementParams,
): Promise<void> {
  validateInstallationParams({ totalInstalled, registeredCount });

  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(yearlyMeterInstallations)
    .set({
      totalInstalled: increment(
        yearlyMeterInstallations.totalInstalled,
        totalInstalled,
      ),
      registeredCount: increment(
        yearlyMeterInstallations.registeredCount,
        registeredCount,
      ),
      updatedAt,
    })
    .where(eq(yearlyMeterInstallations.id, recordId))
    .returning();

  if (!updatedRecord) {
    throw new Error("Yearly installation record not found");
  }
}

interface YearlyInstallationIncrementParams {
  totalIncrement: YearlyMeterInstallations["totalInstalled"];
  registeredIncrement: YearlyMeterInstallations["registeredCount"];
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  minDate: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Batch increments yearly installations for future records. Updates all records
 * with date > minDate for the given balance group, substation and year.
 */
export async function incrementFutureYearlyInstallations(
  executor: Executor,
  params: YearlyInstallationIncrementParams,
): Promise<void> {
  const {
    totalIncrement,
    registeredIncrement,
    balanceGroup,
    minDate,
    substationId,
    year,
  } = params;

  validateInstallationParams({
    totalInstalled: totalIncrement,
    registeredCount: registeredIncrement,
  });

  const futureRecordIds = executor
    .select({ id: yearlyMeterInstallations.id })
    .from(yearlyMeterInstallations)
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        gt(yearlyMeterInstallations.date, minDate),
        eq(yearlyMeterInstallations.transformerSubstationId, substationId),
        eq(yearlyMeterInstallations.year, year),
      ),
    );

  await executor
    .update(yearlyMeterInstallations)
    .set({
      totalInstalled: increment(
        yearlyMeterInstallations.totalInstalled,
        totalIncrement,
      ),
      registeredCount: increment(
        yearlyMeterInstallations.registeredCount,
        registeredIncrement,
      ),
      updatedAt: new Date(),
    })
    .where(and(inArray(yearlyMeterInstallations.id, futureRecordIds)));
}
