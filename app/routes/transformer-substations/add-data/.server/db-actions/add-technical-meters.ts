import {
  insertTechnicalMeters,
  getTechnicalMeterStatsForSubstation,
  updateTechnicalMeters,
} from "~/.server/db-queries/technicalMeters";
import { insertMessage } from "~/.server/db-queries/meterActionLogs";

interface FormData {
  substationId: number;
  quantity: number;
  underVoltage: number;
}

export default async function addTechnicalMeters(formData: FormData) {
  const prevValues = await getTechnicalMeterStatsForSubstation(
    formData.substationId,
  );

  if (prevValues) {
    await updateTechnicalMeters({
      quantity: formData.quantity + prevValues.quantity,
      underVoltage: formData.underVoltage + prevValues.underVoltage,
      transformerSubstationId: formData.substationId,
    });
  } else {
    await insertTechnicalMeters({
      quantity: formData.quantity,
      underVoltage: formData.underVoltage,
      transformerSubstationId: formData.substationId,
    });
  }

  await addMessageToLog(formData);
}

const addMessageToLog = async (formData: FormData) => {
  const time = new Date().toLocaleString("ru");
  const message = `Техучеты: ${formData.quantity} ${formData.underVoltage} ${time}`;

  await insertMessage(message, formData.substationId);
};
