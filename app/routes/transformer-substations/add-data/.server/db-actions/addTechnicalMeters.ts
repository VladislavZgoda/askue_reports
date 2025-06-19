import {
  insertTechnicalMeters,
  getTechnicalMeterStatsForSubstation,
  updateTechnicalMeters,
} from "~/.server/db-queries/technicalMeters";
import { insertMessage } from "~/.server/db-queries/meterActionLogs";

interface TechnicalMetersAction {
  transSubId: string;
  techMeters: string;
  underVoltage: string;
}

export default async function addTechnicalMeters(
  values: TechnicalMetersAction,
) {
  const processedValues = handleValues(values);
  const prevValues = await getTechnicalMeterStatsForSubstation(
    processedValues.transformerSubstationId,
  );

  if (prevValues) {
    const updatedValues = {
      ...processedValues,
      quantity: processedValues.quantity + prevValues.quantity,
      underVoltage: processedValues.underVoltage + prevValues.underVoltage,
    };
    await updateTechnicalMeters(updatedValues);
  } else {
    await insertTechnicalMeters(processedValues);
  }

  await addMessageToLog(values);
}

const handleValues = (values: TechnicalMetersAction) => {
  const processedValues = {
    quantity: Number(values.techMeters),
    underVoltage: Number(values.underVoltage),
    transformerSubstationId: Number(values.transSubId),
  };

  return processedValues;
};

const addMessageToLog = async (values: TechnicalMetersAction) => {
  const { techMeters, underVoltage } = values;
  const transformerSubstationId = Number(values.transSubId);
  const time = new Date().toLocaleString("ru");
  const message = `Техучеты: ${techMeters} ${underVoltage} ${time}`;
  await insertMessage(message, transformerSubstationId);
};
