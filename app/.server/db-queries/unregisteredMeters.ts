import { db } from "../db";
import { unregisteredMeters } from "../schema";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

interface QueryValues {
  unregisteredCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  transformerSubstationId: number;
}

export async function insertNotInSystem({
  unregisteredCount,
  balanceGroup,
  date,
  transformerSubstationId,
}: QueryValues) {
  await db.insert(unregisteredMeters).values({
    unregisteredCount,
    balanceGroup,
    date,
    transformerSubstationId,
  });
}

export async function updateNotInSystem({
  unregisteredCount,
  balanceGroup,
  date,
  transformerSubstationId,
}: QueryValues) {
  const updatedAt = new Date();

  await db
    .update(unregisteredMeters)
    .set({ unregisteredCount, updatedAt })
    .where(
      and(
        eq(unregisteredMeters.transformerSubstationId, transformerSubstationId),
        eq(unregisteredMeters.date, date),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
      ),
    );
}

export async function checkNotInSystem({
  balanceGroup,
  date,
  transformerSubstationId,
}: MeterSelectionCriteria): Promise<number | undefined> {
  const record = await db
    .select({
      unregisteredCount: unregisteredMeters.unregisteredCount,
    })
    .from(unregisteredMeters)
    .where(
      and(
        eq(unregisteredMeters.transformerSubstationId, transformerSubstationId),
        eq(unregisteredMeters.date, date),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
      ),
    );

  return record[0]?.unregisteredCount;
}

export async function selectLastNotInSystem({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const record = await db
    .select({
      unregisteredCount: unregisteredMeters.unregisteredCount,
    })
    .from(unregisteredMeters)
    .where(
      and(
        eq(unregisteredMeters.transformerSubstationId, transformerSubstationId),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(unregisteredMeters.date))
    .limit(1);

  return record[0]?.unregisteredCount;
}

export async function getLastNotInSystemId({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({
      id: unregisteredMeters.id,
    })
    .from(unregisteredMeters)
    .where(
      and(
        eq(unregisteredMeters.transformerSubstationId, transformerSubstationId),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(unregisteredMeters.date))
    .limit(1);

  return recordId[0]?.id;
}

export interface UpdateOnId {
  id: number;
  unregisteredCount: number;
}

export async function updateNotInSystemOnId({
  id,
  unregisteredCount,
}: UpdateOnId) {
  const updatedAt = new Date();

  await db
    .update(unregisteredMeters)
    .set({ unregisteredCount, updatedAt })
    .where(eq(unregisteredMeters.id, id));
}

export async function getUnregisteredMeterCountAtDate({
  balanceGroup,
  targetDate,
  dateComparison,
  transformerSubstationId,
}: MeterCountQueryParams) {
  const result = await db.query.unregisteredMeters.findFirst({
    columns: {
      unregisteredCount: true,
    },
    where: and(
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, transformerSubstationId),
      dateComparison === "before"
        ? lt(unregisteredMeters.date, targetDate)
        : lte(unregisteredMeters.date, targetDate),
    ),
    orderBy: [desc(unregisteredMeters.date)],
  });

  return result ? result.unregisteredCount : 0;
}

export async function getNotInSystemIds({
  balanceGroup,
  date,
  transformerSubstationId,
}: MeterSelectionCriteria) {
  const ids = await db
    .select({ id: unregisteredMeters.id })
    .from(unregisteredMeters)
    .where(
      and(
        gt(unregisteredMeters.date, date),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
        eq(unregisteredMeters.transformerSubstationId, transformerSubstationId),
      ),
    );

  return ids;
}

export async function getNotInSystemForInsert({
  transformerSubstationId,
  date,
  balanceGroup,
}: QuantityForInsert) {
  const record = await db
    .select({
      unregisteredCount: unregisteredMeters.unregisteredCount,
    })
    .from(unregisteredMeters)
    .where(
      and(
        eq(unregisteredMeters.transformerSubstationId, transformerSubstationId),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
        lt(unregisteredMeters.date, date),
      ),
    )
    .orderBy(desc(unregisteredMeters.date))
    .limit(1);

  return record[0]?.unregisteredCount ?? 0;
}

export async function getNotInSystemOnID(id: number) {
  const record = await db
    .select({ unregisteredCount: unregisteredMeters.unregisteredCount })
    .from(unregisteredMeters)
    .where(eq(unregisteredMeters.id, id));

  return record[0].unregisteredCount;
}
