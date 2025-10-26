import {
  createTechnicalMeterRecord,
  updateTechnicalMetersForSubstation,
  getTechnicalMeterStatsForSubstation,
} from "~/.server/db-queries/technical-meters";

import { db } from "~/.server/db";

import type { TechnicalFormData } from "../../validation/technical-form.schema";

type TechnicalMeterUpsertParams = TechnicalFormData & { substationId: number };

/**
 * Upserts technical meter data for a substation
 *
 * @remarks
 *   - Updates existing record if it exists and values changed
 *   - Creates new record if none exists
 *   - Skips update if values are unchanged (optimization)
 *   - Runs atomically in a database transaction
 *
 * @example
 *   await upsertTechnicalMeters({
 *     substationId: 42,
 *     quantity: 15,
 *     underVoltage: 3,
 *   });
 *
 * @param params - Upsert parameters
 * @param params.quantity - New total quantity of technical meters
 * @param params.underVoltage - New count of meters operating under voltage
 * @param params.substationId - ID of the target transformer substation
 */
export default async function upsertTechnicalMeters({
  quantity,
  underVoltage,
  substationId,
}: TechnicalMeterUpsertParams) {
  await db.transaction(async (tx) => {
    const existingStats = await getTechnicalMeterStatsForSubstation(
      substationId,
      tx,
    );

    if (existingStats) {
      // Skip update if values unchanged
      const valuesChanged =
        existingStats.quantity !== quantity ||
        existingStats.underVoltage !== underVoltage;

      if (valuesChanged) {
        await updateTechnicalMetersForSubstation(tx, {
          quantity,
          underVoltage,
          substationId,
        });
      }
    } else {
      await createTechnicalMeterRecord(tx, {
        quantity,
        underVoltage,
        substationId,
      });
    }
  });
}
