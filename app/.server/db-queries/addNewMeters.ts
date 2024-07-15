import {
  insertNewMeters,
  checkMetersRecord,
  updateMetersRecord,
  selectLastQuantity
} from "./electricityMetersTable";
import type {
  ActionValues,
  InsertMetersValues
} from "~/types";
import {
  insertYearMeters,
  selectLastYearQuantity,
  selectYearQuantity,
  updateYearMeters
} from "./newYearMetersTable";

export const addNewMeters = async (
  values: ActionValues
) => {
  const insertValues = handleInsertValues(values);
  const prevMetersQuantity = await checkMetersRecord(insertValues);
  const { quantity, added_to_system } = insertValues;

  if (quantity === added_to_system) {
    if (prevMetersQuantity) {
      await handleUpdate(
        insertValues,
        prevMetersQuantity
      );
    } else {
      await handleInsert(insertValues);
    }
  }
};

const handleInsert = async (
  insertValues: InsertMetersValues
) => {
  const {
    quantity,
    type,
    date,
    transformerSubstationId,
    added_to_system
  } = insertValues;
  const lastQuantity = await selectLastQuantity({
    transformerSubstationId, type
  }) ?? 0;

  await insertNewMeters({
    ...insertValues,
    quantity: quantity + lastQuantity
  });

  const year = Number(date.slice(0, 4));
  const lastYearQuantity = await selectLastYearQuantity({
    type, transformerSubstationId, year
  });

  await insertYearMeters({
    ...insertValues,
    quantity: quantity +
      lastYearQuantity[0]?.quantity ?? 0,
    added_to_system: added_to_system +
      lastYearQuantity[0]?.added_to_system ?? 0,
    year
  });
};

const handleUpdate = async (
  insertValues: InsertMetersValues,
  prevMetersQuantity: number
) => {
  const {
    quantity,
    type,
    date,
    transformerSubstationId,
    added_to_system
  } = insertValues;
  const updatedQuantity = quantity + prevMetersQuantity;

  await updateMetersRecord({
    ...insertValues,
    quantity: updatedQuantity
  });

  const year = Number(date.slice(0, 4));
  const yearQuantity = await selectYearQuantity({
    type, date, transformerSubstationId, year
  });

  await updateYearMeters({
    ...insertValues,
    year,
    quantity: quantity +
      yearQuantity[0]?.quantity ?? 0,
    added_to_system: added_to_system +
      yearQuantity[0]?.added_to_system ?? 0
  });
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
