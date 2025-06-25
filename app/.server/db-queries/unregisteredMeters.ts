import { db } from "../db";
import { unregisteredMeters } from "../schema";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

interface QueryValues {
  unregisteredMeterCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  transformerSubstationId: number;
}

export async function insertNotInSystem({
  unregisteredMeterCount,
  balanceGroup,
  date,
  transformerSubstationId,
}: QueryValues) {
  await db.insert(unregisteredMeters).values({
    unregisteredMeterCount,
    balanceGroup,
    date,
    transformerSubstationId,
  });
}

export async function updateNotInSystem({
  unregisteredMeterCount,
  balanceGroup,
  date,
  transformerSubstationId,
}: QueryValues) {
  const updatedAt = new Date();

  await db
    .update(unregisteredMeters)
    .set({ unregisteredMeterCount, updatedAt })
    .where(
      and(
        eq(unregisteredMeters.transformerSubstationId, transformerSubstationId),
        eq(unregisteredMeters.date, date),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
      ),
    );
}

interface UnregisteredMeterQuery {
  date: string;
  balanceGroup: BalanceGroup;
  substationId: number;
}

/**
 * Retrieves unregistered meter count value for specific date,
 * balance group and substation
 *
 * @param date Date of record (YYYY-MM-DD format)
 * @param balanceGroup Balance group filter
 * @param substationId Transformer substation ID
 * @returns Number of unregistered meters,
 *          or undefined if no record exists
 */
export async function getUnregisteredMeterCount({
  date,
  balanceGroup,
  substationId,
}: UnregisteredMeterQuery) {
  const result = await db.query.unregisteredMeters.findFirst({
    columns: {
      unregisteredMeterCount: true,
    },
    where: and(
      eq(unregisteredMeters.date, date),
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
    ),
  });

  return result?.unregisteredMeterCount;
}

export async function selectLastNotInSystem({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const record = await db
    .select({
      unregisteredMeterCount: unregisteredMeters.unregisteredMeterCount,
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

  return record[0]?.unregisteredMeterCount;
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
  unregisteredMeterCount: number;
}

export async function updateNotInSystemOnId({
  id,
  unregisteredMeterCount,
}: UpdateOnId) {
  const updatedAt = new Date();

  await db
    .update(unregisteredMeters)
    .set({ unregisteredMeterCount, updatedAt })
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
      unregisteredMeterCount: true,
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

  return result ? result.unregisteredMeterCount : 0;
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

export async function getNotInSystemOnID(id: number) {
  const record = await db
    .select({
      unregisteredMeterCount: unregisteredMeters.unregisteredMeterCount,
    })
    .from(unregisteredMeters)
    .where(eq(unregisteredMeters.id, id));

  return record[0].unregisteredMeterCount;
}
