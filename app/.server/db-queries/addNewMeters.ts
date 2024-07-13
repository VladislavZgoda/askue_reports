import { insertNewMeters } from "./electricityMetersTable";
import type { ActionValues } from "~/types";

export const addNewMeters = async (
  values: ActionValues
) => {
  const insertValues = handleInsertValues(values);
  await insertNewMeters(insertValues);
};

const handleInsertValues = (
  values: ActionValues
) => {
  return {
    quantity: Number(values.newMeters),
    type: values.type,
    date: values.date,
    transformerSubstationId: Number(values.transSubId)
  };
};
