import {
  insertNewMeters,
  checkMetersRecord,
  updateMetersRecord
} from "./electricityMetersTable";
import type { ActionValues } from "~/types";

export const addNewMeters = async (
  values: ActionValues
) => {
  const insertValues = handleInsertValues(values);
  const record = await checkMetersRecord(insertValues);

  if (record.length > 0) {
    await updateMetersRecord({
      ...insertValues,
      quantity: insertValues.quantity + record[0].quantity
    });
  } else {
    await insertNewMeters(insertValues);
  }
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
