import { eq, sum } from "drizzle-orm";
import { db } from "../db";
import { technicalMeters } from "../schema";

type TechnicalMeters = typeof technicalMeters.$inferSelect;

interface TechnicalMetersParams {
  quantity: TechnicalMeters["quantity"];
  underVoltage: TechnicalMeters["underVoltage"];
  substationId: TechnicalMeters["transformerSubstationId"];
}

export async function insertTechnicalMeters(
  { quantity, underVoltage, substationId }: TechnicalMetersParams,
  executor: Executor = db,
): Promise<void> {
  await executor.insert(technicalMeters).values({
    quantity,
    underVoltage,
    transformerSubstationId: substationId,
  });
}

interface TechnicalMetersStats {
  quantity: TechnicalMeters["quantity"];
  underVoltage: TechnicalMeters["underVoltage"];
}

/**
 * Retrieves technical meter statistics for a transformer substation
 *
 * @param substationId ID of the transformer substation
 * @param executor [executor=db] - Database executor
 * @returns Object containing {quantity, underVoltage} counts,
 *          or undefined if no record exists
 */
export async function getTechnicalMeterStatsForSubstation(
  substationId: number,
  executor: Executor = db,
): Promise<TechnicalMetersStats | undefined> {
  const result = await executor.query.technicalMeters.findFirst({
    columns: {
      quantity: true,
      underVoltage: true,
    },
    where: eq(technicalMeters.transformerSubstationId, substationId),
  });

  return result;
}

export async function updateTechnicalMetersForSubstation(
  { quantity, underVoltage, substationId }: TechnicalMetersParams,
  executor: Executor = db,
): Promise<void> {
  const updatedAt = new Date();

  await executor
    .update(technicalMeters)
    .set({ quantity, underVoltage, updatedAt })
    .where(eq(technicalMeters.transformerSubstationId, substationId));
}

interface NullableTechnicalMetersStats {
  quantity: string | null;
  underVoltage: string | null;
}

export async function getTechnicalMetersTotals(): Promise<NullableTechnicalMetersStats> {
  const result = await db
    .select({
      quantity: sum(technicalMeters.quantity),
      underVoltage: sum(technicalMeters.underVoltage),
    })
    .from(technicalMeters);

  return result[0];
}
