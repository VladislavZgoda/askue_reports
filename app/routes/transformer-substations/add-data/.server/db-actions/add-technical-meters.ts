import {
  insertTechnicalMeters,
  getTechnicalMeterStatsForSubstation,
  updateTechnicalMetersForSubstation,
} from "~/.server/db-queries/technicalMeters";

import { db } from "~/.server/db";
import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";

interface TechnicalMeterInput {
  quantity: number;
  underVoltage: number;
  substationId: number;
}

export default async function addOrUpdateTechnicalMeters(
  input: TechnicalMeterInput,
) {
  await db.transaction(async (tx) => {
    const existingStats = await getTechnicalMeterStatsForSubstation(
      input.substationId,
      tx,
    );

    if (existingStats) {
      await updateTechnicalMetersForSubstation(
        {
          quantity: input.quantity + existingStats.quantity,
          underVoltage: input.underVoltage + existingStats.underVoltage,
          substationId: input.substationId,
        },
        tx,
      );
    } else {
      await insertTechnicalMeters(input, tx);
    }
  });

  await logTechnicalMeterAction(input);
}

const logTechnicalMeterAction = async (input: TechnicalMeterInput) => {
  const timestamp = new Date().toLocaleString("ru");
  const message = `Техучеты: ${input.quantity} ${input.underVoltage} ${timestamp}`;

  await insertMeterActionLog(message, input.substationId);
};
