import { registeredMeters } from "../schema";
import { increment } from "./query-helpers";
import { eq, and, desc, lt, gt, sql, inArray } from "drizzle-orm";

type RegisteredMeters = typeof registeredMeters.$inferSelect;

interface RegisteredMeterInput {
  registeredMeterCount: RegisteredMeters["registeredMeterCount"];
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
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

/**
 * Increments the registered meter count for a specific record.
 *
 * @param executor - Database connection or transaction
 * @param recordId - ID of the registered meter record to update
 * @param amount - Amount to add to the existing count
 * @throws {Error} If no record with the given ID exists
 */
export async function incrementRegisteredMeterById(
  executor: Executor,
  recordId: number,
  amount: number,
): Promise<void> {
  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(registeredMeters)
    .set({
      registeredMeterCount: increment(
        registeredMeters.registeredMeterCount,
        amount,
      ),
      updatedAt,
    })
    .where(and(eq(registeredMeters.id, recordId)))
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

interface FindRegisteredMeterParams {
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

export async function findRegisteredMeterId(
  executor: Executor,
  { balanceGroup, date, substationId }: FindRegisteredMeterParams,
): Promise<number | undefined> {
  const result = await executor.query.registeredMeters.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.date, date),
      eq(registeredMeters.transformerSubstationId, substationId),
    ),
  });

  return result?.id;
}

interface RegisteredMetersIncrementParams {
  incrementValue: number;
  balanceGroup: RegisteredMeters["balanceGroup"];
  minDate: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

/**
 * Batch increments registered meter counts for future records. Updates all
 * records with date > minDate for the given balance group and substation.
 */
export async function incrementFutureRegisteredMeters(
  executor: Executor,
  {
    incrementValue,
    balanceGroup,
    minDate,
    substationId,
  }: RegisteredMetersIncrementParams,
): Promise<void> {
  const futureRecordIds = executor
    .select({ id: registeredMeters.id })
    .from(registeredMeters)
    .where(
      and(
        gt(registeredMeters.date, minDate),
        eq(registeredMeters.balanceGroup, balanceGroup),
        eq(registeredMeters.transformerSubstationId, substationId),
      ),
    );

  await executor
    .update(registeredMeters)
    .set({
      registeredMeterCount: increment(
        registeredMeters.registeredMeterCount,
        incrementValue,
      ),
      updatedAt: new Date(),
    })
    .where(and(inArray(registeredMeters.id, futureRecordIds)));
}

/**
 * Creates a new registered meter record with a cumulative count. Finds the most
 * recent record for the same balance group and substation (with an earlier
 * date) and adds the new count to it.
 *
 * This creates a running total of registered meters over time.
 *
 * @param executor - Database connection or transaction
 * @param input - Parameters for the new record
 * @param input.registeredMeterCount - Number of new registered meters to add
 * @param input.balanceGroup - Balance group for the record
 * @param input.date - Date of the new record (must be later than previous
 *   records)
 * @param input.substationId - Substation ID for the record
 */
export async function createCumulativeRegisteredMeterRecord(
  executor: Executor,
  {
    registeredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: RegisteredMeterInput,
): Promise<void> {
  const previousCount = executor
    .select({
      registeredMeterCount: registeredMeters.registeredMeterCount,
    })
    .from(registeredMeters)
    .where(
      and(
        eq(registeredMeters.balanceGroup, balanceGroup),
        eq(registeredMeters.transformerSubstationId, substationId),
        lt(registeredMeters.date, date),
      ),
    )
    .orderBy(desc(registeredMeters.date))
    .limit(1);

  await executor.insert(registeredMeters).values({
    registeredMeterCount: sql`coalesce((${previousCount}), 0) + ${registeredMeterCount}`,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}
