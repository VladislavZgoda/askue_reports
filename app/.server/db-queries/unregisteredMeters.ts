import { db } from "../db";
import { unregisteredMeters } from "../schema";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

type UnregisteredMeters = typeof unregisteredMeters.$inferSelect;

interface UnregisteredMeterParams {
  unregisteredMeterCount: UnregisteredMeters["unregisteredMeterCount"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  date: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
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

  const [updatedRecord] = await db
    .update(unregisteredMeters)
    .set({ unregisteredMeterCount, updatedAt })
    .where(
      and(
        eq(unregisteredMeters.transformerSubstationId, substationId),
        eq(unregisteredMeters.date, date),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
      ),
    )
    .returning();

  if (!updatedRecord) {
    throw new Error("No matching unregistered meter record found to update");
  }
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
  balanceGroup: UnregisteredMeters["balanceGroup"];
  startDate: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
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

/**
 * Retrieves the unregistered meter count value by its database record ID
 *
 * @param id Record ID of the unregistered meter entry
 * @returns Number of unregistered meters
 * @throws Will throw if no record with the given ID exists
 *
 * @example
 * const count = await getUnregisteredMeterCountByRecordId(456);
 * // Returns: 15
 */
export async function getUnregisteredMeterCountByRecordId(
  id: number,
): Promise<number> {
  const result = await db.query.unregisteredMeters.findFirst({
    columns: {
      unregisteredMeterCount: true,
    },
    where: eq(unregisteredMeters.id, id),
  });

  if (!result) {
    throw new Error(`Unregistered meter record with ID ${id} not found`);
  }

  return result.unregisteredMeterCount;
}
