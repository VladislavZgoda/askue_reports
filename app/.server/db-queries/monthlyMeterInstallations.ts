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

export async function getMonthMetersForInsert({
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: MonthlyMeterSelectionCriteria) {
  const record = await db
    .select({
      totalInstalled: monthlyMeterInstallations.totalInstalled,
      registeredCount: monthlyMeterInstallations.registeredCount,
    })
    .from(monthlyMeterInstallations)
    .where(
      and(
        eq(
          monthlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
        eq(monthlyMeterInstallations.month, month),
        eq(monthlyMeterInstallations.year, year),
        lt(monthlyMeterInstallations.date, date),
      ),
    )
    .orderBy(desc(monthlyMeterInstallations.date))
    .limit(1);

  return record;
}

export async function selectMonthMetersOnDate({
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: MonthlyMeterSelectionCriteria) {
  const record = await db
    .select({
      totalInstalled: monthlyMeterInstallations.totalInstalled,
      registeredCount: monthlyMeterInstallations.registeredCount,
    })
    .from(monthlyMeterInstallations)
    .where(
      and(
        eq(
          monthlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        lte(monthlyMeterInstallations.date, date),
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
        eq(monthlyMeterInstallations.month, month),
        eq(monthlyMeterInstallations.year, year),
      ),
    )
    .orderBy(desc(monthlyMeterInstallations.date))
    .limit(1);

  return record[0];
}

interface monthPeriod {
  balanceGroup: BalanceGroup;
  firstDate: string;
  lastDate: string;
  transformerSubstationId: number;
}

export async function selectMonthPeriodMeters({
  balanceGroup,
  firstDate,
  lastDate,
  transformerSubstationId,
}: monthPeriod) {
  const record = await db
    .select({
      totalInstalled: monthlyMeterInstallations.totalInstalled,
      registeredCount: monthlyMeterInstallations.registeredCount,
    })
    .from(monthlyMeterInstallations)
    .where(
      and(
        eq(
          monthlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        lte(monthlyMeterInstallations.date, lastDate),
        gte(monthlyMeterInstallations.date, firstDate),
        eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(monthlyMeterInstallations.date))
    .limit(1);

  return record[0];
}
