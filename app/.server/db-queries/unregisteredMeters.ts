import { db } from "../db";
import { unregisteredMeters } from "../schema";
import { eq, and, desc, lte, lt } from "drizzle-orm";

type UnregisteredMeters = typeof unregisteredMeters.$inferSelect;

interface UnregisteredMeterRecordInput {
  unregisteredMeterCount: UnregisteredMeters["unregisteredMeterCount"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  date: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

/**
 * Creates a new unregistered meter record
 *
 * @param params Input data for the new record
 * @param params.unregisteredMeterCount Count of unregistered meters
 * @param params.balanceGroup Balance group category
 * @param params.date Record date (YYYY-MM-DD format)
 * @param params.substationId Transformer substation ID
 */
export async function createUnregisteredMeterRecord({
  unregisteredMeterCount,
  balanceGroup,
  date,
  substationId,
}: UnregisteredMeterRecordInput) {
  await db.insert(unregisteredMeters).values({
    unregisteredMeterCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}

interface UnregisteredMeterQuery {
  date: UnregisteredMeters["date"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  substationId: UnregisteredMeters["transformerSubstationId"];
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

/**
 * Fetches the latest unregistered meter ID by date for a given balance group and substation.
 * @returns ID of the most recent record, or 'undefined' if none exists.
 */
export async function getLatestUnregisteredMeterId(
  balanceGroup: BalanceGroup,
  substationId: UnregisteredMeters["transformerSubstationId"],
): Promise<number | undefined> {
  const result = await db.query.unregisteredMeters.findFirst({
    columns: { id: true },
    where: and(
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
    ),
    orderBy: [desc(unregisteredMeters.date)],
  });

  return result?.id;
}

interface UnregisteredMeterUpdateInput {
  id: UnregisteredMeters["id"];
  unregisteredMeterCount: UnregisteredMeters["unregisteredMeterCount"];
}

/**
 * Updates an unregistered meter record by its database record ID
 *
 * @param id Record ID to update
 * @param unregisteredMeterCount New count of unregistered meters
 *
 * @throws Will throw if no record with the given ID exists
 *
 * @example
 * await updateUnregisteredMeterRecordById({
 *   id: 456,
 *   unregisteredMeterCount: 25
 * });
 */
export async function updateUnregisteredMeterRecordById({
  id,
  unregisteredMeterCount,
}: UnregisteredMeterUpdateInput) {
  const updatedAt = new Date();

  const [updatedRecord] = await db
    .update(unregisteredMeters)
    .set({ unregisteredMeterCount, updatedAt })
    .where(eq(unregisteredMeters.id, id))
    .returning();

  if (!updatedRecord) {
    throw new Error(`Unregistered meter record with ID ${id} not found`);
  }
}

export async function getUnregisteredMeterCountAtDate({
  balanceGroup,
  targetDate,
  dateComparison,
  substationId,
}: MeterCountQueryParams) {
  const result = await db.query.unregisteredMeters.findFirst({
    columns: {
      unregisteredMeterCount: true,
    },
    where: and(
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
      dateComparison === "before"
        ? lt(unregisteredMeters.date, targetDate)
        : lte(unregisteredMeters.date, targetDate),
    ),
    orderBy: [desc(unregisteredMeters.date)],
  });

  return result ? result.unregisteredMeterCount : 0;
}
