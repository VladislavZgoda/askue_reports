import { db } from "../db";
import { meterActionLogs } from "../schema";
import { eq, desc } from "drizzle-orm";

/**
 * Inserts a meter action log entry into the database
 *
 * @param executor - Database executor (transaction or direct connection) to use
 * @param action - Description of the action being logged
 * @param substationId - ID of the substation associated with the action
 * @returns Promise that resolves when operation completes
 *
 * @example
 * // Within a transaction:
 * await insertMeterActionLog(tx, "Meters added: 5", 42);
 *
 * // Direct connection:
 * await insertMeterActionLog(db, "Technical meters updated", 42);
 */
export async function insertMeterActionLog(
  executor: Executor,
  action: string,
  substationId: number,
): Promise<void> {
  await executor.insert(meterActionLogs).values({
    message: action,
    transformerSubstationId: substationId,
  });
}

/**
 * Retrieves recent action logs for a transformer substation
 *
 * @param substationId ID of the transformer substation
 * @returns Array of the 8 most recent log entries (id and message)
 */
export async function getRecentActionLogsForSubstation(
  substationId: number,
): Promise<
  {
    id: number;
    message: string;
  }[]
> {
  const result = await db.query.meterActionLogs.findMany({
    columns: {
      id: true,
      message: true,
    },
    where: eq(meterActionLogs.transformerSubstationId, substationId),
    orderBy: [desc(meterActionLogs.created_at)],
    limit: 8,
  });

  return result;
}
