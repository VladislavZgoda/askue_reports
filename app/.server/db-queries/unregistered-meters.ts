import { unregisteredMeters } from "../schema";
import { increment } from "./query-helpers";
import { eq, and, desc, lt, gt, inArray, sql } from "drizzle-orm";

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

/**
 * Creates a new unregistered meter record with a cumulative count. Finds the
 * most recent record for the same balance group and substation (with an earlier
 * date) and adds the new count to it.
 *
 * This creates a running total of unregistered meters over time.
 *
 * @param executor - Database connection or transaction
 * @param input - Parameters for the new record
 * @param input.unregisteredMeterCount - Number of new unregistered meters to
 *   add
 * @param input.balanceGroup - Balance group for the record
 * @param input.date - Date of the new record (must be later than previous
 *   records)
 * @param input.substationId - Substation ID for the record
 */
export async function createCumulativeUnregisteredMeterRecord(
  executor: Executor,
  {
    unregisteredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: UnregisteredMeterRecordInput,
): Promise<void> {
  const previousCount = executor
    .select({
      unregisteredMeterCount: unregisteredMeters.unregisteredMeterCount,
    })
    .from(unregisteredMeters)
    .where(
      and(
        eq(unregisteredMeters.balanceGroup, balanceGroup),
        eq(unregisteredMeters.transformerSubstationId, substationId),
        lt(unregisteredMeters.date, date),
      ),
    )
    .orderBy(desc(unregisteredMeters.date))
    .limit(1);

  await executor.insert(unregisteredMeters).values({
    unregisteredMeterCount: sql`coalesce((${previousCount}), 0) + ${unregisteredMeterCount}`,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}

interface FindUnregisteredMeterParams {
  date: UnregisteredMeters["date"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

export async function findUnregisteredMeterId(
  executor: Executor,
  { date, balanceGroup, substationId }: FindUnregisteredMeterParams,
): Promise<number | undefined> {
  const result = await executor.query.unregisteredMeters.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(unregisteredMeters.date, date),
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
    ),
  });

  return result?.id;
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
 * Increments the unregistered meter count for a specific record.
 *
 * @param executor - Database connection or transaction
 * @param recordId - ID of the unregistered meter record to update
 * @param amount - Amount to add to the existing count
 * @throws {Error} If no record with the given ID exists
 */
export async function incrementUnregisteredMeterById(
  executor: Executor,
  recordId: number,
  amount: number,
): Promise<void> {
  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(unregisteredMeters)
    .set({
      unregisteredMeterCount: increment(
        unregisteredMeters.unregisteredMeterCount,
        amount,
      ),
      updatedAt,
    })
    .where(and(eq(unregisteredMeters.id, recordId)))
    .returning();

  if (!updatedRecord) {
    throw new Error("No matching unregistered meter record found");
  }
}

interface UnregisteredMetersIncrementParams {
  incrementValue: number;
  balanceGroup: UnregisteredMeters["balanceGroup"];
  minDate: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

/**
 * Batch increments unregistered meter counts for future records. Updates all
 * records with date > minDate for the given balance group and substation.
 */
export async function incrementFutureUnregisteredMeters(
  executor: Executor,
  {
    incrementValue,
    balanceGroup,
    minDate,
    substationId,
  }: UnregisteredMetersIncrementParams,
): Promise<void> {
  const futureRecordIds = executor
    .select({ id: unregisteredMeters.id })
    .from(unregisteredMeters)
    .where(
      and(
        gt(unregisteredMeters.date, minDate),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
        eq(unregisteredMeters.transformerSubstationId, substationId),
      ),
    );

  await executor
    .update(unregisteredMeters)
    .set({
      unregisteredMeterCount: increment(
        unregisteredMeters.unregisteredMeterCount,
        incrementValue,
      ),
      updatedAt: new Date(),
    })
    .where(inArray(unregisteredMeters.id, futureRecordIds));
}
