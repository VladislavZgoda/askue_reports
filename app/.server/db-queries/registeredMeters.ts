import { db } from "../db";
import { registeredMeters } from "../schema";
import { eq, and, desc, lte, lt } from "drizzle-orm";

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
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Input parameters for meter registration
 * @param params.registeredMeterCount Count of registered meters
 * @param params.balanceGroup Balance group category (e.g., "Быт", "ЮР Sims")
 * @param params.date Record date (YYYY-MM-DD format)
 * @param params.substationId Transformer substation ID
 *
 * @example
 * // Inside a transaction
 * await createRegisteredMeterRecord(tx, {
 *   registeredMeterCount: 5,
 *   balanceGroup: "Быт",
 *   date: "2025-08-13",
 *   substationId: 10
 * })
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
 * Fetches the latest registered meter ID by date for a given balance group and substation.
 *
 * @param executor - Database client for query execution (supports transactions)
 *
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
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.id Record ID to update
 * @param params.registeredMeterCount New count of registered meters
 *
 * @throws Will throw if no record with the given ID exists
 *
 * @example
 * await updateRegisteredMeterRecordById(tx, {
 *   id: 123,
 *   registeredMeterCount: 85
 * });
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

export async function getRegisteredMeterCountAtDate({
  balanceGroup,
  targetDate,
  dateComparison,
  substationId,
}: MeterCountQueryParams) {
  const result = await db.query.registeredMeters.findFirst({
    columns: {
      registeredMeterCount: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.transformerSubstationId, substationId),
      dateComparison === "before"
        ? lt(registeredMeters.date, targetDate)
        : lte(registeredMeters.date, targetDate),
    ),
    orderBy: [desc(registeredMeters.date)],
  });

  return result ? result.registeredMeterCount : 0;
}
