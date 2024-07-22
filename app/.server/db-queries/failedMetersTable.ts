import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { FailedMeters } from "../schema";
import type { 
  FailedMetersValues,
  FindFailedMeters
 } from "~/types";

export const insertFailedMeters = async ({
  quantity,
  type,
  transformerSubstationId
}: FailedMetersValues) => {
  await db
    .insert(FailedMeters)
    .values({
      quantity,
      type,
      transformerSubstationId
    });
};

export const selectFailedMeters = async ({
  type,
  transformerSubstationId
}: FindFailedMeters): Promise<number | undefined> => {
  const quantity = await db
    .select({ quantity: FailedMeters.quantity })
    .from(FailedMeters)
    .where(and(
      eq(FailedMeters.type, type),
      eq(FailedMeters.transformerSubstationId, 
        transformerSubstationId)
    ));
  
  return quantity[0]?.quantity;
};

export const updatedFailedMeters = async ({
  quantity,
  type,
  transformerSubstationId
}: FailedMetersValues) => {
  const updated_at = new Date();

  await db
    .update(FailedMeters)
    .set({ quantity, updated_at })
    .where(and(
      eq(FailedMeters.type, type),
      eq(FailedMeters.transformerSubstationId, 
        transformerSubstationId)
    ));
};