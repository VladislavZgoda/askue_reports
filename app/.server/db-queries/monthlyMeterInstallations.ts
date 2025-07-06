import { db } from "../db";
import { monthlyMeterInstallations } from "../schema";
import { eq, and, desc, gt, gte, lt, lte } from "drizzle-orm";

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
 * @param params Input parameters
 * @throws If validation fails (registeredCount > totalInstalled)
 */
export async function createMonthlyInstallationRecord(
  params: MonthlyInstallationInput,
) {
  validateInstallationParams(params);

  await db.insert(monthlyMeterInstallations).values({
    totalInstalled: params.totalInstalled,
    registeredCount: params.registeredCount,
    balanceGroup: params.balanceGroup,
    date: params.date,
    transformerSubstationId: params.substationId,
    month: params.month,
    year: params.year,
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

export async function selectLastMonthQuantity({
  balanceGroup,
  transformerSubstationId,
  month,
  year,
}: LastMonthQuantity) {
  const monthQuantity = await db
    .select({
      totalInstalled: monthlyMeterInstallations.totalInstalled,
      registeredCount: monthlyMeterInstallations.registeredCount,
    })
    .from(monthlyMeterInstallations)
    .where(
      and(
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
        eq(
          monthlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(monthlyMeterInstallations.month, month),
        eq(monthlyMeterInstallations.year, year),
      ),
    )
    .orderBy(desc(monthlyMeterInstallations.date))
    .limit(1);

  return monthQuantity;
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

/**
 * Updates a monthly installation record by its composite key
 *
 * @param params Composite key and update values
 *
 * @throws Will throw if registeredCount more than totalInstalled
 * @throws Will throw if no matching record is found
 */
export async function updateMonthlyInstallationRecord(
  params: MonthlyInstallationUpdateParams,
) {
  validateInstallationParams(params);

  const updatedAt = new Date();

  const [updatedRecord] = await db
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

function validateInstallationParams(params: InstallationSummary) {
  if (params.registeredCount > params.totalInstalled) {
    throw new Error("Registered count cannot exceed total installed");
  }
}

export async function getLastMonthId({
  balanceGroup,
  transformerSubstationId,
  month,
  year,
}: LastMonthQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({ id: monthlyMeterInstallations.id })
    .from(monthlyMeterInstallations)
    .where(
      and(
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
        eq(
          monthlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(monthlyMeterInstallations.month, month),
        eq(monthlyMeterInstallations.year, year),
      ),
    )
    .orderBy(desc(monthlyMeterInstallations.date))
    .limit(1);

  return recordId[0]?.id;
}

interface MonthlyInstallationUpdateInput {
  id: MonthlyMeterInstallations["id"];
  totalInstalled: MonthlyMeterInstallations["totalInstalled"];
  registeredCount: MonthlyMeterInstallations["registeredCount"];
}

/**
 * Updates a monthly installation record by its ID
 *
 * @param id Record ID to update
 * @param totalInstalled New total installed meters count
 * @param registeredCount New registered meters count
 *
 * @throws Will throw if registeredCount more than totalInstalled
 * @throws Will throw if no record with the given ID exists
 */
export async function updateMonthlyInstallationRecordById({
  id,
  totalInstalled,
  registeredCount,
}: MonthlyInstallationUpdateInput) {
  validateInstallationParams({ totalInstalled, registeredCount });

  const updatedAt = new Date();

  const [updatedRecord] = await db
    .update(monthlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(eq(monthlyMeterInstallations.id, id))
    .returning();

  if (!updatedRecord) {
    throw new Error(`Monthly installation record with ID ${id} not found`);
  }
}

interface MonthlyInstallationRecordQuery {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  startDate: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

/**
 * Retrieves monthly installation records after a specific date
 *
 * @param startDate Starting date (exclusive) for records (YYYY-MM-DD format)
 * @param balanceGroup Balance group filter
 * @param substationId Transformer substation ID
 * @param month Month filter
 * @param year Year filter
 * @returns Array of record objects containing IDs
 */
export async function getMonthlyInstallationRecordsAfterDate({
  balanceGroup,
  startDate,
  substationId,
  month,
  year,
}: MonthlyInstallationRecordQuery): Promise<
  {
    id: number;
  }[]
> {
  const result = await db.query.monthlyMeterInstallations.findMany({
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

  return result;
}

/**
 * Retrieves monthly installation summary by record ID
 *
 * @param id Record ID of the monthly installation summary
 * @returns Object with total installed and registered counts
 * @throws Will throw if record with given ID doesn't exist
 */
export async function getMonthlyInstallationSummaryById(
  id: number,
): Promise<InstallationSummary> {
  const result = await db.query.monthlyMeterInstallations.findFirst({
    columns: {
      totalInstalled: true,
      registeredCount: true,
    },
    where: eq(monthlyMeterInstallations.id, id),
  });

  if (!result) {
    throw new Error(`Monthly installation summary with ID ${id} not found`);
  }

  return result;
}

interface MonthlyInstallationReportParams {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  cutoffDate: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

/**
 * Retrieves the latest monthly meter installation statistics
 * for a specific substation and balance group before a cutoff date
 *
 * @param params - Query parameters for the report
 * @param params.balanceGroup - Balance group category (e.g., "Быт", "ЮР Sims")
 * @param params.cutoffDate - Exclusive upper bound date (YYYY-MM-DD format).
 *                            Only records with date < cutoffDate are considered.
 * @param params.substationId - Transformer substation identifier
 * @param params.month - Month of interest (MM format, 01-12)
 * @param params.year - Year of interest
 *
 * @returns Summary object containing:
 *          If no records found, returns {totalInstalled: 0, registeredCount: 0}
 */
export async function getMonthlyInstallationReport({
  balanceGroup,
  cutoffDate,
  substationId,
  month,
  year,
}: MonthlyInstallationReportParams): Promise<InstallationSummary> {
  const result = await db.query.monthlyMeterInstallations.findFirst({
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
