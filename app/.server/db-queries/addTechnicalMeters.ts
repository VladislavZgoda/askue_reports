import type { TechnicalMetersAction } from "~/types";
import { insertTechnicalMeters } from "./technicalMetersTable";

export default async function addTechnicalMeters(
  values: TechnicalMetersAction
) {
  const processedValues = handleValues(values);
  await insertTechnicalMeters(processedValues);
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
