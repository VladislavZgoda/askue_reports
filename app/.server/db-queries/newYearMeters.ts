import { db } from "../db";
import { newYearMeters } from "../schema";
import { eq, and, desc, gt, lt, lte } from "drizzle-orm";

export async function insertYearMeters({
  quantity,
  addedToSystem,
  balanceGroup,
  date,
  transformerSubstationId,
  year,
}: YearMetersValues) {
  await db.insert(newYearMeters).values({
    quantity,
    addedToSystem,
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
      quantity: newYearMeters.quantity,
      addedToSystem: newYearMeters.addedToSystem,
    })
    .from(newYearMeters)
    .where(
      and(
        eq(newYearMeters.balanceGroup, balanceGroup),
        eq(newYearMeters.date, date),
        eq(newYearMeters.transformerSubstationId, transformerSubstationId),
        eq(newYearMeters.year, year),
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
      quantity: newYearMeters.quantity,
      addedToSystem: newYearMeters.addedToSystem,
    })
    .from(newYearMeters)
    .where(
      and(
        eq(newYearMeters.balanceGroup, balanceGroup),
        eq(newYearMeters.transformerSubstationId, transformerSubstationId),
        eq(newYearMeters.year, year),
      ),
    )
    .orderBy(desc(newYearMeters.date))
    .limit(1);

  return yearQuantity;
}

export async function updateYearMeters({
  quantity,
  addedToSystem,
  balanceGroup,
  date,
  transformerSubstationId,
  year,
}: YearMetersValues) {
  const updatedAt = new Date();

  await db
    .update(newYearMeters)
    .set({ quantity, addedToSystem, updatedAt })
    .where(
      and(
        eq(newYearMeters.balanceGroup, balanceGroup),
        eq(newYearMeters.date, date),
        eq(newYearMeters.transformerSubstationId, transformerSubstationId),
        eq(newYearMeters.year, year),
      ),
    );
}

export async function getLastYearId({
  balanceGroup,
  transformerSubstationId,
  year,
}: LastYearQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({ id: newYearMeters.id })
    .from(newYearMeters)
    .where(
      and(
        eq(newYearMeters.balanceGroup, balanceGroup),
        eq(newYearMeters.transformerSubstationId, transformerSubstationId),
        eq(newYearMeters.year, year),
      ),
    )
    .orderBy(desc(newYearMeters.date))
    .limit(1);

  return recordId[0]?.id;
}

export async function updateYearOnId({
  id,
  quantity,
  addedToSystem,
}: UpdateYearOnIdType) {
  const updatedAt = new Date();

  await db
    .update(newYearMeters)
    .set({ quantity, addedToSystem, updatedAt })
    .where(eq(newYearMeters.id, id));
}

export async function getYearIds({
  balanceGroup,
  date,
  transformerSubstationId,
  year,
}: YearlyMeterSelectionCriteria) {
  const ids = await db
    .select({ id: newYearMeters.id })
    .from(newYearMeters)
    .where(
      and(
        gt(newYearMeters.date, date),
        eq(newYearMeters.balanceGroup, balanceGroup),
        eq(newYearMeters.year, year),
        eq(newYearMeters.transformerSubstationId, transformerSubstationId),
      ),
    );

  return ids;
}

export async function getYearMetersOnID(id: number) {
  const record = await db
    .select({
      quantity: newYearMeters.quantity,
      addedToSystem: newYearMeters.addedToSystem,
    })
    .from(newYearMeters)
    .where(eq(newYearMeters.id, id));

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
      quantity: newYearMeters.quantity,
      addedToSystem: newYearMeters.addedToSystem,
    })
    .from(newYearMeters)
    .where(
      and(
        eq(newYearMeters.transformerSubstationId, transformerSubstationId),
        eq(newYearMeters.balanceGroup, balanceGroup),
        eq(newYearMeters.year, year),
        lt(newYearMeters.date, date),
      ),
    )
    .orderBy(desc(newYearMeters.date))
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
  const result = await db.query.newYearMeters.findFirst({
    columns: {
      quantity: true,
      addedToSystem: true,
    },
    where: and(
      eq(newYearMeters.balanceGroup, balanceGroup),
      eq(newYearMeters.year, year),
      eq(newYearMeters.transformerSubstationId, transformerSubstationId),
      dateComparison === "before"
        ? lt(newYearMeters.date, targetDate)
        : lte(newYearMeters.date, targetDate),
    ),
    orderBy: [desc(newYearMeters.date)],
  });

  return result;
}
