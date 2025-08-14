import { db } from "../db";
import { monthlyMeterInstallations } from "../schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

import { validateInstallationParams } from "~/utils/installation-params";

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
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Input data for the new record
 * @param params.totalInstalled - Total meters installed for the month
 * @param params.registeredCount - Meters registered in ASKUE system
 * @param params.balanceGroup - Balance group category
 * @param params.date - Date of the record
 * @param params.substationId - Transformer substation ID
 * @param params.month - Month of the installation record
 * @param params.year - Year of the installation record
 *
 * @throws If validation fails (registeredCount > totalInstalled)
 *
 * @example
 * await createMonthlyInstallationRecord(tx, {
 *   totalInstalled: 6,
 *   registeredCount: 5,
 *   balanceGroup: "Быт",
 *   date: "2025-08-14",
 *   substationId: 15,
 *   month: "08",
 *   year: 2025
 * })
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

interface MonthlyInstallationLookupParams {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  date: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

interface InstallationSummary {
  totalInstalled: number;
  registeredCount: number;
}

/**
 * Retrieves monthly installation summary by exact match criteria
 *
 * @param date Exact record date (YYYY-MM-DD format)
 * @param month Month of the installation record
 * @param year Year of the installation record
 * @param balanceGroup Balance group filter
 * @param substationId Transformer substation ID
 * @returns Summary object with total installed and registered counts,
 *          or undefined if not found
 */
export async function getMonthlyInstallationSummary({
  balanceGroup,
  date,
  substationId,
  month,
  year,
}: MonthlyInstallationLookupParams): Promise<InstallationSummary | undefined> {
  const result = await db.query.monthlyMeterInstallations.findFirst({
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
 * Retrieves the most recent monthly meter installation ID for a given combination of parameters
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Filter parameters
 * @param params.balanceGroup Balance group category (e.g. "Быт")
 * @param params.substationId Transformer substation ID (e.g. 7)
 * @param params.month Month of the installation record (e.g "01")
 * @param params.year Year of the installation record (e.g. 2025)
 *
 * @returns The latest installation record ID, or 'undefined' if no match found
 *
 * @example
 * const id = await getLatestMonthlyInstallationId(tx, {
 *   balanceGroup: "Быт",
 *   substationId: 15,
 *   month: "08",
 *   year: 2025
 * })
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
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.id Record ID to update
 * @param params.totalInstalled New total installed meters count
 * @param params.registeredCount New registered meters count
 *
 * @throws Will throw if registeredCount more than totalInstalled
 * @throws Will throw if no record with the given ID exists
 *
 * @example
 * await updateMonthlyInstallationRecordById(tx, {
 *   id: 12,
 *   totalInstalled: 5,
 *   registeredCount: 4
 * })
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

interface PreviousMonthInstallationSummaryParams {
  balanceGroup: BalanceGroup;
  periodStart: string;
  periodEnd: string;
  transformerSubstationId: number;
}

/**
 * Retrieves the latest meter installation summary for the previous month
 * within the specified date period range
 *
 * @param periodStart Start date of the period (YYYY-MM-DD format)
 * @param periodEnd End date of the period (YYYY-MM-DD format)
 * @returns The latest installation summary or undefined if not found
 *
 * @throws {Error} If periodStart > periodEnd
 */
export async function getPreviousMonthInstallationSummary({
  balanceGroup,
  periodStart,
  periodEnd,
  transformerSubstationId,
}: PreviousMonthInstallationSummaryParams) {
  if (new Date(periodStart) > new Date(periodEnd)) {
    throw new Error("periodStart must be before periodEnd");
  }

  const result = await db.query.monthlyMeterInstallations.findFirst({
    columns: {
      totalInstalled: true,
      registeredCount: true,
    },
    where: and(
      eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
      gte(monthlyMeterInstallations.date, periodStart),
      lte(monthlyMeterInstallations.date, periodEnd),
      eq(
        monthlyMeterInstallations.transformerSubstationId,
        transformerSubstationId,
      ),
    ),
    orderBy: desc(monthlyMeterInstallations.date),
  });

  return result;
}
