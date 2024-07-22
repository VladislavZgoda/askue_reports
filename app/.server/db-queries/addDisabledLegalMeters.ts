import type { DisabledLegalMetersAction } from "~/types";
import { 
  insertDisabledLegalMeters,
  selectDisabledLegalMeters,
  updateDisabledLegalMeters
 } from "./disabledLegalMetersTable";
 import { insertMessage } from "./metersActionLogTable";

export default async function addDisabledLegalMeters(
  values: DisabledLegalMetersAction
) {
  const processedValues = handleValues(values);
  const prevValue = await selectDisabledLegalMeters(
    processedValues.transformerSubstationId
  );

  if (prevValue) {
    const updatedValues = {
      ...processedValues,
      quantity: processedValues.quantity + prevValue
    };
    await updateDisabledLegalMeters(updatedValues);
  } else {
    await insertDisabledLegalMeters(processedValues);
  }

  await addMessageToLog(values);
}

const handleValues = (
  values: DisabledLegalMetersAction
) => {
  const processedValues = {
    quantity: Number(values.disabledMeters),
    transformerSubstationId: Number(values.transSubId)
  };

  return processedValues;
};

const addMessageToLog = async (
  values: DisabledLegalMetersAction
) => {
  const { disabledMeters } = values;
  const transformerSubstationId = Number(values.transSubId);
  const time = new Date().toLocaleString('ru');
  const message = `Отключенные ЮР П2: ${disabledMeters} ${time}`;
  await insertMessage(message, transformerSubstationId);
};