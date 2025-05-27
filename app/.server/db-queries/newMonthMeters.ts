import { db } from "../db";
import { newMonthMeters } from "../schema";
import { eq, and, desc, gt, gte, lt, lte } from "drizzle-orm";

export async function insertMonthMeters({
  quantity,
  addedToSystem,
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: MonthMetersValues) {
  await db.insert(newMonthMeters).values({
    quantity,
    addedToSystem,
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
}: SelectMonthQuantity) {
  const monthQuantity = await db
    .select({
      quantity: newMonthMeters.quantity,
      addedToSystem: newMonthMeters.addedToSystem,
    })
    .from(newMonthMeters)
    .where(
      and(
        eq(newMonthMeters.balanceGroup, balanceGroup),
        eq(newMonthMeters.date, date),
        eq(newMonthMeters.transformerSubstationId, transformerSubstationId),
        eq(newMonthMeters.month, month),
        eq(newMonthMeters.year, year),
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
      quantity: newMonthMeters.quantity,
      addedToSystem: newMonthMeters.addedToSystem,
    })
    .from(newMonthMeters)
    .where(
      and(
        eq(newMonthMeters.balanceGroup, balanceGroup),
        eq(newMonthMeters.transformerSubstationId, transformerSubstationId),
        eq(newMonthMeters.month, month),
        eq(newMonthMeters.year, year),
      ),
    )
    .orderBy(desc(newMonthMeters.date))
    .limit(1);

  return monthQuantity;
}

export async function updateMonthMeters({
  quantity,
  addedToSystem,
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: MonthMetersValues) {
  const updatedAt = new Date();

  await db
    .update(newMonthMeters)
    .set({ quantity, addedToSystem, updatedAt })
    .where(
      and(
        eq(newMonthMeters.balanceGroup, balanceGroup),
        eq(newMonthMeters.date, date),
        eq(newMonthMeters.transformerSubstationId, transformerSubstationId),
        eq(newMonthMeters.month, month),
        eq(newMonthMeters.year, year),
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
    .select({ id: newMonthMeters.id })
    .from(newMonthMeters)
    .where(
      and(
        eq(newMonthMeters.balanceGroup, balanceGroup),
        eq(newMonthMeters.transformerSubstationId, transformerSubstationId),
        eq(newMonthMeters.month, month),
        eq(newMonthMeters.year, year),
      ),
    )
    .orderBy(desc(newMonthMeters.date))
    .limit(1);

  return recordId[0]?.id;
}

export async function updateMonthOnId({
  id,
  quantity,
  addedToSystem,
}: UpdateMonthOnIdType) {
  const updatedAt = new Date();

  await db
    .update(newMonthMeters)
    .set({ quantity, addedToSystem, updatedAt })
    .where(eq(newMonthMeters.id, id));
}

export async function getMonthIds({
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: SelectMonthQuantity) {
  const ids = await db
    .select({ id: newMonthMeters.id })
    .from(newMonthMeters)
    .where(
      and(
        gt(newMonthMeters.date, date),
        eq(newMonthMeters.balanceGroup, balanceGroup),
        eq(newMonthMeters.month, month),
        eq(newMonthMeters.year, year),
        eq(newMonthMeters.transformerSubstationId, transformerSubstationId),
      ),
    );

  return ids;
}

export async function getMonthMetersOnID(id: number) {
  const record = await db
    .select({
      quantity: newMonthMeters.quantity,
      addedToSystem: newMonthMeters.addedToSystem,
    })
    .from(newMonthMeters)
    .where(eq(newMonthMeters.id, id));

  return record[0];
}

export async function getMonthMetersForInsert({
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: SelectMonthQuantity) {
  const record = await db
    .select({
      quantity: newMonthMeters.quantity,
      addedToSystem: newMonthMeters.addedToSystem,
    })
    .from(newMonthMeters)
    .where(
      and(
        eq(newMonthMeters.transformerSubstationId, transformerSubstationId),
        eq(newMonthMeters.balanceGroup, balanceGroup),
        eq(newMonthMeters.month, month),
        eq(newMonthMeters.year, year),
        lt(newMonthMeters.date, date),
      ),
    )
    .orderBy(desc(newMonthMeters.date))
    .limit(1);

  return record;
}

export async function selectMonthMetersOnDate({
  balanceGroup,
  date,
  transformerSubstationId,
  month,
  year,
}: SelectMonthQuantity) {
  const record = await db
    .select({
      quantity: newMonthMeters.quantity,
      addedToSystem: newMonthMeters.addedToSystem,
    })
    .from(newMonthMeters)
    .where(
      and(
        eq(newMonthMeters.transformerSubstationId, transformerSubstationId),
        lte(newMonthMeters.date, date),
        eq(newMonthMeters.balanceGroup, balanceGroup),
        eq(newMonthMeters.month, month),
        eq(newMonthMeters.year, year),
      ),
    )
    .orderBy(desc(newMonthMeters.date))
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
      quantity: newMonthMeters.quantity,
      addedToSystem: newMonthMeters.addedToSystem,
    })
    .from(newMonthMeters)
    .where(
      and(
        eq(newMonthMeters.transformerSubstationId, transformerSubstationId),
        lte(newMonthMeters.date, lastDate),
        gte(newMonthMeters.date, firstDate),
        eq(newMonthMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(newMonthMeters.date))
    .limit(1);

  return record[0];
}
