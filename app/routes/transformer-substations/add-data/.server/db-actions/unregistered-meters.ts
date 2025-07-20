import { sql, and, eq, gt, lt, desc, inArray } from "drizzle-orm";
import { unregisteredMeters } from "~/.server/schema";

interface MeterCountQueryParams {
  balanceGroup: UnregisteredMeters["balanceGroup"];
  targetDate: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

/**
 * Retrieves unregistered meter count before a cutoff date
 *
 * @param executor - Database executor
 * @param params - Query parameters
 *   @property balanceGroup - Balance group category
 *   @property targetDate - Cutoff date (exclusive)
 *   @property substationId - Associated substation ID
 * @returns Unregistered meter count (0 if no records found)
 */
async function getUnregisteredMeterCountBeforeCutoff(
  executor: Executor,
  { balanceGroup, targetDate, substationId }: MeterCountQueryParams,
): Promise<number> {
  const result = await executor.query.unregisteredMeters.findFirst({
    columns: {
      unregisteredMeterCount: true,
    },
    where: and(
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
      lt(unregisteredMeters.date, targetDate),
    ),
    orderBy: [desc(unregisteredMeters.date)],
  });

  return result ? result.unregisteredMeterCount : 0;
}

type UnregisteredMeters = typeof unregisteredMeters.$inferSelect;

interface UnregisteredMeterRecordInput {
  unregisteredMeterCount: UnregisteredMeters["unregisteredMeterCount"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  date: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

async function createUnregisteredMeterRecord(
  executor: Executor,
  {
    unregisteredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: UnregisteredMeterRecordInput,
) {
  await executor.insert(unregisteredMeters).values({
    unregisteredMeterCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}

interface AccumulatedUnrecordedInput {
  newUnregisteredCount: UnregisteredMeters["unregisteredMeterCount"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  date: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

/**
 * Creates accumulated unregistered meter record
 *
 * Calculates new totals based on previous records before the cutoff date
 *
 * @param executor - Database executor
 * @param newUnregisteredCount - New unregistered meters to add
 * @param balanceGroup - Balance group category
 * @param date - Record date (YYYY-MM-DD)
 * @param substationId - Associated substation ID
 */
async function createAccumulatedUnregisteredRecord(
  executor: Executor,
  {
    newUnregisteredCount,
    balanceGroup,
    date,
    substationId,
  }: AccumulatedUnrecordedInput,
) {
  const currentUnregistered = await getUnregisteredMeterCountBeforeCutoff(
    executor,
    {
      balanceGroup: balanceGroup,
      targetDate: date,
      substationId,
    },
  );

  const accumulatedUnregistered = newUnregisteredCount + currentUnregistered;

  await createUnregisteredMeterRecord(executor, {
    unregisteredMeterCount: accumulatedUnregistered,
    balanceGroup: balanceGroup,
    date: date,
    substationId: substationId,
  });
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
 * @param executor - Database executor
 * @param params - Update parameters
 *   @property unregisteredMeterCount - New meter count value
 *   @property balanceGroup - Balance group category
 *   @property date - Record date (YYYY-MM-DD)
 *   @property substationId - Associated substation ID
 *
 * @throws {Error} When no matching record found
 */
async function updateUnregisteredMeterRecordByCompositeKey(
  executor: Executor,
  {
    unregisteredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: UnregisteredMeterRecordInput,
) {
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

interface UnregisteredMeterQuery {
  balanceGroup: UnregisteredMeters["balanceGroup"];
  substationId: UnregisteredMeters["transformerSubstationId"];
  date: UnregisteredMeters["date"];
}

async function getUnregisteredMeterCount(
  executor: Executor,
  { balanceGroup, substationId, date }: UnregisteredMeterQuery,
): Promise<number | undefined> {
  const result = await executor.query.unregisteredMeters.findFirst({
    columns: {
      unregisteredMeterCount: true,
    },
    where: and(
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
      eq(unregisteredMeters.date, date),
    ),
  });

  return result?.unregisteredMeterCount;
}

interface UnregisteredMeterQueryParams {
  balanceGroup: UnregisteredMeters["balanceGroup"];
  startDate: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

/**
 * Gets IDs of unregistered meter records after a specific date
 *
 * @param executor - Database executor
 * @param params - Query parameters
 *   @property balanceGroup - Balance group category
 *   @property startDate - Exclusive lower bound date
 *   @property substationId - Associated substation ID
 * @returns Array of record IDs
 */
async function getUnregisteredMeterRecordIdsAfterDate(
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
 * @param executor - Database executor
 * @param ids - Record IDs to update
 * @param newUnregisteredCount - Value to add to unregistered_meter_count
 * @returns Number of updated records
 */
async function incrementUnregisteredMetersRecords(
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

interface UnregisteredData {
  readonly balanceGroup: BalanceGroup;
  readonly totalCount: number;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Processes unregistered meter data atomically:
 * 1. Updates or creates unregistered meter accumulation records
 * 2. Propagates counts to future records
 *
 * Performs all operations within a database transaction
 *
 * @param executor - Database executor
 * @param unregisteredInput - Validated installation data
 *   @property totalCount - Total meters installed
 *   @property registeredCount - Meters registered in system
 *   @property balanceGroup - Balance group category
 *   @property date - Installation date (YYYY-MM-DD)
 *   @property substationId - Associated substation ID
 *
 * @throws {Error} When:
 *   - Batch update partially fails
 *   - Database constraints are violated
 *
 * @example
 * await processUnregisteredMeters({
 *   totalCount: 15,
 *   registeredCount: 12,
 *   balanceGroup: 'ЮР П2',
 *   date: '2023-06-15',
 *   substationId: 42
 * });
 */
export default async function processUnregisteredMetersInTx(
  executor: Executor,
  {
    totalCount,
    registeredCount,
    balanceGroup,
    date,
    substationId,
  }: UnregisteredData,
) {
  const newUnregisteredCount = totalCount - registeredCount;

  // 1. Get current count (transactional)
  const currentUnregistered = await getUnregisteredMeterCount(executor, {
    balanceGroup,
    substationId,
    date,
  });

  // 2. Update or create accumulation (transactional)
  if (currentUnregistered) {
    await updateUnregisteredMeterRecordByCompositeKey(executor, {
      unregisteredMeterCount: newUnregisteredCount + currentUnregistered,
      balanceGroup,
      date,
      substationId,
    });
  } else {
    await createAccumulatedUnregisteredRecord(executor, {
      newUnregisteredCount,
      balanceGroup,
      date,
      substationId,
    });
  }

  // 3. Get future records (transactional)
  const futureRecordIds = await getUnregisteredMeterRecordIdsAfterDate(
    executor,
    {
      balanceGroup,
      startDate: date,
      substationId,
    },
  );

  // 4. Batch update future records (transactional)
  if (futureRecordIds.length > 0) {
    const updatedCount = await incrementUnregisteredMetersRecords(
      executor,
      futureRecordIds,
      newUnregisteredCount,
    );

    if (updatedCount !== futureRecordIds.length) {
      const failedCount = futureRecordIds.length - updatedCount;
      throw new Error(`Failed to update ${failedCount} records.`);
    }
  }
}
