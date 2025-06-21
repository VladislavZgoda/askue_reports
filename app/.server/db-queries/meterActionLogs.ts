import { db } from "../db";
import { meterActionLogs } from "../schema";
import { eq, desc } from "drizzle-orm";

export const insertMessage = async (
  message: string,
  transformerSubstationId: number,
) => {
  await db.insert(meterActionLogs).values({
    message,
    transformerSubstationId,
  });
};

/**
 * Retrieves recent action logs for a transformer substation
 *
 * @param substationId ID of the transformer substation
 * @returns Array of the 8 most recent log entries (id and message)
 */
export async function getRecentActionLogsForSubstation(substationId: number) {
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
