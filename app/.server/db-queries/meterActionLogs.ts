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

export const selectMessages = async (transformerSubstationId: string) => {
  const messages = await db
    .select({
      id: meterActionLogs.id,
      message: meterActionLogs.message,
    })
    .from(meterActionLogs)
    .where(
      eq(
        meterActionLogs.transformerSubstationId,
        Number(transformerSubstationId),
      ),
    )
    .orderBy(desc(meterActionLogs.created_at))
    .limit(8);

  return messages;
};
