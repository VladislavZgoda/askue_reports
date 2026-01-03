import {
  findRegisteredMeterId,
  incrementRegisteredMeterById,
  incrementFutureRegisteredMeters,
  createCumulativeRegisteredMeterRecord,
} from "~/.server/db-queries/registered-meters";

interface RegisteredData {
  readonly balanceGroup: BalanceGroup;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Processes registered meter data atomically within a transaction:
 *
 * 1. Finds or creates an registered meter record for the given date
 * 2. Updates the count for that date (incrementing existing or creating new)
 * 3. Propagates the count to all future records for the same group/substation
 *
 * Only runs when registeredCount > 0
 *
 * @param executor - Database executor (must be within a transaction for
 *   atomicity)
 * @param registeredInput - Validated installation data
 * @param registeredInput.registeredCount - Meters registered in system
 * @param registeredInput.balanceGroup - Balance group category
 * @param registeredInput.date - Installation date (YYYY-MM-DD)
 * @param registeredInput.substationId - Associated substation ID
 */
export default async function processRegisteredMetersInTx(
  executor: Executor,
  { registeredCount, balanceGroup, date, substationId }: RegisteredData,
) {
  if (registeredCount > 0) {
    // 1. Check for existing record
    const existingRecordId = await findRegisteredMeterId(executor, {
      balanceGroup,
      date,
      substationId,
    });

    // 2. Update existing or create new accumulation record
    if (existingRecordId) {
      await incrementRegisteredMeterById(
        executor,
        existingRecordId,
        registeredCount,
      );
    } else {
      await createCumulativeRegisteredMeterRecord(executor, {
        registeredMeterCount: registeredCount,
        balanceGroup,
        date,
        substationId,
      });
    }

    // 3. Propagate counts to future records
    await incrementFutureRegisteredMeters(executor, {
      incrementValue: registeredCount,
      balanceGroup,
      minDate: date,
      substationId,
    });
  }
}
