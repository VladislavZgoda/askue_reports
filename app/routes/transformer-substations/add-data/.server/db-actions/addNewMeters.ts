import {
  insertNewMeters,
  checkMetersRecord,
  updateMetersRecord,
  getNewMetersIds,
  getQuantityOnID,
  updateRecordOnId,
  getRegisteredMeterCountAtDate,
} from "~/.server/db-queries/registeredMeters";

import {
  insertYearMeters,
  selectYearQuantity,
  updateYearMeters,
  getYearIds,
  getYearMetersOnID,
  updateYearOnId,
  getYearlyMeterInstallationSummary,
} from "~/.server/db-queries/yearlyMeterInstallations";

import {
  insertMonthMeters,
  updateMonthMeters,
  selectMonthQuantity,
  getMonthIds,
  getMonthMetersOnID,
  getMonthMetersForInsert,
  updateMonthOnId,
} from "~/.server/db-queries/monthlyMeterInstallations";

import {
  insertNotInSystem,
  updateNotInSystem,
  checkNotInSystem,
  getNotInSystemIds,
  getNotInSystemOnID,
  updateNotInSystemOnId,
  getUnregisteredMeterCountAtDate,
} from "~/.server/db-queries/unregisteredMeters";

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
  const lastQuantity = await getRegisteredMeterCountAtDate({
    balanceGroup: insertValues.balanceGroup,
    targetDate: insertValues.date,
    dateComparison: "before",
    transformerSubstationId: insertValues.transformerSubstationId,
  });

  await insertNewMeters({
    ...insertValues,
    registeredMeterCount: insertValues.quantity + lastQuantity,
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
    registeredMeterCount: updatedQuantity,
  });
}

async function handleNotInSystem(insertValues: InsertMetersValues) {
  const prevNotInSystem = await checkNotInSystem(insertValues);
  const { quantity, addedToSystem } = insertValues;
  const updatedQuantity = quantity - addedToSystem;

  if (typeof prevNotInSystem === "number") {
    await updateNotInSystem({
      ...insertValues,
      unregisteredMeterCount: updatedQuantity + prevNotInSystem,
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

  const ids = await getNotInSystemIds(updatedValues);

  if (ids.length > 0) {
    for (const { id } of ids) {
      const quantity = await getNotInSystemOnID(id);

      await updateNotInSystemOnId({
        id,
        unregisteredMeterCount: quantity + updatedValues.quantity,
      });
    }
  }
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

    const ids = await getNewMetersIds(insertValues);

    if (ids.length > 0) {
      for (const { id } of ids) {
        const quantity = await getQuantityOnID(id);

        await updateRecordOnId({
          id,
          registeredMeterCount: quantity + insertValues.quantity,
        });
      }
    }
  }
}

async function handleInsertNotInSystem(insertValues: InsertMetersValues) {
  const lastQuantity = await getUnregisteredMeterCountAtDate({
    balanceGroup: insertValues.balanceGroup,
    targetDate: insertValues.date,
    dateComparison: "before",
    transformerSubstationId: insertValues.transformerSubstationId,
  });

  const updatedQuantity = insertValues.quantity + lastQuantity;
  await insertNotInSystem({
    ...insertValues,
    unregisteredMeterCount: updatedQuantity,
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

  if (prevYearQuantity[0]?.totalInstalled !== undefined) {
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

  const lastYearQuantity = await getYearlyMeterInstallationSummary({
    balanceGroup,
    targetDate: date,
    dateComparison: "before",
    transformerSubstationId,
    year,
  });

  const updatedTotalInstalled = quantity + lastYearQuantity.totalInstalled;
  const updatedRegisteredCount =
    addedToSystem + lastYearQuantity.registeredCount;

  await insertYearMeters({
    ...insertValues,
    totalInstalled: updatedTotalInstalled,
    registeredCount: updatedRegisteredCount,
    year,
  });
}

type YearlyMeterCount = Awaited<ReturnType<typeof selectYearQuantity>>[number];

async function updateTotalYearMeters(
  insertValues: InsertMetersValues,
  prevYearQuantity: YearlyMeterCount,
  year: number,
) {
  const { quantity, addedToSystem } = insertValues;
  const updatedYearQuantity = quantity + prevYearQuantity.totalInstalled;
  const updatedAddedToSystem = addedToSystem + prevYearQuantity.registeredCount;

  await updateYearMeters({
    ...insertValues,
    year,
    totalInstalled: updatedYearQuantity,
    registeredCount: updatedAddedToSystem,
  });
}

async function updateNextYearRecords(values: YearMetersValues) {
  const ids = await getYearIds(values);

  if (ids.length > 0) {
    for (const { id } of ids) {
      const meters = await getYearMetersOnID(id);

      await updateYearOnId({
        id,
        totalInstalled: meters.totalInstalled + values.quantity,
        registeredCount: meters.registeredCount + values.addedToSystem,
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
