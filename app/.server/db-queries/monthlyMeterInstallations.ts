import { db } from "../db";
import { monthlyMeterInstallations } from "../schema";
import { eq, and, desc, gt, gte, lt, lte } from "drizzle-orm";

type TableColumns = typeof monthlyMeterInstallations.$inferSelect;

type AddMonthlyMeterInstallations = Omit<
  TableColumns,
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

export async function selectMonthQuantity({
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: MonthlyMeterSelectionCriteria) {
  const monthQuantity = await db
    .select({
      totalInstalled: monthlyMeterInstallations.totalInstalled,
      registeredCount: monthlyMeterInstallations.registeredCount,
    })
    .from(monthlyMeterInstallations)
    .where(
      and(
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
        eq(monthlyMeterInstallations.date, date),
        eq(
          monthlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(monthlyMeterInstallations.month, month),
        eq(monthlyMeterInstallations.year, year),
      ),
    );

  return monthQuantity;
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

type UpdateMonthlyMeterInstallations = AddMonthlyMeterInstallations;

export async function updateMonthMeters({
  totalInstalled,
  registeredCount,
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: UpdateMonthlyMeterInstallations) {
  const updatedAt = new Date();

  await db
    .update(monthlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(
      and(
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
        eq(monthlyMeterInstallations.date, date),
        eq(
          monthlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(monthlyMeterInstallations.month, month),
        eq(monthlyMeterInstallations.year, year),
      ),
    );
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
  TableColumns,
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

export async function getMonthlyMeterInstallationSummary({
  balanceGroup,
  targetDate,
  dateComparison,
  transformerSubstationId,
  month,
  year,
}: MonthlyMeterSummaryParams) {
  const result = await db.query.monthlyMeterInstallations.findFirst({
    columns: {
      totalInstalled: true,
      registeredCount: true,
    },
    where: and(
      eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
      eq(monthlyMeterInstallations.year, year),
      eq(monthlyMeterInstallations.month, month),
      eq(
        monthlyMeterInstallations.transformerSubstationId,
        transformerSubstationId,
      ),
      dateComparison === "before"
        ? lt(monthlyMeterInstallations.date, targetDate)
        : lte(monthlyMeterInstallations.date, targetDate),
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
