import {
  getRegisteredMeterCount,
  updateRegisteredMeterCount,
  createRegisteredMeterRecord,
  incrementRegisteredMetersRecords,
  getRegisteredMeterCountBeforeCutoff,
  getRegisteredMeterRecordIdsAfterDate,
} from "~/.server/db-queries/registered-meters";

interface AccumulatedRegisteredInput {
  newRegisteredCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  substationId: number;
}

/**
 * Creates accumulated registered meter record
 *
 * Calculates total by combining new registrations with previous records
 *
 * @param executor - Database executor
 * @param newRegisteredCount - New registered meters to add
 * @param balanceGroup - Balance group category
 * @param date - Record date (YYYY-MM-DD)
 * @param substationId - Associated substation ID
 */
async function createAccumulatedRegisteredRecord(
  executor: Executor,
  {
    newRegisteredCount,
    balanceGroup,
    date,
    substationId,
  }: AccumulatedRegisteredInput,
) {
  const currentRegisteredCount = await getRegisteredMeterCountBeforeCutoff(
    executor,
    {
      balanceGroup,
      cutoffDate: date,
      substationId,
    },
  );

  const totalRegistered = newRegisteredCount + currentRegisteredCount;

  await createRegisteredMeterRecord(executor, {
    registeredMeterCount: totalRegistered,
    balanceGroup,
    date,
    substationId,
  });
}

interface RegisteredData {
  readonly balanceGroup: BalanceGroup;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Processes registered meter data atomically:
 *
 * 1. Updates or creates registered meter accumulation records
 * 2. Propagates counts to future records
 *
 * Only runs when registeredCount > 0
 *
 * @example
 *   await processRegisteredMeters({
 *     registeredCount: 12,
 *     balanceGroup: "ЮР П2",
 *     date: "2023-06-15",
 *     substationId: 42,
 *   });
 *
 * @property registeredCount - Meters registered in system
 * @property balanceGroup - Balance group category
 * @property date - Installation date (YYYY-MM-DD)
 * @property substationId - Associated substation ID
 * @param executor - Database executor
 * @param registeredInput - Validated installation data
 * @throws {Error} When:
 *
 *   - Batch update partially fails
 *   - Database constraints are violated
 */
export default async function processRegisteredMetersInTx(
  executor: Executor,
  { registeredCount, balanceGroup, date, substationId }: RegisteredData,
) {
  if (registeredCount > 0) {
    // 1. Get current count (transactional)
    const currentRegisteredCount = await getRegisteredMeterCount(executor, {
      balanceGroup,
      date,
      substationId,
    });

    // 2. Update or create accumulation (transactional)
    if (currentRegisteredCount) {
      const accumulatedRegisteredCount =
        registeredCount + currentRegisteredCount;

      await updateRegisteredMeterCount(executor, {
        registeredMeterCount: accumulatedRegisteredCount,
        balanceGroup,
        date,
        substationId,
      });
    } else {
      await createAccumulatedRegisteredRecord(executor, {
        newRegisteredCount: registeredCount,
        balanceGroup,
        date,
        substationId,
      });
    }

    // 3. Get future records (transactional)
    const futureRecordIds = await getRegisteredMeterRecordIdsAfterDate(
      executor,
      {
        balanceGroup,
        startDate: date,
        substationId,
      },
    );

    // 4. Batch update future records (transactional)
    if (futureRecordIds.length > 0) {
      const updatedCount = await incrementRegisteredMetersRecords(
        executor,
        futureRecordIds,
        registeredCount,
      );

      if (updatedCount !== futureRecordIds.length) {
        const failedCount = futureRecordIds.length - updatedCount;
        throw new Error(`Failed to update ${failedCount} records.`);
      }
    }
  }
}
