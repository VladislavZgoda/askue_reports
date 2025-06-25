import {
  insertTechnicalMeters,
  getTechnicalMeterStatsForSubstation,
  updateTechnicalMetersForSubstation,
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
    await updateTechnicalMetersForSubstation({
      quantity: formData.quantity + prevValues.quantity,
      underVoltage: formData.underVoltage + prevValues.underVoltage,
      substationId: formData.substationId,
    });
  } else {
    await insertTechnicalMeters(formData);
  }

  await addMessageToLog(formData);
}

const addMessageToLog = async (formData: FormData) => {
  const time = new Date().toLocaleString("ru");
  const message = `Техучеты: ${formData.quantity} ${formData.underVoltage} ${time}`;

  await insertMessage(message, formData.substationId);
};
