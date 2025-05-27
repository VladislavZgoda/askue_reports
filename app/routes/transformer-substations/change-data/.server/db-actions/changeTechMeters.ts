import {
  selectTechnicalMeters,
  updateTechnicalMeters,
  insertTechnicalMeters,
} from "~/.server/db-queries/technicalMeters";

export default async function changeTechMeters(
  values: Record<string, FormDataEntryValue>,
) {
  const { quantity, underVoltage, transformerSubstationId } =
    handleValues(values);

  const prevValues = await selectTechnicalMeters(transformerSubstationId);

  if (prevValues[0]?.quantity !== undefined) {
    const isEqual =
      prevValues[0].quantity === quantity &&
      prevValues[0].underVoltage === underVoltage;

    if (!isEqual) {
      await updateTechnicalMeters({
        quantity,
        underVoltage,
        transformerSubstationId,
      });
    }
  } else {
    await insertTechnicalMeters({
      quantity,
      underVoltage,
      transformerSubstationId,
    });
  }
}

function handleValues(values: Record<string, FormDataEntryValue>) {
  return {
    quantity: Number(values.quantity),
    underVoltage: Number(values.underVoltage),
    transformerSubstationId: Number(values.id),
  };
}
