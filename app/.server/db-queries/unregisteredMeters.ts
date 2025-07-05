import { db } from "../db";
import { unregisteredMeters } from "../schema";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

interface UnregisteredMeterParams {
  unregisteredMeterCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  substationId: number;
}

export async function insertUnregisteredMeters({
  unregisteredMeterCount,
  balanceGroup,
  date,
  substationId,
}: UnregisteredMeterParams) {
  await db.insert(unregisteredMeters).values({
    unregisteredMeterCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}

export async function updateUnregisteredMeters({
  unregisteredMeterCount,
  balanceGroup,
  date,
  substationId,
}: UnregisteredMeterParams) {
  const updatedAt = new Date();

  await db
    .update(unregisteredMeters)
    .set({ unregisteredMeterCount, updatedAt })
    .where(
      and(
        eq(unregisteredMeters.transformerSubstationId, substationId),
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

interface UnregisteredMeterQueryParams {
  balanceGroup: BalanceGroup;
  startDate: string;
  substationId: number;
}

/**
 * Retrieves IDs of unregistered meter records created after a specific date
 *
 * @param params Query parameters
 * @param params.balanceGroup Balance group category
 * @param params.startDate Exclusive lower bound date (YYYY-MM-DD format)
 * @param params.substationId Transformer substation identifier
 *
 * @returns Array of record IDs (numbers) for matching unregistered meter records
 */
export async function getUnregisteredMeterRecordIdsAfterDate({
  balanceGroup,
  startDate,
  substationId,
}: UnregisteredMeterQueryParams): Promise<number[]> {
  const result = await db.query.unregisteredMeters.findMany({
    columns: {
      id: true,
    },
    where: and(
      gt(unregisteredMeters.date, startDate),
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
    ),
  });

  const transformedResult = result.map((r) => r.id);

  return transformedResult;
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
