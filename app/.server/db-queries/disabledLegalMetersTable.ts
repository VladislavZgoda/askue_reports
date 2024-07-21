import { db } from "../db";
import { DisabledLegalMeters } from "../schema";
import type { DisabledLegalMetersValues } from "~/types";
import { eq } from "drizzle-orm";

export const insertDisabledLegalMeters = async ({
  quantity,
  transformerSubstationId
}: DisabledLegalMetersValues) => {
  await db
    .insert(DisabledLegalMeters)
    .values({
      quantity,
      transformerSubstationId
    });
};

export const selectDisabledLegalMeters = async (
  transformerSubstationId: number
): Promise<number | undefined> => {
  const prevValues = await db
    .select({
      quantity: DisabledLegalMeters.quantity,
    })
    .from(DisabledLegalMeters)
    .where(
      eq(DisabledLegalMeters.transformerSubstationId,
        transformerSubstationId)
    );

  return prevValues[0]?.quantity;
};

export const updateDisabledLegalMeters = async ({
  quantity,
  transformerSubstationId
}: DisabledLegalMetersValues) => {
  const updated_at = new Date();

  await db
    .update(DisabledLegalMeters)
    .set({ quantity, updated_at })
    .where(
      eq(DisabledLegalMeters.transformerSubstationId,
        transformerSubstationId)
    );
};
