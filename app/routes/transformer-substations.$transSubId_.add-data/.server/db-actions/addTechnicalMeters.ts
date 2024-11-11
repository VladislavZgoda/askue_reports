import {
  insertTechnicalMeters,
  selectTechnicalMeters,
  updateTechnicalMeters
} from "~/.server/db-queries/technicalMetersTable";
import { insertMessage } from "~/.server/db-queries/metersActionLogTable";

type TechnicalMetersAction = {
  transSubId: string;
  techMeters: string;
  underVoltage: string;
};

export default async function addTechnicalMeters(
  values: TechnicalMetersAction
) {
  const processedValues = handleValues(values);
  const prevValues =
    await selectTechnicalMeters(
      processedValues.transformerSubstationId
    );

  if (prevValues[0]?.quantity !== undefined) {
    const updatedValues = {
      ...processedValues,
      quantity: processedValues.quantity +
        prevValues[0].quantity,
      underVoltage: processedValues.underVoltage +
        prevValues[0].underVoltage
    };
    await updateTechnicalMeters(updatedValues);
  } else {
    await insertTechnicalMeters(processedValues);
  }

  await addMessageToLog(values);
}

const handleValues = (
  values: TechnicalMetersAction
) => {
  const processedValues = {
    quantity: Number(values.techMeters),
    underVoltage: Number(values.underVoltage),
    transformerSubstationId: Number(values.transSubId)
  };

  return processedValues;
};

const addMessageToLog = async (
  values: TechnicalMetersAction
) => {
  const { techMeters, underVoltage } = values;
  const transformerSubstationId = Number(values.transSubId);
  const time = new Date().toLocaleString('ru');
  const message = `Техучеты: ${techMeters} ${underVoltage} ${time}`;
  await insertMessage(message, transformerSubstationId);
};
