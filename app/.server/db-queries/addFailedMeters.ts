import type { FailedMetersAction } from "~/types";
import { 
  insertFailedMeters,
  selectFailedMeters,
  updatedFailedMeters
} from "./failedMetersTable";
import { insertMessage } from "./metersActionLogTable";

export default async function addFailedMeters(
  values: FailedMetersAction
) {
  const processedValues = handleValues(values);
  const prevValue = await selectFailedMeters(processedValues);
  
  if (prevValue) {
    const updatedValues = {
      ...processedValues,
      quantity: processedValues.quantity + prevValue
    };
    await updatedFailedMeters(updatedValues);
  } else {
    await insertFailedMeters(processedValues);
  }

  await addMessageToLog(values);
}

const handleValues = (
  values: FailedMetersAction
) => {
  const processedValues = {
    quantity: Number(values.brokenMeters),
    transformerSubstationId: Number(values.transSubId),
    type: values.type
  };

  return processedValues;
};

const addMessageToLog = async (
  values: FailedMetersAction
) => {
  const { brokenMeters, type } = values;
  const transformerSubstationId = Number(values.transSubId);
  const time = new Date().toLocaleString('ru');
  const message = `Сломанные ПУ: ${brokenMeters} ${type} ${time}`;
  await insertMessage(message, transformerSubstationId);
};