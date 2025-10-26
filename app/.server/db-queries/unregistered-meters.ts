import { unregisteredMeters } from "../schema";
import { eq, and, desc, lt, gt, sql, inArray } from "drizzle-orm";

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
 * @example
 *   // Inside a transaction
 *   await createUnregisteredMeterRecord(tx, {
 *     unregisteredMeterCount: 7,
 *     balanceGroup: "ЮР Sims",
 *     date: "2025-08-14",
 *     substationId: 12,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Input data for the new record
 * @param params.unregisteredMeterCount - Count of unregistered meters
 * @param params.balanceGroup - Balance group category (e.g., "Быт", "ЮР Sims")
 * @param params.date - Record date (YYYY-MM-DD format)
 * @param params.substationId - Transformer substation ID
 */
export async function createUnregisteredMeterRecord(
  executor: Executor,
  {
    unregisteredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: UnregisteredMeterRecordInput,
): Promise<void> {
  await executor.insert(unregisteredMeters).values({
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
 * Retrieves unregistered meter count value for specific date, balance group and
 * substation
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Query parameters object
 * @param params.date - Date of record (YYYY-MM-DD format)
 * @param params.balanceGroup - Balance group to filter by (e.g., "Быт", "ЮР
 *   Sims")
 * @param params.substationId - Transformer substation ID
 * @returns Number of unregistered meters, or undefined if no record exists
 */
export async function getUnregisteredMeterCount(
  executor: Executor,
  { date, balanceGroup, substationId }: UnregisteredMeterQuery,
): Promise<number | undefined> {
  const result = await executor.query.unregisteredMeters.findFirst({
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
 * Fetches the latest unregistered meter ID by date for a given balance group
 * and substation.
 *
 * @param executor - Database client for query execution (supports transactions)
 * @returns ID of the most recent record, or 'undefined' if none exists.
 */
export async function getLatestUnregisteredMeterId(
  executor: Executor,
  balanceGroup: BalanceGroup,
  substationId: UnregisteredMeters["transformerSubstationId"],
): Promise<number | undefined> {
  const result = await executor.query.unregisteredMeters.findFirst({
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
 * @example
 *   await updateUnregisteredMeterRecordById(tx, {
 *     id: 456,
 *     unregisteredMeterCount: 25,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.id - Record ID to update
 * @param params.unregisteredMeterCount - New count of unregistered meters
 * @throws Will throw if no record with the given ID exists
 */
export async function updateUnregisteredMeterRecordById(
  executor: Executor,
  { id, unregisteredMeterCount }: UnregisteredMeterUpdateInput,
): Promise<void> {
  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(unregisteredMeters)
    .set({ unregisteredMeterCount, updatedAt })
    .where(eq(unregisteredMeters.id, id))
    .returning();

  if (!updatedRecord) {
    throw new Error(`Unregistered meter record with ID ${id} not found`);
  }
}

/**
 * Retrieves the unregistered meter count from the latest record BEFORE a cutoff
 * date.
 *
 * @example
 *   // Get latest count before 2025-08-17
 *   const count = await getUnregisteredMeterCountBeforeCutoff(executor, {
 *     balanceGroup: "ЮР П2",
 *     cutoffDate: "2025-08-17",
 *     substationId: 45,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Query parameters object
 * @param params.balanceGroup - Balance group to filter by (e.g., "Быт", "ЮР
 *   Sims")
 * @param params.cutoffDate - Cutoff date (YYYY-MM-DD) - returns latest record
 *   BEFORE this date
 * @param params.substationId - Substation ID to filter by
 * @returns Unregistered meter count from the latest matching record, or 0 if no
 *   match found
 */
export async function getUnregisteredMeterCountBeforeCutoff(
  executor: Executor,
  { balanceGroup, cutoffDate, substationId }: MeterCountQueryParams,
): Promise<number> {
  const result = await executor.query.unregisteredMeters.findFirst({
    columns: {
      unregisteredMeterCount: true,
    },
    where: and(
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
      lt(unregisteredMeters.date, cutoffDate),
    ),
    orderBy: [desc(unregisteredMeters.date)],
  });

  return result ? result.unregisteredMeterCount : 0;
}

interface UnregisteredMeterRecordInput {
  unregisteredMeterCount: UnregisteredMeters["unregisteredMeterCount"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  date: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

/**
 * Updates unregistered meter record by composite key
 *
 * @example
 *   await updateUnregisteredMeterRecordByCompositeKey(executor, {
 *     unregisteredMeterCount: 5,
 *     balanceGroup: "Быт",
 *     date: "2025-08-17",
 *     substationId: 15,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.unregisteredMeterCount - New meter count value
 * @param params.balanceGroup - Balance group category (e.g., "Быт", "ЮР Sims")
 * @param params.date - Record date (YYYY-MM-DD)
 * @param params.substationId - Associated substation ID
 * @throws {Error} When no matching record found
 */
export async function updateUnregisteredMeterRecordByCompositeKey(
  executor: Executor,
  {
    unregisteredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: UnregisteredMeterRecordInput,
): Promise<void> {
  const updatedAt = new Date();

  const [updatedRecord] = await executor
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
    throw new Error("No matching unregistered meter record found");
  }
}

interface UnregisteredMeterQueryParams {
  balanceGroup: UnregisteredMeters["balanceGroup"];
  startDate: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

/**
 * Gets IDs of unregistered meter records after a specific date
 *
 * @example
 *   const futureRecordIds = await getUnregisteredMeterRecordIdsAfterDate(
 *     executor,
 *     {
 *       balanceGroup: "ЮР Sims",
 *       startDate: "2025-08-17",
 *       substationId: 45,
 *     },
 *   );
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Query parameters
 * @param params.balanceGroup - Balance group category (e.g., "Быт", "ЮР Sims")
 * @param params.startDate - Exclusive lower bound date
 * @param params.substationId - Associated substation ID
 * @returns Array of record IDs
 */
export async function getUnregisteredMeterRecordIdsAfterDate(
  executor: Executor,
  { balanceGroup, startDate, substationId }: UnregisteredMeterQueryParams,
): Promise<number[]> {
  const result = await executor.query.unregisteredMeters.findMany({
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
 * Batched update of future unregistered meter records
 *
 * Atomically increments counts for multiple records
 *
 * @example
 *   const updatedCount = await incrementUnregisteredMetersRecords(
 *     executor,
 *     [12, 22, 44],
 *     3,
 *   );
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param ids - Record IDs to update
 * @param newUnregisteredCount - Value to add to unregistered_meter_count
 * @returns Number of updated records
 */
export async function incrementUnregisteredMetersRecords(
  executor: Executor,
  ids: number[],
  newUnregisteredCount: number,
): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await executor
    .update(unregisteredMeters)
    .set({
      unregisteredMeterCount: sql`${unregisteredMeters.unregisteredMeterCount} + ${newUnregisteredCount}`,
      updatedAt: new Date(),
    })
    .where(and(inArray(unregisteredMeters.id, ids)))
    .returning();

  return result.length;
}
