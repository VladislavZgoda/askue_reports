import { monthlyMeterInstallations } from "../schema";
import { eq, and, desc, lt, gt, inArray } from "drizzle-orm";

import { increment } from "./query-helpers";
import { validateInstallationParams } from "~/utils/installation-params";

import type { InstallationStats } from "~/utils/installation-params";

type MonthlyMeterInstallations = typeof monthlyMeterInstallations.$inferSelect;

interface MonthlyInstallationInput {
  totalInstalled: MonthlyMeterInstallations["totalInstalled"];
  registeredCount: MonthlyMeterInstallations["registeredCount"];
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  date: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

/**
 * Creates new monthly installation record after validation
 *
 * @example
 *   await createMonthlyInstallationRecord(tx, {
 *     totalInstalled: 6,
 *     registeredCount: 5,
 *     balanceGroup: "Быт",
 *     date: "2025-08-14",
 *     substationId: 15,
 *     month: "08",
 *     year: 2025,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Input data for the new record
 * @param params.totalInstalled - Total meters installed for the month
 * @param params.registeredCount - Meters registered in ASKUE system
 * @param params.balanceGroup - Balance group category
 * @param params.date - Date of the record
 * @param params.substationId - Transformer substation ID
 * @param params.month - Month of the installation record
 * @param params.year - Year of the installation record
 * @throws If validation fails (registeredCount > totalInstalled)
 */
export async function createMonthlyInstallationRecord(
  executor: Executor,
  params: MonthlyInstallationInput,
): Promise<void> {
  const {
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    substationId,
    month,
    year,
  } = params;

  validateInstallationParams({
    totalInstalled,
    registeredCount,
  });

  await executor.insert(monthlyMeterInstallations).values({
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
    month,
    year,
  });
}

interface MonthlyInstallationUpdateParams {
  totalInstalled: MonthlyMeterInstallations["totalInstalled"];
  registeredCount: MonthlyMeterInstallations["registeredCount"];
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  date: MonthlyMeterInstallations["date"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
}

/**
 * Updates an existing monthly meter installation record
 *
 * @example
 *   await updateMonthlyInstallationRecord(executor, {
 *     totalInstalled: 10,
 *     registeredCount: 8,
 *     balanceGroup: "Быт",
 *     date: "2025-08-18",
 *     month: "07",
 *     year: 2025,
 *     substationId: 5,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.totalInstalled - New total installed meters count
 * @param params.registeredCount - New registered meters count
 * @param params.balanceGroup - Balance group category (e.g., 'Быт', 'ЮР Sims',
 *   etc.)
 * @param params.date - Exact date of the record (YYYY-MM-DD format)
 * @param params.month - Month of the installation record
 * @param params.year - Year of installation record
 * @param param.substationId - Transformer substation ID
 * @throws {Error} If no matching record is found
 */
export async function updateMonthlyInstallationRecord(
  executor: Executor,
  params: MonthlyInstallationUpdateParams,
) {
  const {
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    month,
    year,
    substationId,
  } = params;

  validateInstallationParams({
    totalInstalled,
    registeredCount,
  });

  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(monthlyMeterInstallations)
    .set({
      totalInstalled,
      registeredCount,
      updatedAt,
    })
    .where(
      and(
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
        eq(monthlyMeterInstallations.date, date),
        eq(monthlyMeterInstallations.month, month),
        eq(monthlyMeterInstallations.year, year),
        eq(monthlyMeterInstallations.transformerSubstationId, substationId),
      ),
    )
    .returning();

  if (!updatedRecord) {
    throw new Error("No monthly installation record found to update");
  }
}

interface MonthlyMeterInstallationsStatsParams {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  date: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

/**
 * Retrieves monthly installation stats by exact match criteria
 *
 * @example
 *   const stats = await getMonthlyMeterInstallationStats(executor, {
 *     balanceGroup: "ЮР П2",
 *     date: "2025-08-17",
 *     month: "08",
 *     year: 2025,
 *     substationId: 78,
 *   });
 *
 *   // Returns: { totalInstalled: 150, registeredCount: 145 } | undefined
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Lookup parameters
 * @param params.balanceGroup - Balance group category (e.g., 'Быт', 'ЮР Sims',
 *   etc.)
 * @param params.date - Exact record date (ISO date string)
 * @param params.month - Month of installation statistics
 * @param params.year - Year of installation statistics
 * @param params.substationId - Transformer substation ID
 * @returns Object containing:
 *
 *   - `totalInstalled`: Total meters installed
 *   - `registeredCount`: Currently registered meters Returns `undefined` if no
 *       matching record found
 */
export async function getMonthlyMeterInstallationStats(
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

interface MonthlyInstallationIdParams {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

/**
 * Retrieves the most recent monthly meter installation ID for a given
 * combination of parameters
 *
 * @example
 *   const id = await getLatestMonthlyInstallationId(tx, {
 *     balanceGroup: "Быт",
 *     substationId: 15,
 *     month: "08",
 *     year: 2025,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Filter parameters
 * @param params.balanceGroup Balance group category (e.g. "Быт")
 * @param params.substationId Transformer substation ID (e.g. 7)
 * @param params.month Month of the installation record (e.g "01")
 * @param params.year Year of the installation record (e.g. 2025)
 * @returns The latest installation record ID, or 'undefined' if no match found
 */
export async function getLatestMonthlyInstallationId(
  executor: Executor,
  { balanceGroup, substationId, month, year }: MonthlyInstallationIdParams,
): Promise<number | undefined> {
  const result = await executor.query.monthlyMeterInstallations.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
      eq(monthlyMeterInstallations.transformerSubstationId, substationId),
      eq(monthlyMeterInstallations.month, month),
      eq(monthlyMeterInstallations.year, year),
    ),
    orderBy: [desc(monthlyMeterInstallations.date)],
  });

  return result?.id;
}

interface MonthlyInstallationUpdateInput {
  id: MonthlyMeterInstallations["id"];
  totalInstalled: MonthlyMeterInstallations["totalInstalled"];
  registeredCount: MonthlyMeterInstallations["registeredCount"];
}

/**
 * Updates a monthly installation record by its ID
 *
 * @example
 *   await updateMonthlyInstallationRecordById(tx, {
 *     id: 12,
 *     totalInstalled: 5,
 *     registeredCount: 4,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.id Record ID to update
 * @param params.totalInstalled New total installed meters count
 * @param params.registeredCount New registered meters count
 * @throws Will throw if registeredCount more than totalInstalled
 * @throws Will throw if no record with the given ID exists
 */
export async function updateMonthlyInstallationRecordById(
  executor: Executor,
  { id, totalInstalled, registeredCount }: MonthlyInstallationUpdateInput,
): Promise<void> {
  validateInstallationParams({ totalInstalled, registeredCount });

  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(monthlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(eq(monthlyMeterInstallations.id, id))
    .returning();

  if (!updatedRecord) {
    throw new Error(`Monthly installation record with ID ${id} not found`);
  }
}

interface MonthlyInstallationSummaryQuery {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  cutoffDate: MonthlyMeterInstallations["date"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
}

/**
 * Retrieves monthly installation statistics from the latest record BEFORE a
 * cutoff date
 *
 * @example
 *   // Get latest 2025 stats before June 1st
 *   const stats = await getMonthlyInstallationSummaryBeforeCutoff(executor, {
 *     balanceGroup: "ОДПУ П2",
 *     cutoffDate: "2025-06-15",
 *     month: "06",
 *     year: 2025,
 *     substationId: 101,
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
 * @param params.month - Month of installation statistics
 * @param params.year - Year of installation statistics
 * @param params.substationId - Transformer substation ID
 * @returns Object containing:
 *
 *   - `totalInstalled`: Total meters installed
 *   - `registeredCount`: Currently registered meters Returns `{ totalInstalled: 0,
 *       registeredCount: 0 }` if no matching record found
 */
export async function getMonthlyInstallationSummaryBeforeCutoff(
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

interface MonthlyInstallationIncrementParams {
  totalIncrement: MonthlyMeterInstallations["totalInstalled"];
  registeredIncrement: MonthlyMeterInstallations["registeredCount"];
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  minDate: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

/**
 * Batch increments monthly installations for future records. Updates all
 * records with date > minDate for the given balance group, substation, month
 * and year.
 */
export async function incrementFutureMonthlyInstallations(
  executor: Executor,
  params: MonthlyInstallationIncrementParams,
): Promise<void> {
  const {
    totalIncrement,
    registeredIncrement,
    balanceGroup,
    minDate,
    substationId,
    month,
    year,
  } = params;

  validateInstallationParams({
    totalInstalled: totalIncrement,
    registeredCount: registeredIncrement,
  });

  const futureRecordIds = executor
    .select({ id: monthlyMeterInstallations.id })
    .from(monthlyMeterInstallations)
    .where(
      and(
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
        gt(monthlyMeterInstallations.date, minDate),
        eq(monthlyMeterInstallations.transformerSubstationId, substationId),
        eq(monthlyMeterInstallations.month, month),
        eq(monthlyMeterInstallations.year, year),
      ),
    );

  await executor
    .update(monthlyMeterInstallations)
    .set({
      totalInstalled: increment(
        monthlyMeterInstallations.totalInstalled,
        totalIncrement,
      ),
      registeredCount: increment(
        monthlyMeterInstallations.registeredCount,
        registeredIncrement,
      ),
      updatedAt: new Date(),
    })
    .where(and(inArray(monthlyMeterInstallations.id, futureRecordIds)));
}
