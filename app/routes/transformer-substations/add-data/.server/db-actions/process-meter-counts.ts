import {
  findMeterCountsId,
  incrementMeterCountsById,
  incrementFutureMeterCounts,
  createCumulativeMeterCountsRecord,
} from "~/.server/db-queries/meter-counts";

import { validateInstallationParams } from "~/utils/installation-params";

interface RegisteredData {
  readonly totalCount: number;
  readonly registeredCount: number;
  readonly balanceGroup: BalanceGroup;
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
 * @param totalCount - Total meters installed
 * @param registeredInput - Validated installation data
 * @param registeredInput.registeredCount - Meters registered in system
 * @param registeredInput.balanceGroup - Balance group category
 * @param registeredInput.date - Installation date (YYYY-MM-DD)
 * @param registeredInput.substationId - Associated substation ID
 */
export default async function processMeterCountsInTx(
  executor: Executor,
  params: RegisteredData,
) {
  const { totalCount, registeredCount, balanceGroup, date, substationId } =
    params;

  validateInstallationParams({
    totalInstalled: totalCount,
    registeredCount,
  });

  const unregisteredCount = totalCount - registeredCount;

  // 1. Check for existing record
  const existingRecordId = await findMeterCountsId(executor, {
    balanceGroup,
    date,
    substationId,
  });

  // 2. Update existing or create new accumulation record
  if (existingRecordId) {
    await incrementMeterCountsById(executor, {
      recordId: existingRecordId,
      registeredCount,
      unregisteredCount,
    });
  } else {
    await createCumulativeMeterCountsRecord(executor, {
      registeredCount,
      unregisteredCount,
      balanceGroup,
      date,
      substationId,
    });
  }

  // 3. Propagate counts to future records
  await incrementFutureMeterCounts(executor, {
    registeredCount,
    unregisteredCount,
    balanceGroup,
    minDate: date,
    substationId,
  });
}
