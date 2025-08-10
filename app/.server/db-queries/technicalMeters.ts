import { eq, sum } from "drizzle-orm";
import { db } from "../db";
import { technicalMeters } from "../schema";

type TechnicalMeters = typeof technicalMeters.$inferSelect;

interface TechnicalMetersParams {
  quantity: TechnicalMeters["quantity"];
  underVoltage: TechnicalMeters["underVoltage"];
  substationId: TechnicalMeters["transformerSubstationId"];
}

/**
 * Creates a new technical meter record in the database
 *
 * @param executor - Database executor (transaction or connection)
 * @param params - Creation parameters
 *
 * @example
 * await createTechnicalMeterRecord(tx, {
 *   substationId: 42,
 *   quantity: 10,
 *   underVoltage: 3
 * });
 */
export async function createTechnicalMeterRecord(
  executor: Executor,
  { quantity, underVoltage, substationId }: TechnicalMetersParams,
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

/**
 * Updates technical meter statistics for a substation
 *
 * @param executor - Database executor (transaction or connection).
 * @param params - Update parameters
 *   @param params.quantity - New total quantity of technical meters
 *   @param params.underVoltage - New count of meters operating under voltage
 *   @param params.substationId - ID of the substation to update
 *
 * @remarks
 * - Automatically sets `updatedAt` to current timestamp
 *
 * @example
 * await updateTechnicalMetersForSubstation(
 *   tx,
 *   { quantity: 15, underVoltage: 3, substationId: 42 },
 * );
 */
export async function updateTechnicalMetersForSubstation(
  executor: Executor,
  { quantity, underVoltage, substationId }: TechnicalMetersParams,
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
