import { db } from "../db";
import { monthlyMeterInstallations } from "../schema";
import { eq, and, desc, gt, gte, lt, lte } from "drizzle-orm";

type MonthlyMeterInstallations = typeof monthlyMeterInstallations.$inferSelect;

type AddMonthlyMeterInstallations = Omit<
  MonthlyMeterInstallations,
  "id" | "createdAt" | "updatedAt"
>;

export async function insertMonthMeters({
  totalInstalled,
  registeredCount,
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: AddMonthlyMeterInstallations) {
  await db.insert(monthlyMeterInstallations).values({
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    transformerSubstationId,
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
 * @returns The updated monthly installation record
 * @throws Will throw if registeredCount more than totalInstalled
 * @throws Will throw if no matching record is found
 */
export async function updateMonthlyInstallationRecord(
  params: MonthlyInstallationUpdateParams,
) {
  validateUpdateParams(params);

  const updatedAt = new Date();

  const updatedRecords = await db
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

  if (updatedRecords.length === 0) {
    throw new Error("No monthly installation record found to update");
  }
}

function validateUpdateParams(params: MonthlyInstallationUpdateParams) {
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

type UpdateMonthlyInstallationsAtId = Pick<
  MonthlyMeterInstallations,
  "id" | "totalInstalled" | "registeredCount"
>;

export async function updateMonthOnId({
  id,
  totalInstalled,
  registeredCount,
}: UpdateMonthlyInstallationsAtId) {
  const updatedAt = new Date();

  await db
    .update(monthlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(eq(monthlyMeterInstallations.id, id));
}

export async function getMonthIds({
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: MonthlyMeterSelectionCriteria) {
  const ids = await db
    .select({ id: monthlyMeterInstallations.id })
    .from(monthlyMeterInstallations)
    .where(
      and(
        gt(monthlyMeterInstallations.date, date),
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
        eq(monthlyMeterInstallations.month, month),
        eq(monthlyMeterInstallations.year, year),
        eq(
          monthlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
      ),
    );

  return ids;
}

export async function getMonthMetersOnID(id: number) {
  const record = await db
    .select({
      totalInstalled: monthlyMeterInstallations.totalInstalled,
      registeredCount: monthlyMeterInstallations.registeredCount,
    })
    .from(monthlyMeterInstallations)
    .where(eq(monthlyMeterInstallations.id, id));

  return record[0];
}

interface MonthlyInstallationReportParams {
  balanceGroup: MonthlyMeterInstallations["balanceGroup"];
  cutoffDate: MonthlyMeterInstallations["date"];
  substationId: MonthlyMeterInstallations["transformerSubstationId"];
  month: MonthlyMeterInstallations["month"];
  year: MonthlyMeterInstallations["year"];
}

/**
 * Retrieves monthly meter installation statistics
 * for a specific substation and balance group
 *
 * @param balanceGroup - Balance group filter
 * @param cutoffDate - Exclusive upper bound date for installation records (records before this date)
 * @param substationId Transformer substation ID
 * @param month Month of the installation record
 * @param year Year of the installation record
 *
 * @returns Summary object with total installed and registered counts
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
