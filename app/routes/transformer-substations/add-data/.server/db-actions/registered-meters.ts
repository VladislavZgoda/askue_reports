import { sql, and, eq, gt, inArray } from "drizzle-orm";
import { registeredMeters } from "~/.server/schema";

import {
  getRegisteredMeterCount,
  createRegisteredMeterRecord,
  getRegisteredMeterCountAtDate,
} from "~/.server/db-queries/registeredMeters";

type RegisteredMeters = typeof registeredMeters.$inferSelect;

interface AccumulatedRegisteredInput {
  newRegisteredCount: RegisteredMeters["registeredMeterCount"];
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
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
  const currentRegisteredCount = await getRegisteredMeterCountAtDate(executor, {
    balanceGroup,
    targetDate: date,
    dateComparison: "before",
    substationId,
  });

  const totalRegistered = newRegisteredCount + currentRegisteredCount;

  await createRegisteredMeterRecord(executor, {
    registeredMeterCount: totalRegistered,
    balanceGroup,
    date,
    substationId,
  });
}

interface RegisteredMeterCountUpdate {
  registeredMeterCount: RegisteredMeters["registeredMeterCount"];
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

/**
 * Updates registered meter count by composite key
 *
 * @param executor - Database executor
 * @param params - Update parameters
 *   @property registeredMeterCount - New meter count value
 *   @property balanceGroup - Balance group category
 *   @property date - Record date (YYYY-MM-DD)
 *   @property substationId - Associated substation ID
 *
 * @throws {Error} When no matching record found
 */
async function updateRegisteredMeterCount(
  executor: Executor,
  {
    registeredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: RegisteredMeterCountUpdate,
) {
  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(registeredMeters)
    .set({ registeredMeterCount, updatedAt })
    .where(
      and(
        eq(registeredMeters.transformerSubstationId, substationId),
        eq(registeredMeters.date, date),
        eq(registeredMeters.balanceGroup, balanceGroup),
      ),
    )
    .returning();

  if (!updatedRecord) {
    throw new Error("No matching registered meter record found to update");
  }
}

interface RegisteredMeterIdsQueryParams {
  balanceGroup: RegisteredMeters["balanceGroup"];
  startDate: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

/**
 * Gets IDs of registered meter records after a specific date
 *
 * @param executor - Database executor
 * @param params - Query parameters
 *   @property balanceGroup - Balance group category
 *   @property startDate - Exclusive lower bound date
 *   @property substationId - Associated substation ID
 * @returns Array of record IDs
 */
async function getRegisteredMeterRecordIdsAfterDate(
  executor: Executor,
  { balanceGroup, startDate, substationId }: RegisteredMeterIdsQueryParams,
): Promise<number[]> {
  const result = await executor
    .select({ id: registeredMeters.id })
    .from(registeredMeters)
    .where(
      and(
        gt(registeredMeters.date, startDate),
        eq(registeredMeters.balanceGroup, balanceGroup),
        eq(registeredMeters.transformerSubstationId, substationId),
      ),
    );

  const transformedResult = result.map((r) => r.id);

  return transformedResult;
}

/**
 * Batched update of future registered meter records
 *
 * Atomically increments counts for multiple records
 *
 * @param executor - Database executor
 * @param ids - Record IDs to update
 * @param newRegisteredCount - Value to add to registered_meter_count
 * @returns Number of updated records
 */
async function incrementRegisteredMetersRecords(
  executor: Executor,
  ids: number[],
  newRegisteredCount: number,
): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await executor
    .update(registeredMeters)
    .set({
      registeredMeterCount: sql`${registeredMeters.registeredMeterCount} + ${newRegisteredCount}`,
      updatedAt: new Date(),
    })
    .where(and(inArray(registeredMeters.id, ids)))
    .returning();

  return result.length;
}

interface RegisteredData {
  readonly balanceGroup: BalanceGroup;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Processes registered meter data atomically:
 * 1. Updates or creates registered meter accumulation records
 * 2. Propagates counts to future records
 *
 * Only runs when registeredCount > 0
 *
 * @param executor - Database executor
 * @param registeredInput - Validated installation data
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
 * await processRegisteredMeters({
 *   registeredCount: 12,
 *   balanceGroup: 'ЮР П2',
 *   date: '2023-06-15',
 *   substationId: 42
 * });
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
