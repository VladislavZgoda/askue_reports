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

/**
 * Retrieves technical meter statistics for a transformer substation
 *
 * @param substationId ID of the transformer substation
 * @returns Object containing {quantity, underVoltage} counts,
 *          or undefined if no record exists
 */
export const getTechnicalMeterStatsForSubstation = async (
  substationId: number,
) => {
  const result = await db.query.technicalMeters.findFirst({
    columns: {
      quantity: true,
      underVoltage: true,
    },
    where: eq(technicalMeters.transformerSubstationId, substationId),
  });

  return result;
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

export const getTechnicalMetersTotals = async () => {
  const meters = await db
    .select({
      quantity: sum(technicalMeters.quantity),
      underVoltage: sum(technicalMeters.underVoltage),
    })
    .from(technicalMeters);

  return meters[0];
};
