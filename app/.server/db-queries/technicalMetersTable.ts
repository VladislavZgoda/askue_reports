import { eq, sum } from "drizzle-orm";
import { db } from "../db";
import { TechnicalMeters } from "../schema";

type TechnicalMetersValues = {
  quantity: number;
  underVoltage: number;
  transformerSubstationId: number;
};

export const insertTechnicalMeters = async ({
  quantity,
  underVoltage,
  transformerSubstationId,
}: TechnicalMetersValues) => {
  await db.insert(TechnicalMeters).values({
    quantity,
    underVoltage,
    transformerSubstationId,
  });
};

export const selectTechnicalMeters = async (
  transformerSubstationId: number,
) => {
  const prevValues = await db
    .select({
      quantity: TechnicalMeters.quantity,
      underVoltage: TechnicalMeters.underVoltage,
    })
    .from(TechnicalMeters)
    .where(
      eq(TechnicalMeters.transformerSubstationId, transformerSubstationId),
    );

  return prevValues;
};

export const updateTechnicalMeters = async ({
  quantity,
  underVoltage,
  transformerSubstationId,
}: TechnicalMetersValues) => {
  const updated_at = new Date();

  await db
    .update(TechnicalMeters)
    .set({ quantity, underVoltage, updated_at })
    .where(
      eq(TechnicalMeters.transformerSubstationId, transformerSubstationId),
    );
};

export const selectSumTechnicalMeters = async () => {
  const meters = await db
    .select({
      quantity: sum(TechnicalMeters.quantity),
      underVoltage: sum(TechnicalMeters.underVoltage),
    })
    .from(TechnicalMeters);

  return meters;
};
