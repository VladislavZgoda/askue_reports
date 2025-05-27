import {
  insertNewMeters,
  checkMetersRecord,
  updateMetersRecord,
  getNewMetersIds,
  getQuantityForInsert,
  getQuantityOnID,
  updateRecordOnId,
} from "~/.server/db-queries/electricityMeters";

import {
  insertYearMeters,
  selectYearQuantity,
  updateYearMeters,
  getYearIds,
  getYearMetersOnID,
  updateYearOnId,
  getYearMetersForInsert,
} from "~/.server/db-queries/newYearMeters";

import {
  insertMonthMeters,
  updateMonthMeters,
  selectMonthQuantity,
  getMonthIds,
  getMonthMetersOnID,
  getMonthMetersForInsert,
  updateMonthOnId,
} from "~/.server/db-queries/newMonthMeters";

import {
  insertNotInSystem,
  updateNotInSystem,
  checkNotInSystem,
  getNotInSystemIds,
  getNotInSystemOnID,
  getNotInSystemForInsert,
  updateNotInSystemOnId,
} from "~/.server/db-queries/notInSystem";

import { insertMessage } from "~/.server/db-queries/meterActionLogs";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";

interface ActionValues {
  transSubId: string;
  newMeters: string;
  addedToSystem: string;
  balanceGroup: BalanceGroup;
  date: string;
}

export default async function addNewMeters(values: ActionValues) {
  const insertValues = handleInsertValues(values);
  const { quantity, addedToSystem } = insertValues;

  if (quantity > addedToSystem) {
    await handleNotInSystem(insertValues);
  }

  await Promise.all([
    handleYearMeters(insertValues),
    handleMonthMeters(insertValues),
    handleInsertNewMeters({
      ...insertValues,
      quantity: insertValues.addedToSystem,
    }),
  ]);

  await addMessageToLog(insertValues);
}

function handleInsertValues(values: ActionValues) {
  return {
    quantity: Number(values.newMeters),
    addedToSystem: Number(values.addedToSystem),
    balanceGroup: values.balanceGroup,
    date: values.date,
    transformerSubstationId: Number(values.transSubId),
  };
}

async function handleInsert(insertValues: InsertMetersValues) {
  const lastQuantity = await getQuantityForInsert(insertValues);

  await insertNewMeters({
    ...insertValues,
    quantity: insertValues.quantity + lastQuantity,
  });
}

async function handleUpdate(
  insertValues: InsertMetersValues,
  prevMetersQuantity: number,
) {
  const { quantity } = insertValues;
  const updatedQuantity = quantity + prevMetersQuantity;

  await updateMetersRecord({
    ...insertValues,
    quantity: updatedQuantity,
  });
}

interface NextRecords {
  values: InsertMetersValues;
  getIdsFunc: ({
    balanceGroup,
    date,
    transformerSubstationId,
  }: CheckRecordValues) => Promise<
    {
      id: number;
    }[]
  >;
  getQuantityFunc: (id: number) => Promise<number>;
  updateFunc: ({ id, quantity }: UpdateOnIdType) => Promise<void>;
}

async function updateNextRecords({
  values,
  getIdsFunc,
  getQuantityFunc,
  updateFunc,
}: NextRecords) {
  const ids = await getIdsFunc(values);

  if (ids.length > 0) {
    for (const { id } of ids) {
      const quantity = await getQuantityFunc(id);

      await updateFunc({
        id,
        quantity: quantity + values.quantity,
      });
    }
  }
}

async function handleNotInSystem(insertValues: InsertMetersValues) {
  const prevNotInSystem = await checkNotInSystem(insertValues);
  const { quantity, addedToSystem } = insertValues;
  const updatedQuantity = quantity - addedToSystem;

  if (typeof prevNotInSystem === "number") {
    await updateNotInSystem({
      ...insertValues,
      quantity: updatedQuantity + prevNotInSystem,
    });
  } else {
    await handleInsertNotInSystem({
      ...insertValues,
      quantity: updatedQuantity,
    });
  }

  const updatedValues = {
    ...insertValues,
    quantity: updatedQuantity,
  };

  await updateNextRecords({
    values: updatedValues,
    getIdsFunc: getNotInSystemIds,
    getQuantityFunc: getNotInSystemOnID,
    updateFunc: updateNotInSystemOnId,
  });
}

async function handleInsertNewMeters(insertValues: InsertMetersValues) {
  const { addedToSystem } = insertValues;

  if (addedToSystem > 0) {
    const prevMetersQuantity = await checkMetersRecord(insertValues);

    if (typeof prevMetersQuantity === "number") {
      await handleUpdate(insertValues, prevMetersQuantity);
    } else {
      await handleInsert(insertValues);
    }

    await updateNextRecords({
      values: insertValues,
      getIdsFunc: getNewMetersIds,
      getQuantityFunc: getQuantityOnID,
      updateFunc: updateRecordOnId,
    });
  }
}

async function handleInsertNotInSystem(insertValues: InsertMetersValues) {
  const lastQuantity = await getNotInSystemForInsert(insertValues);
  const updatedQuantity = insertValues.quantity + lastQuantity;
  await insertNotInSystem({
    ...insertValues,
    quantity: updatedQuantity,
  });
}

async function handleYearMeters(insertValues: InsertMetersValues) {
  const { balanceGroup, date, transformerSubstationId } = insertValues;
  const year = cutOutYear(date);

  const prevYearQuantity = await selectYearQuantity({
    balanceGroup,
    date,
    transformerSubstationId,
    year,
  });

  if (prevYearQuantity[0]?.quantity !== undefined) {
    await updateTotalYearMeters(insertValues, prevYearQuantity[0], year);
  } else {
    await insertTotalYearMeters(insertValues, year);
  }

  await updateNextYearRecords({
    ...insertValues,
    year,
  });
}

async function insertTotalYearMeters(
  insertValues: InsertMetersValues,
  year: number,
) {
  const {
    quantity,
    addedToSystem,
    balanceGroup,
    date,
    transformerSubstationId,
  } = insertValues;

  const lastYearQuantity = await getYearMetersForInsert({
    balanceGroup,
    transformerSubstationId,
    year,
    date,
  });

  const updatedLastYearQuantity =
    quantity + (lastYearQuantity[0]?.quantity ?? 0);
  const updatedLastYearAddedToSystem =
    addedToSystem + (lastYearQuantity[0]?.addedToSystem ?? 0);

  await insertYearMeters({
    ...insertValues,
    quantity: updatedLastYearQuantity,
    addedToSystem: updatedLastYearAddedToSystem,
    year,
  });
}

async function updateTotalYearMeters(
  insertValues: InsertMetersValues,
  prevYearQuantity: TotalMeters,
  year: number,
) {
  const { quantity, addedToSystem } = insertValues;
  const updatedYearQuantity = quantity + prevYearQuantity.quantity;
  const updatedAddedToSystem = addedToSystem + prevYearQuantity.addedToSystem;

  await updateYearMeters({
    ...insertValues,
    year,
    quantity: updatedYearQuantity,
    addedToSystem: updatedAddedToSystem,
  });
}

async function updateNextYearRecords(values: YearMetersValues) {
  const ids = await getYearIds(values);

  if (ids.length > 0) {
    for (const { id } of ids) {
      const meters = await getYearMetersOnID(id);

      await updateYearOnId({
        id,
        quantity: meters.quantity + values.quantity,
        addedToSystem: meters.addedToSystem + values.addedToSystem,
      });
    }
  }
}

async function handleMonthMeters(insertValues: InsertMetersValues) {
  const { balanceGroup, date, transformerSubstationId } = insertValues;
  const year = cutOutYear(date);
  const month = cutOutMonth(date);
  const prevMonthQuantity = await selectMonthQuantity({
    balanceGroup,
    date,
    transformerSubstationId,
    month,
    year,
  });

  if (prevMonthQuantity[0]?.quantity !== undefined) {
    await updateTotalMonthMeters(
      insertValues,
      prevMonthQuantity[0],
      month,
      year,
    );
  } else {
    await insertTotalMonthMeters(insertValues, month, year);
  }

  await updateNextMonthRecords({
    ...insertValues,
    month,
    year,
  });
}

async function insertTotalMonthMeters(
  insertValues: InsertMetersValues,
  month: string,
  year: number,
) {
  const {
    quantity,
    addedToSystem,
    balanceGroup,
    date,
    transformerSubstationId,
  } = insertValues;

  const lastMonthQuantity = await getMonthMetersForInsert({
    balanceGroup,
    transformerSubstationId,
    month,
    year,
    date,
  });
  const updatedLastMonthQuantity =
    quantity + (lastMonthQuantity[0]?.quantity ?? 0);
  const updatedLastMonthAddedToSystem =
    addedToSystem + (lastMonthQuantity[0]?.addedToSystem ?? 0);

  await insertMonthMeters({
    ...insertValues,
    quantity: updatedLastMonthQuantity,
    addedToSystem: updatedLastMonthAddedToSystem,
    month,
    year,
  });
}

async function updateTotalMonthMeters(
  insertValues: InsertMetersValues,
  prevMonthQuantity: TotalMeters,
  month: string,
  year: number,
) {
  const { quantity, addedToSystem } = insertValues;
  const updatedMonthQuantity = quantity + prevMonthQuantity.quantity;
  const updatedMonthAddedToSystem =
    addedToSystem + prevMonthQuantity.addedToSystem;

  await updateMonthMeters({
    ...insertValues,
    year,
    month,
    quantity: updatedMonthQuantity,
    addedToSystem: updatedMonthAddedToSystem,
  });
}

async function updateNextMonthRecords(values: MonthMetersValues) {
  const ids = await getMonthIds(values);

  if (ids.length > 0) {
    for (const { id } of ids) {
      const meters = await getMonthMetersOnID(id);

      await updateMonthOnId({
        id,
        quantity: meters.quantity + values.quantity,
        addedToSystem: meters.addedToSystem + values.addedToSystem,
      });
    }
  }
}

async function addMessageToLog(insertValues: InsertMetersValues) {
  const { quantity, addedToSystem, balanceGroup, transformerSubstationId } =
    insertValues;

  const time = new Date().toLocaleString("ru");
  const message = `Добавлено: ${quantity} ${addedToSystem} ${balanceGroup} ${time}`;
  await insertMessage(message, transformerSubstationId);
}
