import { db } from "../db";
import { meterActionLogs } from "../schema";
import { eq, desc } from "drizzle-orm";

export async function insertMeterActionLog(
  executor: Executor,
  action: string,
  substationId: number,
) {
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
