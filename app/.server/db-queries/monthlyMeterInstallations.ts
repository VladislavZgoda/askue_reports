import { db } from "../db";
import { monthlyMeterInstallations } from "../schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

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
