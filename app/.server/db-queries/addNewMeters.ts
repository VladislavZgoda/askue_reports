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
import {
  insertMonthMeters,
  updateMonthMeters,
  selectMonthQuantity,
  selectLastMonthQuantity
} from "./newMothMetersTable";

import {
  insertNotInSystem,
  updateNotInSystem,
  checkNotInSystem,
  selectLastNotInSystem
} from "./notInSystemTable";

export const addNewMeters = async (
  values: ActionValues
) => {
  const insertValues = handleInsertValues(values);
  const prevNotInSystem = await checkNotInSystem(insertValues);
  const { quantity, added_to_system } = insertValues;

  if (quantity > added_to_system &&
    prevNotInSystem) {
    await handleUpdateNotInSystem(
      insertValues,
      prevNotInSystem
    );
    insertValues.quantity = added_to_system;
  } else if (quantity > added_to_system) {
    await handleInsertNotInSystem(insertValues);
    insertValues.quantity = added_to_system;
  } 
  
  await handleInsertNewMeters(insertValues);
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

  const updatedLastYearQuantity = quantity +
  (lastYearQuantity[0]?.quantity ?? 0);
  const updatedLastYearAddedToSystem = added_to_system +
  (lastYearQuantity[0]?.added_to_system ?? 0);

  await insertYearMeters({
    ...insertValues,
    quantity: updatedLastYearQuantity,
    added_to_system: updatedLastYearAddedToSystem,
    year
  });

  const month = date.slice(5, 7);
  const lastMonthQuantity = await selectLastMonthQuantity({
    type, transformerSubstationId, month, year
  });

  const updatedLastMonthQuantity = quantity +
  (lastMonthQuantity[0]?.quantity ?? 0);
  const updatedLastMonthAddedToSystem = added_to_system +
  (lastMonthQuantity[0]?.added_to_system ?? 0);

  await insertMonthMeters({
    ...insertValues,
    quantity: updatedLastMonthQuantity,
    added_to_system: updatedLastMonthAddedToSystem,
    month,
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

  const updatedYearQuantity = quantity +
  (yearQuantity[0]?.quantity ?? 0);
  const updatedAddedToSystem = added_to_system +
  (yearQuantity[0]?.added_to_system ?? 0);

  await updateYearMeters({
    ...insertValues,
    year,
    quantity: updatedYearQuantity,
    added_to_system: updatedAddedToSystem
  });

  const month = date.slice(5, 7);
  const monthQuantity = await selectMonthQuantity({
    type, date, transformerSubstationId, month, year
  });

  const updatedMonthQuantity = quantity +
  (monthQuantity[0]?.quantity ?? 0);
  const updatedMonthAddedToSystem = added_to_system +
  (monthQuantity[0]?.added_to_system ?? 0);

  await updateMonthMeters({
    ...insertValues,
    year,
    month,
    quantity: updatedMonthQuantity,
    added_to_system: updatedMonthAddedToSystem
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

const handleInsertNotInSystem = async (
  insertValues: InsertMetersValues
) => {
  const { quantity, added_to_system } = insertValues;
  const lastQuantity = await selectLastNotInSystem(insertValues) ?? 0;
  const updatedQuantity = (quantity - added_to_system) + lastQuantity;
  await insertNotInSystem({
    ...insertValues,
    quantity: updatedQuantity
  });
};

const handleUpdateNotInSystem = async (
  insertValues: InsertMetersValues,
  prevNotInSystem: number
) => {
  const { quantity, added_to_system } = insertValues;
  const updatedQuantity = (quantity - added_to_system) + prevNotInSystem;
  await updateNotInSystem({
    ...insertValues,
    quantity: updatedQuantity,
  });
};

const handleInsertNewMeters = async (
  insertValues: InsertMetersValues
) => {
  const { added_to_system } = insertValues;

  if (added_to_system > 0) {
    const prevMetersQuantity = await checkMetersRecord(insertValues);
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