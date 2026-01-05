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
 * Creates a new meter counts record with the provided values
 *
 * @param executor - Database executor
 * @param params - Record values
 * @param params.registeredCount - Initial registered count
 * @param params.unregisteredCount - Initial unregistered count
 * @param params.balanceGroup - Balance group identifier
 * @param params.date - Date for the record
 * @param params.substationId - Transformer substation identifier
 */
export async function createMeterCountsRecord(
  executor: Executor,
  {
    registeredCount,
    unregisteredCount,
    balanceGroup,
    date,
    substationId,
  }: MeterCountsInput,
): Promise<void> {
  await executor.insert(meterCounts).values({
    registeredCount,
    unregisteredCount,
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
 * Gets the ID of the latest meter counts record for a balance group and
 * substation
 *
 * @param executor - Database executor
 * @param balanceGroup - Balance group to filter by
 * @param substationId - Transformer substation ID to filter by
 * @returns The ID of the most recent record, or undefined if none exists
 */
export async function findLatestMeterCountsId(
  executor: Executor,
  balanceGroup: BalanceGroup,
  substationId: MeterCounts["transformerSubstationId"],
): Promise<number | undefined> {
  const result = await executor.query.meterCounts.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(meterCounts.balanceGroup, balanceGroup),
      eq(meterCounts.transformerSubstationId, substationId),
    ),
    orderBy: [desc(meterCounts.date)],
  });

  return result?.id;
}

interface UpdateMeterCountsParams {
  id: MeterCounts["id"];
  registeredCount: MeterCounts["registeredCount"];
  unregisteredCount: MeterCounts["unregisteredCount"];
}

/**
 * Updates a specific meter counts record with new registered and unregistered
 * counts
 *
 * Updates an existing meter count record by ID, replacing its registered and
 * unregistered counts with new values. Automatically sets the `updatedAt`
 * timestamp to current time.
 *
 * @param executor - Database executor for transactional operations
 * @param params - Update parameters
 * @param params.id - ID of the meter count record to update
 * @param params.registeredCount - New registered count value
 * @param params.unregisteredCount - New unregistered count value
 * @throws {Error} If no record with the given ID exists
 */
export async function updateMeterCountsRecord(
  executor: Executor,
  { id, registeredCount, unregisteredCount }: UpdateMeterCountsParams,
): Promise<void> {
  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(meterCounts)
    .set({ registeredCount, unregisteredCount, updatedAt })
    .where(eq(meterCounts.id, id))
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
 *
 * > MinDate
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
