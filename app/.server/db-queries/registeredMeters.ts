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

/**
 * Retrieves the registered meter count from the latest record matching the specified criteria.
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Query parameters object
 * @param params.balanceGroup - Balance group to filter by
 * @param params.targetDate - Target date for comparison (ISO string format)
 * @param params.dateComparison - Date comparison mode:
 *   - "before": selects records with date < targetDate
 *   - "upTo": selects records with date <= targetDate
 * @param params.substationId - Substation ID to filter by
 *
 * @returns Registered meter count from the latest matching record, or 0 if no match found
 *
 * @example
 * // Get count up to 2025-08-16
 * const count = await getRegisteredMeterCountAtDate(executor, {
 *   balanceGroup: 'Быт',
 *   targetDate: '2025-08-16',
 *   dateComparison: 'upTo',
 *   substationId: 123
 * });
 */
export async function getRegisteredMeterCountAtDate(
  executor: Executor,
  {
    balanceGroup,
    targetDate,
    dateComparison,
    substationId,
  }: MeterCountQueryParams,
): Promise<number> {
  const result = await executor.query.registeredMeters.findFirst({
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

interface RegisteredMeterLookupParams {
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

/**
 * Retrieves the registered meter count for a specific balance group, date, and substation
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Lookup parameters with exact match criteria
 * @param params.balanceGroup - Balance group to filter by (e.g., 'Быт', 'ЮР Sims', etc.)
 * @param params.date - Exact date to match (ISO date string)
 * @param params.substationId - Substation ID to filter by
 *
 * @returns The registered meter count if found, otherwise undefined
 *
 * @example
 * // Get count for specific date and substation
 * const count = await getRegisteredMeterCount(executor, {
 *   balanceGroup: 'Быт',
 *   date: '2025-08-16',
 *   substationId: 42
 * });
 */
export async function getRegisteredMeterCount(
  executor: Executor,
  { balanceGroup, date, substationId }: RegisteredMeterLookupParams,
): Promise<number | undefined> {
  const result = await executor.query.registeredMeters.findFirst({
    columns: {
      registeredMeterCount: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.date, date),
      eq(registeredMeters.transformerSubstationId, substationId),
    ),
  });

  return result?.registeredMeterCount;
}
