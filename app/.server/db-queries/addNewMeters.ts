import {
  insertNewMeters,
  checkMetersRecord,
  updateMetersRecord,
  selectLastQuantity
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
    const lastQuantity = (await selectLastQuantity(
      insertValues.transformerSubstationId,
      insertValues.type
    ))[0]?.quantity ?? 0;

    await insertNewMeters({
      ...insertValues,
      quantity: insertValues.quantity + lastQuantity
    });
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
