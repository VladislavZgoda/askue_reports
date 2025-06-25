import {
  insertTechnicalMeters,
  getTechnicalMeterStatsForSubstation,
  updateTechnicalMetersForSubstation,
} from "~/.server/db-queries/technicalMeters";
import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";

interface TechnicalMeterInput {
  substationId: number;
  quantity: number;
  underVoltage: number;
}

export default async function addOrUpdateTechnicalMeters(
  input: TechnicalMeterInput,
) {
  const existingStats = await getTechnicalMeterStatsForSubstation(
    input.substationId,
  );

  if (existingStats) {
    await updateTechnicalMetersForSubstation({
      quantity: input.quantity + existingStats.quantity,
      underVoltage: input.underVoltage + existingStats.underVoltage,
      substationId: input.substationId,
    });
  } else {
    await insertTechnicalMeters(input);
  }

  await logTechnicalMeterAction(input);
}

const logTechnicalMeterAction = async (input: TechnicalMeterInput) => {
  const timestamp = new Date().toLocaleString("ru");
  const message = `Техучеты: ${input.quantity} ${input.underVoltage} ${timestamp}`;

  await insertMeterActionLog(message, input.substationId);
};
