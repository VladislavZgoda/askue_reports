import {
  getUnregisteredMeterCount,
  incrementFutureUnregisteredMeters,
  createCumulativeUnregisteredMeterRecord,
  updateUnregisteredMeterRecordByCompositeKey,
} from "~/.server/db-queries/unregistered-meters";

interface UnregisteredData {
  readonly balanceGroup: BalanceGroup;
  readonly totalCount: number;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Processes unregistered meter data atomically:
 *
 * 1. Updates or creates unregistered meter accumulation records
 * 2. Propagates counts to future records
 *
 * Performs all operations within a database transaction
 *
 * @example
 *   await processUnregisteredMeters({
 *     totalCount: 15,
 *     registeredCount: 12,
 *     balanceGroup: "ЮР П2",
 *     date: "2023-06-15",
 *     substationId: 42,
 *   });
 *
 * @property totalCount - Total meters installed
 * @property registeredCount - Meters registered in system
 * @property balanceGroup - Balance group category
 * @property date - Installation date (YYYY-MM-DD)
 * @property substationId - Associated substation ID
 * @param executor - Database executor
 * @param unregisteredInput - Validated installation data
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
    await createCumulativeUnregisteredMeterRecord(executor, {
      unregisteredMeterCount: newUnregisteredCount,
      balanceGroup,
      date,
      substationId,
    });
  }

  // 3. Batch update future records (transactional)
  await incrementFutureUnregisteredMeters(executor, {
    incrementValue: newUnregisteredCount,
    balanceGroup,
    minDate: date,
    substationId,
  });
}
