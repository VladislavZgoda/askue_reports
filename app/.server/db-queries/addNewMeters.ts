import {
  insertNewMeters,
  checkMetersRecord,
  updateMetersRecord,
  selectLastQuantity
} from "./electricityMetersTable";
import type {
  ActionValues,
  InsertMetersValues,
  TotalMeters
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
import { insertMessage } from "./metersActionLogTable";

export default async function addNewMeters (
  values: ActionValues
) {
  const insertValues = handleInsertValues(values);
  const { quantity, added_to_system } = insertValues;

  if (quantity > added_to_system) {
    const prevNotInSystem = await checkNotInSystem(insertValues);
    if (prevNotInSystem) {
      await handleUpdateNotInSystem(
        insertValues,
        prevNotInSystem
      );
    } else {
      await handleInsertNotInSystem(insertValues);
    }
  }

  await handleYearMeters(insertValues);
  await handleMonthMeters(insertValues);
  await handleInsertNewMeters({
    ...insertValues,
    quantity: insertValues.added_to_system
  });
  await addMessageToLog(insertValues);
}

const handleInsert = async (
  insertValues: InsertMetersValues
) => {
  const {
    quantity,
    type,
    transformerSubstationId,
  } = insertValues;
  const lastQuantity = await selectLastQuantity({
    transformerSubstationId, type
  }) ?? 0;

  await insertNewMeters({
    ...insertValues,
    quantity: quantity + lastQuantity
  });
};

const handleUpdate = async (
  insertValues: InsertMetersValues,
  prevMetersQuantity: number
) => {
  const { quantity } = insertValues;
  const updatedQuantity = quantity + prevMetersQuantity;

  await updateMetersRecord({
    ...insertValues,
    quantity: updatedQuantity
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

const handleYearMeters = async (
  insertValues: InsertMetersValues
) => {
  const { type, date, transformerSubstationId } = insertValues;
  const year = Number(date.slice(0, 4));
  const prevYearQuantity = await selectYearQuantity({
    type, date, transformerSubstationId, year
  });

  if (prevYearQuantity[0]?.quantity) {
    await updateTotalYearMeters(
      insertValues,
      prevYearQuantity[0],
      year
    );
  } else {
    await insertTotalYearMeters(
      insertValues, year
    );
  }
};

const insertTotalYearMeters = async (
  insertValues: InsertMetersValues,
  year: number
) => {
  const {
    quantity,
    added_to_system,
    type,
    transformerSubstationId
  } = insertValues;

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
};

const updateTotalYearMeters = async (
  insertValues: InsertMetersValues,
  prevYearQuantity: TotalMeters,
  year: number
) => {
  const { quantity, added_to_system } = insertValues;
  const updatedYearQuantity = quantity +
    prevYearQuantity.quantity;
  const updatedAddedToSystem = added_to_system +
    prevYearQuantity.added_to_system;

  await updateYearMeters({
    ...insertValues,
    year,
    quantity: updatedYearQuantity,
    added_to_system: updatedAddedToSystem
  });
};

const handleMonthMeters = async (
  insertValues: InsertMetersValues
) => {
  const { type, date, transformerSubstationId } = insertValues;
  const year = Number(date.slice(0, 4));
  const month = date.slice(5, 7);
  const prevMonthQuantity = await selectMonthQuantity({
    type, date, transformerSubstationId, month, year
  });

  if (prevMonthQuantity[0]?.quantity) {
    await updateTotalMonthMeters(
      insertValues,
      prevMonthQuantity[0],
      month,
      year
    );
  } else {
    await insertTotalMonthMeters(
      insertValues, month, year
    );
  }
};

const insertTotalMonthMeters = async (
  insertValues: InsertMetersValues,
  month: string,
  year: number
) => {
  const {
    quantity,
    added_to_system,
    type,
    transformerSubstationId
  } = insertValues;

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

const updateTotalMonthMeters = async (
  insertValues: InsertMetersValues,
  prevMonthQuantity: TotalMeters,
  month: string,
  year: number
) => {
  const { quantity, added_to_system } = insertValues;
  const updatedMonthQuantity = quantity +
    prevMonthQuantity.quantity;
  const updatedMonthAddedToSystem = added_to_system +
    prevMonthQuantity.added_to_system;

  await updateMonthMeters({
    ...insertValues,
    year,
    month,
    quantity: updatedMonthQuantity,
    added_to_system: updatedMonthAddedToSystem
  });
};

const addMessageToLog = async (
  insertValues: InsertMetersValues
) => {
  const {
    quantity,
    added_to_system,
    type,
    transformerSubstationId
  } = insertValues;
  const time = new Date().toLocaleString('ru');
  const message = `Добавлено: ${quantity} ${added_to_system} ${type} ${time}`;
  await insertMessage(message, transformerSubstationId);
};
