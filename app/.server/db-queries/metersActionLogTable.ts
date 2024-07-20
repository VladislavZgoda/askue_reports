import { db } from "../db";
import { MetersActionLog } from "../schema";
import { eq, desc } from "drizzle-orm";

export const insertMessage = async (
  message: string,
  transformerSubstationId: number
) => {
  await db
    .insert(MetersActionLog)
    .values({
      message,
      transformerSubstationId
    });
};

export const selectMessages = async (
  transformerSubstationId: string
) => {
  const messages = await db
    .select({
      id: MetersActionLog.id,
      message: MetersActionLog.message,
    })
    .from(MetersActionLog)
    .where(eq(
      MetersActionLog.transformerSubstationId,
      Number(transformerSubstationId)
    ))
    .orderBy(desc(MetersActionLog.created_at))
    .limit(8);

  return messages;
};
