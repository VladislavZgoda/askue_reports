import {
  getUnregisteredMeterCount,
  createUnregisteredMeterRecord,
  incrementUnregisteredMetersRecords,
  getUnregisteredMeterCountBeforeCutoff,
  getUnregisteredMeterRecordIdsAfterDate,
  updateUnregisteredMeterRecordByCompositeKey,
} from "~/.server/db-queries/unregistered-meters";

interface AccumulatedUnrecordedInput {
  newUnregisteredCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  substationId: number;
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
      cutoffDate: date,
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
