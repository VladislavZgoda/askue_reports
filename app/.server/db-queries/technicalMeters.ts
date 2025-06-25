import { eq, sum } from "drizzle-orm";
import { db } from "../db";
import { technicalMeters } from "../schema";

interface TechnicalMetersParams {
  quantity: number;
  underVoltage: number;
  substationId: number;
}

export const insertTechnicalMeters = async ({
  quantity,
  underVoltage,
  substationId,
}: TechnicalMetersParams) => {
  await db.insert(technicalMeters).values({
    quantity,
    underVoltage,
    transformerSubstationId: substationId,
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

export const updateTechnicalMetersForSubstation = async ({
  quantity,
  underVoltage,
  substationId,
}: TechnicalMetersParams) => {
  const updatedAt = new Date();

  await db
    .update(technicalMeters)
    .set({ quantity, underVoltage, updatedAt })
    .where(eq(technicalMeters.transformerSubstationId, substationId));
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
