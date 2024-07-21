import { eq } from "drizzle-orm";
import { db } from "../db";
import { TechnicalMeters } from "../schema";
import type { TechnicalMetersValues } from "~/types";

export const insertTechnicalMeters = async ({
  quantity,
  underVoltage,
  transformerSubstationId
}: TechnicalMetersValues) => {
  await db
    .insert(TechnicalMeters)
    .values({
      quantity,
      underVoltage,
      transformerSubstationId
    });
};

export const selectTechnicalMeters = async (
  transformerSubstationId: number
) => {
  const prevValues = await db
    .select({
      quantity: TechnicalMeters.quantity,
      underVoltage: TechnicalMeters.underVoltage
    })
    .from(TechnicalMeters)
    .where(
      eq(TechnicalMeters.transformerSubstationId,
        transformerSubstationId)
    );

  return prevValues;
};

export const updateTechnicalMeters = async ({
  quantity,
  underVoltage,
  transformerSubstationId
}: TechnicalMetersValues) => {
  await db
    .update(TechnicalMeters)
    .set({ quantity, underVoltage })
    .where(
      eq(TechnicalMeters.transformerSubstationId,
        transformerSubstationId)
    );
};
