import {
  insertTechnicalMeters,
  updateTechnicalMetersForSubstation,
  getTechnicalMeterStatsForSubstation,
} from "~/.server/db-queries/technicalMeters";

export default async function changeTechMeters(
  values: Record<string, FormDataEntryValue>,
) {
  const { quantity, underVoltage, transformerSubstationId } =
    handleValues(values);

  const prevValues = await getTechnicalMeterStatsForSubstation(
    transformerSubstationId,
  );

  if (prevValues) {
    const isEqual =
      prevValues.quantity === quantity &&
      prevValues.underVoltage === underVoltage;

    if (!isEqual) {
      await updateTechnicalMetersForSubstation({
        quantity,
        underVoltage,
        substationId: transformerSubstationId,
      });
    }
  } else {
    await insertTechnicalMeters({
      quantity,
      underVoltage,
      substationId: transformerSubstationId,
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
