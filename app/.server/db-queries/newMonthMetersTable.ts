import { db } from "../db";
import { NewMonthMetersTable } from "../schema";
import { eq, and, desc, gt, gte, lt, lte } from "drizzle-orm";

export async function insertMonthMeters({
  quantity,
  added_to_system,
  type,
  date,
  transformerSubstationId,
  month,
  year,
}: MonthMetersValues) {
  await db.insert(NewMonthMetersTable).values({
    quantity,
    added_to_system,
    type,
    date,
    transformerSubstationId,
    month,
    year,
  });
}

export async function selectMonthQuantity({
  type,
  date,
  transformerSubstationId,
  month,
  year,
}: SelectMonthQuantity) {
  const monthQuantity = await db
    .select({
      quantity: NewMonthMetersTable.quantity,
      added_to_system: NewMonthMetersTable.added_to_system,
    })
    .from(NewMonthMetersTable)
    .where(
      and(
        eq(NewMonthMetersTable.type, type),
        eq(NewMonthMetersTable.date, date),
        eq(
          NewMonthMetersTable.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(NewMonthMetersTable.month, month),
        eq(NewMonthMetersTable.year, year),
      ),
    );

  return monthQuantity;
}

export async function selectLastMonthQuantity({
  type,
  transformerSubstationId,
  month,
  year,
}: LastMonthQuantity) {
  const monthQuantity = await db
    .select({
      quantity: NewMonthMetersTable.quantity,
      added_to_system: NewMonthMetersTable.added_to_system,
    })
    .from(NewMonthMetersTable)
    .where(
      and(
        eq(NewMonthMetersTable.type, type),
        eq(
          NewMonthMetersTable.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(NewMonthMetersTable.month, month),
        eq(NewMonthMetersTable.year, year),
      ),
    )
    .orderBy(desc(NewMonthMetersTable.date))
    .limit(1);

  return monthQuantity;
}

export async function updateMonthMeters({
  quantity,
  added_to_system,
  type,
  date,
  transformerSubstationId,
  month,
  year,
}: MonthMetersValues) {
  const updatedAt = new Date();

  await db
    .update(NewMonthMetersTable)
    .set({ quantity, added_to_system, updatedAt })
    .where(
      and(
        eq(NewMonthMetersTable.type, type),
        eq(NewMonthMetersTable.date, date),
        eq(
          NewMonthMetersTable.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(NewMonthMetersTable.month, month),
        eq(NewMonthMetersTable.year, year),
      ),
    );
}

export async function getLastMonthId({
  type,
  transformerSubstationId,
  month,
  year,
}: LastMonthQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({ id: NewMonthMetersTable.id })
    .from(NewMonthMetersTable)
    .where(
      and(
        eq(NewMonthMetersTable.type, type),
        eq(
          NewMonthMetersTable.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(NewMonthMetersTable.month, month),
        eq(NewMonthMetersTable.year, year),
      ),
    )
    .orderBy(desc(NewMonthMetersTable.date))
    .limit(1);

  return recordId[0]?.id;
}

export async function updateMonthOnId({
  id,
  quantity,
  added_to_system,
}: UpdateMonthOnIdType) {
  const updatedAt = new Date();

  await db
    .update(NewMonthMetersTable)
    .set({ quantity, added_to_system, updatedAt })
    .where(eq(NewMonthMetersTable.id, id));
}

export async function getMonthIds({
  type,
  date,
  transformerSubstationId,
  month,
  year,
}: SelectMonthQuantity) {
  const ids = await db
    .select({ id: NewMonthMetersTable.id })
    .from(NewMonthMetersTable)
    .where(
      and(
        gt(NewMonthMetersTable.date, date),
        eq(NewMonthMetersTable.type, type),
        eq(NewMonthMetersTable.month, month),
        eq(NewMonthMetersTable.year, year),
        eq(
          NewMonthMetersTable.transformerSubstationId,
          transformerSubstationId,
        ),
      ),
    );

  return ids;
}

export async function getMonthMetersOnID(id: number) {
  const record = await db
    .select({
      quantity: NewMonthMetersTable.quantity,
      added_to_system: NewMonthMetersTable.added_to_system,
    })
    .from(NewMonthMetersTable)
    .where(eq(NewMonthMetersTable.id, id));

  return record[0];
}

export async function getMonthMetersForInsert({
  type,
  date,
  transformerSubstationId,
  month,
  year,
}: SelectMonthQuantity) {
  const record = await db
    .select({
      quantity: NewMonthMetersTable.quantity,
      added_to_system: NewMonthMetersTable.added_to_system,
    })
    .from(NewMonthMetersTable)
    .where(
      and(
        eq(
          NewMonthMetersTable.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(NewMonthMetersTable.type, type),
        eq(NewMonthMetersTable.month, month),
        eq(NewMonthMetersTable.year, year),
        lt(NewMonthMetersTable.date, date),
      ),
    )
    .orderBy(desc(NewMonthMetersTable.date))
    .limit(1);

  return record;
}

export async function selectMonthMetersOnDate({
  type,
  date,
  transformerSubstationId,
  month,
  year,
}: SelectMonthQuantity) {
  const record = await db
    .select({
      quantity: NewMonthMetersTable.quantity,
      added_to_system: NewMonthMetersTable.added_to_system,
    })
    .from(NewMonthMetersTable)
    .where(
      and(
        eq(
          NewMonthMetersTable.transformerSubstationId,
          transformerSubstationId,
        ),
        lte(NewMonthMetersTable.date, date),
        eq(NewMonthMetersTable.type, type),
        eq(NewMonthMetersTable.month, month),
        eq(NewMonthMetersTable.year, year),
      ),
    )
    .orderBy(desc(NewMonthMetersTable.date))
    .limit(1);

  return record[0];
}

interface monthPeriod {
  type: BalanceType;
  firstDate: string;
  lastDate: string;
  transformerSubstationId: number;
}

export async function selectMonthPeriodMeters({
  type,
  firstDate,
  lastDate,
  transformerSubstationId,
}: monthPeriod) {
  const record = await db
    .select({
      quantity: NewMonthMetersTable.quantity,
      added_to_system: NewMonthMetersTable.added_to_system,
    })
    .from(NewMonthMetersTable)
    .where(
      and(
        eq(
          NewMonthMetersTable.transformerSubstationId,
          transformerSubstationId,
        ),
        lte(NewMonthMetersTable.date, lastDate),
        gte(NewMonthMetersTable.date, firstDate),
        eq(NewMonthMetersTable.type, type),
      ),
    )
    .orderBy(desc(NewMonthMetersTable.date))
    .limit(1);

  return record[0];
}
