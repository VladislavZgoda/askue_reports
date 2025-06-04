import { db } from "../db";
import { yearlyMeterInstallations } from "../schema";
import { eq, and, desc, gt, lt, lte } from "drizzle-orm";

export async function insertYearMeters({
  totalInstalled,
  registeredCount,
  balanceGroup,
  date,
  transformerSubstationId,
  year,
}: YearlyMetersQueryParams) {
  await db.insert(yearlyMeterInstallations).values({
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    transformerSubstationId,
    year,
  });
}

export async function selectYearQuantity({
  balanceGroup,
  date,
  transformerSubstationId,
  year,
}: YearlyMeterSelectionCriteria) {
  const yearQuantity = await db
    .select({
      totalInstalled: yearlyMeterInstallations.totalInstalled,
      registeredCount: yearlyMeterInstallations.registeredCount,
    })
    .from(yearlyMeterInstallations)
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(yearlyMeterInstallations.date, date),
        eq(
          yearlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(yearlyMeterInstallations.year, year),
      ),
    );

  return yearQuantity;
}

export async function selectLastYearQuantity({
  balanceGroup,
  transformerSubstationId,
  year,
}: LastYearQuantity) {
  const yearQuantity = await db
    .select({
      totalInstalled: yearlyMeterInstallations.totalInstalled,
      registeredCount: yearlyMeterInstallations.registeredCount,
    })
    .from(yearlyMeterInstallations)
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(
          yearlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(yearlyMeterInstallations.year, year),
      ),
    )
    .orderBy(desc(yearlyMeterInstallations.date))
    .limit(1);

  return yearQuantity;
}

export async function updateYearMeters({
  totalInstalled,
  registeredCount,
  balanceGroup,
  date,
  transformerSubstationId,
  year,
}: YearlyMetersQueryParams) {
  const updatedAt = new Date();

  await db
    .update(yearlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(yearlyMeterInstallations.date, date),
        eq(
          yearlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(yearlyMeterInstallations.year, year),
      ),
    );
}

export async function getLastYearId({
  balanceGroup,
  transformerSubstationId,
  year,
}: LastYearQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({ id: yearlyMeterInstallations.id })
    .from(yearlyMeterInstallations)
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(
          yearlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(yearlyMeterInstallations.year, year),
      ),
    )
    .orderBy(desc(yearlyMeterInstallations.date))
    .limit(1);

  return recordId[0]?.id;
}

interface UpdateYearlyMetersOnId {
  id: number;
  totalInstalled: number;
  registeredCount: number;
}

export async function updateYearOnId({
  id,
  totalInstalled,
  registeredCount,
}: UpdateYearlyMetersOnId) {
  const updatedAt = new Date();

  await db
    .update(yearlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(eq(yearlyMeterInstallations.id, id));
}

export async function getYearIds({
  balanceGroup,
  date,
  transformerSubstationId,
  year,
}: YearlyMeterSelectionCriteria) {
  const ids = await db
    .select({ id: yearlyMeterInstallations.id })
    .from(yearlyMeterInstallations)
    .where(
      and(
        gt(yearlyMeterInstallations.date, date),
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(yearlyMeterInstallations.year, year),
        eq(
          yearlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
      ),
    );

  return ids;
}

export async function getYearMetersOnID(id: number) {
  const record = await db
    .select({
      totalInstalled: yearlyMeterInstallations.totalInstalled,
      registeredCount: yearlyMeterInstallations.registeredCount,
    })
    .from(yearlyMeterInstallations)
    .where(eq(yearlyMeterInstallations.id, id));

  return record[0];
}

export async function getYearMetersForInsert({
  balanceGroup,
  date,
  transformerSubstationId,
  year,
}: YearlyMeterSelectionCriteria) {
  const record = await db
    .select({
      totalInstalled: yearlyMeterInstallations.totalInstalled,
      registeredCount: yearlyMeterInstallations.registeredCount,
    })
    .from(yearlyMeterInstallations)
    .where(
      and(
        eq(
          yearlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(yearlyMeterInstallations.year, year),
        lt(yearlyMeterInstallations.date, date),
      ),
    )
    .orderBy(desc(yearlyMeterInstallations.date))
    .limit(1);

  return record;
}

export async function getYearlyMeterInstallationSummary({
  balanceGroup,
  targetDate,
  dateComparison,
  transformerSubstationId,
  year,
}: YearlyMeterCountQueryParams) {
  const result = await db.query.yearlyMeterInstallations.findFirst({
    columns: {
      totalInstalled: true,
      registeredCount: true,
    },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.year, year),
      eq(
        yearlyMeterInstallations.transformerSubstationId,
        transformerSubstationId,
      ),
      dateComparison === "before"
        ? lt(yearlyMeterInstallations.date, targetDate)
        : lte(yearlyMeterInstallations.date, targetDate),
    ),
    orderBy: [desc(yearlyMeterInstallations.date)],
  });

  return result ?? { totalInstalled: 0, registeredCount: 0 };
}
