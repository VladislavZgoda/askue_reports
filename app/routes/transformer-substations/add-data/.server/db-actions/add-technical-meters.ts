import {
  insertTechnicalMeters,
  getTechnicalMeterStatsForSubstation,
  updateTechnicalMetersForSubstation,
} from "~/.server/db-queries/technicalMeters";

import { db } from "~/.server/db";
import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";

/**
 * Technical meter installation/update parameters
 *
 * @property quantity - Total quantity of technical meters to add/update
 * @property underVoltage - Number of meters operating under voltage
 * @property substationId - ID of the associated transformer substation
 */
interface TechnicalMeterInput {
  quantity: number;
  underVoltage: number;
  substationId: number;
}

/**
 * Atomically adds or updates technical meters for a substation
 *
 * @remarks
 * - Performs all operations within a database transaction
 * - Updates existing records by adding new quantities
 * - Creates new record if none exists
 * - Creates audit log entry
 *
 * @param input - Technical meter data
 *
 * @example
 * await addOrUpdateTechnicalMeters({
 *   substationId: 42,
 *   quantity: 5,
 *   underVoltage: 2
 * });
 */
export default async function addOrUpdateTechnicalMeters(
  input: TechnicalMeterInput,
) {
  await db.transaction(async (tx) => {
    const existingStats = await getTechnicalMeterStatsForSubstation(
      input.substationId,
      tx,
    );

    if (existingStats) {
      await updateTechnicalMetersForSubstation(tx, {
        quantity: input.quantity + existingStats.quantity,
        underVoltage: input.underVoltage + existingStats.underVoltage,
        substationId: input.substationId,
      });
    } else {
      await insertTechnicalMeters(input, tx);
    }

    await logTechnicalMeterAction(tx, input);
  });
}

/**
 * Creates audit log entry for technical meter operations
 *
 * @param executor - Database executor (transaction or connection)
 * @param input - Technical meter input parameters
 *
 * @logformat
 * Template: "Техучеты: {quantity} {underVoltage}. Добавлено: {timestamp}"
 * Example: "Техучеты: 5 2. Добавлено: 19.07.2023, 14:25:03"
 */
async function logTechnicalMeterAction(
  executor: Executor,
  { quantity, underVoltage, substationId }: TechnicalMeterInput,
) {
  const timestamp = new Date().toLocaleString("ru");
  const message = `Техучеты: ${quantity} ${underVoltage}. Добавлено: ${timestamp}`;

  await insertMeterActionLog(executor, message, substationId);
}
