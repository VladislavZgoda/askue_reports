import {
  findUnregisteredMeterId,
  incrementFutureUnregisteredMeters,
  createCumulativeUnregisteredMeterRecord,
  incrementUnregisteredMeterById,
} from "~/.server/db-queries/unregistered-meters";

interface UnregisteredData {
  readonly balanceGroup: BalanceGroup;
  readonly totalCount: number;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Processes unregistered meter data atomically within a transaction:
 *
 * 1. Finds or creates an unregistered meter record for the given date
 * 2. Updates the count for that date (incrementing existing or creating new)
 * 3. Propagates the count to all future records for the same group/substation
 *
 * @param executor - Database executor (must be within a transaction for
 *   atomicity)
 * @param unregisteredInput - Validated installation data
 * @param unregisteredInput.totalCount - Total meters installed
 * @param unregisteredInput.registeredCount - Meters registered in system
 * @param unregisteredInput.balanceGroup - Balance group category
 * @param unregisteredInput.date - Installation date (YYYY-MM-DD)
 * @param unregisteredInput.substationId - Associated substation ID
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

  // 1. Check for existing record
  const existingRecordId = await findUnregisteredMeterId(executor, {
    balanceGroup,
    substationId,
    date,
  });

  // 2. Update existing or create new accumulation record
  if (existingRecordId) {
    await incrementUnregisteredMeterById(
      executor,
      existingRecordId,
      newUnregisteredCount,
    );
  } else {
    await createCumulativeUnregisteredMeterRecord(executor, {
      unregisteredMeterCount: newUnregisteredCount,
      balanceGroup,
      date,
      substationId,
    });
  }

  // 3. Propagate counts to future records
  await incrementFutureUnregisteredMeters(executor, {
    incrementValue: newUnregisteredCount,
    balanceGroup,
    minDate: date,
    substationId,
  });
}
