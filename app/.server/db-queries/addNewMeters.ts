import {
  insertNewMeters,
  checkMetersRecord,
  updateMetersRecord,
  selectLastQuantity
} from "./electricityMetersTable";
import type { ActionValues } from "~/types";
import { insertYearMeters } from "./newYearMetersTable";

export const addNewMeters = async (
  values: ActionValues
) => {
  const insertValues = handleInsertValues(values);
  const prevMetersQuantity = await checkMetersRecord(insertValues);

  if (prevMetersQuantity) {
    const updatedQuantity = insertValues.quantity + 
    prevMetersQuantity;
    
    await updateMetersRecord({
      ...insertValues,
      quantity: updatedQuantity
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

    const year = Number(insertValues.date.slice(0, 4));
    await insertYearMeters({
      ...insertValues,
      year 
    });
  }
};

const handleInsertValues = (
  values: ActionValues
) => {
  return {
    quantity: Number(values.newMeters),
    added_to_system: Number(values.addedToSystem),
    type: values.type,
    date: values.date,
    transformerSubstationId: Number(values.transSubId)
  };
};
