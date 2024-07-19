import { db } from "../db";
import { MetersActionLog } from "../schema";

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
