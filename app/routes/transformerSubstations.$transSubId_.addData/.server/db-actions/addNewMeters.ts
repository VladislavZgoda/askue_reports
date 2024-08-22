import {
  insertNewMeters,
  checkMetersRecord,
  updateMetersRecord,
  getNewMetersIds,
  getQuantityForInsert,
  getQuantityOnID,
  updateRecordOnId
} from "~/.server/db-queries/electricityMetersTable";
import type {
  InsertMetersValues,
  TotalMeters,
  BalanceType,
  CheckRecordValues,
  UpdateOnIdType
} from "~/types";
import {
  insertYearMeters,
  selectLastYearQuantity,
  selectYearQuantity,
  updateYearMeters
} from "~/.server/db-queries/newYearMetersTable";
import {
  insertMonthMeters,
  updateMonthMeters,
  selectMonthQuantity,
  selectLastMonthQuantity
} from "~/.server/db-queries/newMothMetersTable";
import {
  insertNotInSystem,
  updateNotInSystem,
  checkNotInSystem,
  getNotInSystemIds,
  getNotInSystemOnID,
  getNotInSystemForInsert,
  updateNotInSystemOnId
} from "~/.server/db-queries/notInSystemTable";
import { insertMessage } from "~/.server/db-queries/metersActionLogTable";

type ActionValues = {
  transSubId: string;
  newMeters: string;
  addedToSystem: string;
  type: BalanceType;
  date: string;
};

export default async function addNewMeters (
  values: ActionValues
) {
  const insertValues = handleInsertValues(values);
  const { quantity, added_to_system } = insertValues;

  if (quantity > added_to_system) {
    await handleNotInSystem(insertValues);
  }

  await handleYearMeters(insertValues);
  await handleMonthMeters(insertValues);
  await handleInsertNewMeters({
    ...insertValues,
    quantity: insertValues.added_to_system
  });
  await addMessageToLog(insertValues);
}

function handleInsertValues(values: ActionValues) {
  return {
    quantity: Number(values.newMeters),
    added_to_system: Number(values.addedToSystem),
    type: values.type,
    date: values.date,
    transformerSubstationId: Number(values.transSubId)
  };
}

async function handleInsert(
  insertValues: InsertMetersValues
) {
  const lastQuantity = await getQuantityForInsert(insertValues);

  await insertNewMeters({
    ...insertValues,
    quantity: insertValues.quantity + lastQuantity
  });
}

async function handleUpdate(
  insertValues: InsertMetersValues,
  prevMetersQuantity: number
) {
  const { quantity } = insertValues;
  const updatedQuantity = quantity + prevMetersQuantity;

  await updateMetersRecord({
    ...insertValues,
    quantity: updatedQuantity
  });
}

type NextRecords = {
  values: InsertMetersValues,
  getIdsFunc: ({
    type, date, transformerSubstationId
  }: CheckRecordValues) => Promise<{
    id: number;
  }[]>,
  getQuantityFunc: (id: number) => Promise<number>,
  updateFunc: ({ id, quantity }: UpdateOnIdType) => Promise<void>,
};

async function updateNextRecords({
  values,
  getIdsFunc,
  getQuantityFunc,
  updateFunc
}: NextRecords) {
  const ids = await getIdsFunc(values);

  if (ids.length > 0) {
    ids.forEach(async ({ id }) => {
      const quantity = await getQuantityFunc(id);

      await updateFunc({
        id,
        quantity: quantity + values.quantity
      });
    });
  }
}

async function handleNotInSystem(
  insertValues: InsertMetersValues
) {
  const prevNotInSystem = await checkNotInSystem(insertValues);
  const { quantity, added_to_system } = insertValues;
  const updatedQuantity = quantity - added_to_system;

  if (typeof prevNotInSystem === 'number') {
    await updateNotInSystem({
      ...insertValues,
      quantity: updatedQuantity + prevNotInSystem,
    });
  } else {
    await handleInsertNotInSystem({
      ...insertValues,
      quantity: updatedQuantity
    });
  }

  const updatedValues = {
    ...insertValues,
    quantity: updatedQuantity
  };

  await updateNextRecords({
    values: updatedValues,
    getIdsFunc: getNotInSystemIds,
    getQuantityFunc: getNotInSystemOnID,
    updateFunc: updateNotInSystemOnId
  });
}

async function handleInsertNewMeters(
  insertValues: InsertMetersValues
) {
  const { added_to_system } = insertValues;

  if (added_to_system > 0) {
    const prevMetersQuantity = await checkMetersRecord(insertValues);

    if (typeof prevMetersQuantity === 'number') {
      await handleUpdate(insertValues, prevMetersQuantity);
    } else {
      await handleInsert(insertValues);
    }

    await updateNextRecords({
      values: insertValues,
      getIdsFunc: getNewMetersIds,
      getQuantityFunc: getQuantityOnID,
      updateFunc: updateRecordOnId
    });
  }
}

const handleInsertNotInSystem = async (
  insertValues: InsertMetersValues
) => {
  const lastQuantity = await getNotInSystemForInsert(insertValues);
  const updatedQuantity = insertValues.quantity + lastQuantity;
  await insertNotInSystem({
    ...insertValues,
    quantity: updatedQuantity
  });
};

const handleYearMeters = async (
  insertValues: InsertMetersValues
) => {
  const { type, date, transformerSubstationId } = insertValues;
  const year = Number(date.slice(0, 4));
  const prevYearQuantity = await selectYearQuantity({
    type, date, transformerSubstationId, year
  });

  if (prevYearQuantity[0]?.quantity !== undefined) {
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

  if (prevMonthQuantity[0]?.quantity !== undefined) {
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
