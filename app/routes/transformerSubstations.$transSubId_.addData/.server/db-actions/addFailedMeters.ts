import type { FailedMetersAction } from "~/types";
import {
  insertFailedMeters,
  selectFailedMeters,
  updateFailedMeters
} from "~/.server/db-queries/failedMetersTable";
import { insertMessage } from "~/.server/db-queries/metersActionLogTable";

export default async function addFailedMeters(
  values: FailedMetersAction
) {
  const processedValues = handleValues(values);
  const prevValue = await selectFailedMeters(processedValues);

  if (prevValue !== undefined) {
    const updatedValues = {
      ...processedValues,
      quantity: processedValues.quantity + prevValue
    };
    await updateFailedMeters(updatedValues);
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
