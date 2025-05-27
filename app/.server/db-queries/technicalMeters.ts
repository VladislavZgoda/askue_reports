import { eq, sum } from "drizzle-orm";
import { db } from "../db";
import { technicalMeters } from "../schema";

interface TechnicalMetersValues {
  quantity: number;
  underVoltage: number;
  transformerSubstationId: number;
}

export const insertTechnicalMeters = async ({
  quantity,
  underVoltage,
  transformerSubstationId,
}: TechnicalMetersValues) => {
  await db.insert(technicalMeters).values({
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
      quantity: technicalMeters.quantity,
      underVoltage: technicalMeters.underVoltage,
    })
    .from(technicalMeters)
    .where(
      eq(technicalMeters.transformerSubstationId, transformerSubstationId),
    );

  return prevValues;
};

export const updateTechnicalMeters = async ({
  quantity,
  underVoltage,
  transformerSubstationId,
}: TechnicalMetersValues) => {
  const updatedAt = new Date();

  await db
    .update(technicalMeters)
    .set({ quantity, underVoltage, updatedAt })
    .where(
      eq(technicalMeters.transformerSubstationId, transformerSubstationId),
    );
};

export const selectSumTechnicalMeters = async () => {
  const meters = await db
    .select({
      quantity: sum(technicalMeters.quantity),
      underVoltage: sum(technicalMeters.underVoltage),
    })
    .from(technicalMeters);

  return meters;
};
