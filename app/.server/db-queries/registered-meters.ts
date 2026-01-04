import { meterCounts } from "../schema";
import { increment } from "./query-helpers";
import { eq, and, desc, lt, gt, sql, inArray } from "drizzle-orm";

type MeterCounts = typeof meterCounts.$inferSelect;

interface MeterCountsInput {
  registeredCount: MeterCounts["registeredCount"];
  unregisteredCount: MeterCounts["unregisteredCount"];
  balanceGroup: MeterCounts["balanceGroup"];
  date: MeterCounts["date"];
  substationId: MeterCounts["transformerSubstationId"];
}

/**
 * Creates a new registered meter record in the database
 *
 * @example
 *   // Inside a transaction
 *   await createRegisteredMeterRecord(tx, {
 *     registeredMeterCount: 5,
 *     balanceGroup: "Быт",
 *     date: "2025-08-13",
 *     substationId: 10,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Input parameters for meter registration
 * @param params.registeredMeterCount Count of registered meters
 * @param params.balanceGroup Balance group category (e.g., "Быт", "ЮР Sims")
 * @param params.date Record date (YYYY-MM-DD format)
 * @param params.substationId Transformer substation ID
 */
export async function createRegisteredMeterRecord(
  executor: Executor,
  {
    registeredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: RegisteredMeterInput,
): Promise<void> {
  await executor.insert(registeredMeters).values({
    registeredMeterCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}

interface IncrementMeterCountsByIdParams {
  recordId: MeterCounts["id"];
  registeredCount: MeterCounts["registeredCount"];
  unregisteredCount: MeterCounts["unregisteredCount"];
}

/**
 * Increments registered and unregistered meter counts for a specific record
 *
 * This function atomically increments the registered and unregistered counts of
 * a meter record. It also updates the record's `updatedAt` timestamp to the
 * current time.
 *
 * @param executor - Database executor for transactional operations
 * @param params - Parameters for the increment operation
 * @param params.recordId - ID of the meter record to update
 * @param params.registeredCount - Number to add to registered count (must be ≤
 *   unregisteredCount)
 * @param params.unregisteredCount - Number to add to unregistered count
 * @throws {Error} If no matching meter record exists
 */
export async function incrementMeterCountsById(
  executor: Executor,
  {
    recordId,
    registeredCount,
    unregisteredCount,
  }: IncrementMeterCountsByIdParams,
): Promise<void> {
  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(meterCounts)
    .set({
      registeredCount: increment(meterCounts.registeredCount, registeredCount),
      unregisteredCount: increment(
        meterCounts.unregisteredCount,
        unregisteredCount,
      ),
      updatedAt,
    })
    .where(and(eq(meterCounts.id, recordId)))
    .returning();

  if (!updatedRecord) {
    throw new Error("No matching registered meter record found to update");
  }
}

/**
 * Fetches the latest registered meter ID by date for a given balance group and
 * substation.
 *
 * @param executor - Database client for query execution (supports transactions)
 * @returns ID of the most recent record, or 'undefined' if none exists.
 */
export async function getLatestRegisteredMeterId(
  executor: Executor,
  balanceGroup: BalanceGroup,
  substationId: RegisteredMeters["transformerSubstationId"],
): Promise<number | undefined> {
  const result = await executor.query.registeredMeters.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.transformerSubstationId, substationId),
    ),
    orderBy: [desc(registeredMeters.date)],
  });

  return result?.id;
}

interface RegisteredMeterUpdateInput {
  id: RegisteredMeters["id"];
  registeredMeterCount: RegisteredMeters["registeredMeterCount"];
}

/**
 * Updates a registered meter record by its ID
 *
 * @example
 *   await updateRegisteredMeterRecordById(tx, {
 *     id: 123,
 *     registeredMeterCount: 85,
 *   });
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.id Record ID to update
 * @param params.registeredMeterCount New count of registered meters
 * @throws Will throw if no record with the given ID exists
 */
export async function updateRegisteredMeterRecordById(
  executor: Executor,
  { id, registeredMeterCount }: RegisteredMeterUpdateInput,
): Promise<void> {
  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(registeredMeters)
    .set({ registeredMeterCount, updatedAt })
    .where(eq(registeredMeters.id, id))
    .returning();

  if (!updatedRecord) {
    throw new Error(`Registered meter record with ID ${id} not found`);
  }
}

interface FindMeterCountsIdParams {
  balanceGroup: MeterCounts["balanceGroup"];
  date: MeterCounts["date"];
  substationId: MeterCounts["transformerSubstationId"];
}

export async function findMeterCountsId(
  executor: Executor,
  { balanceGroup, date, substationId }: FindMeterCountsIdParams,
): Promise<number | undefined> {
  const result = await executor.query.meterCounts.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(meterCounts.balanceGroup, balanceGroup),
      eq(meterCounts.date, date),
      eq(meterCounts.transformerSubstationId, substationId),
    ),
  });

  return result?.id;
}

interface MeterCountsIncrementParams {
  registeredCount: MeterCounts["registeredCount"];
  unregisteredCount: MeterCounts["unregisteredCount"];
  balanceGroup: MeterCounts["balanceGroup"];
  minDate: MeterCounts["date"];
  substationId: MeterCounts["transformerSubstationId"];
}

/**
 * Increments meter counts for all future records matching criteria
 *
 * Updates ALL meter count records with dates after `minDate` for a specific
 * balance group and substation.
 *
 * @param executor - Database executor for transactional operations
 * @param params - Criteria and increments for bulk update
 * @param params.registeredCount - Value to add to registered count of matching
 *   records
 * @param params.unregisteredCount - Value to add to unregistered count of
 *   matching records
 * @param params.balanceGroup - Balance group to filter records
 * @param params.minDate - Minimum date (exclusive) - updates records with date
 *   > minDate
 * @param params.substationId - Transformer substation ID to filter records
 */
export async function incrementFutureMeterCounts(
  executor: Executor,
  {
    registeredCount,
    unregisteredCount,
    balanceGroup,
    minDate,
    substationId,
  }: MeterCountsIncrementParams,
): Promise<void> {
  const futureRecordIds = executor
    .select({ id: meterCounts.id })
    .from(meterCounts)
    .where(
      and(
        gt(meterCounts.date, minDate),
        eq(meterCounts.balanceGroup, balanceGroup),
        eq(meterCounts.transformerSubstationId, substationId),
      ),
    );

  await executor
    .update(meterCounts)
    .set({
      registeredCount: increment(meterCounts.registeredCount, registeredCount),
      unregisteredCount: increment(
        meterCounts.unregisteredCount,
        unregisteredCount,
      ),
      updatedAt: new Date(),
    })
    .where(and(inArray(meterCounts.id, futureRecordIds)));
}

/**
 * Creates a new cumulative meter count record
 *
 * Finds the most recent record before the specified date for the given balance
 * group and substation, then creates a new record with cumulative totals
 * (previous counts + new counts).
 *
 * @param executor - Database executor
 * @param params - Parameters for the new cumulative record
 * @param params.registeredCount - New registered meters to add
 * @param params.unregisteredCount - New unregistered meters to add
 * @param params.balanceGroup - Balance group identifier
 * @param params.date - Date for the new record (must be later than existing
 *   records)
 * @param params.substationId - Transformer substation identifier
 */
export async function createCumulativeMeterCountsRecord(
  executor: Executor,
  {
    registeredCount,
    unregisteredCount,
    balanceGroup,
    date,
    substationId,
  }: MeterCountsInput,
): Promise<void> {
  const previousRecord = await executor.query.meterCounts.findFirst({
    columns: {
      registeredCount: true,
      unregisteredCount: true,
    },
    where: and(
      eq(meterCounts.balanceGroup, balanceGroup),
      eq(meterCounts.transformerSubstationId, substationId),
      lt(meterCounts.date, date),
    ),
    orderBy: [desc(meterCounts.date)],
  });

  const previousCounts = previousRecord || {
    registeredCount: 0,
    unregisteredCount: 0,
  };

  await executor.insert(meterCounts).values({
    registeredCount: previousCounts.registeredCount + registeredCount,
    unregisteredCount: previousCounts.unregisteredCount + unregisteredCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}
