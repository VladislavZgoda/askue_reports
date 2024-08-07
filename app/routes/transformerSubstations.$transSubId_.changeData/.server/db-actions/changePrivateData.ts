import type {
  BalanceType,
  UpdateTotalMetersType,
  UpdateTotalYearMetersType,
  UpdateTotalMonthMetersType,
  FailedMetersValues,
  PrevDataType
} from "~/types";
import {
  getLastRecordId,
  updateRecordOnId,
  insertNewMeters
} from "~/.server/db-queries/electricityMetersTable";
import {
  getLastNotInSystemId,
  updateNotInSystemOnId,
  insertNotInSystem
} from "~/.server/db-queries/notInSystemTable";
import {
  getLastYearId,
  updateLastYearOnId,
  insertYearMeters
} from "~/.server/db-queries/newYearMetersTable";
import {
  getLastMonthId,
  updateLastMonthOnId,
  insertMonthMeters
} from "~/.server/db-queries/newMothMetersTable";
import {
  insertFailedMeters,
  selectFailedMeters,
  updateFailedMeters
} from "~/.server/db-queries/failedMetersTable";
import loadPrivateData from "./loadPrivateData";

export default async function updatePrivateData(
  values: { [k: string]: FormDataEntryValue }
) {
  const handledValues = handleValues(values);
  const prevData = await loadPrivateData(handledValues.id);
  await handleTotalMeters(handledValues, prevData);
  await handleYearMeters(handledValues, prevData);
  await handleMonthMeters(handledValues, prevData);
  await handleFailedMeters({
    quantity: handledValues.failedMeters,
    type: handledValues.type,
    transformerSubstationId: handledValues.id
  });
}

function handleValues(
  values: { [k: string]: FormDataEntryValue }
) {
  const date = new Date().toLocaleDateString('en-CA');
  const year = Number(date.slice(0, 4));
  const month = date.slice(5, 7);

  const handledValues = {
    type: 'Быт' as BalanceType,
    totalMeters: Number(values.totalMeters),
    inSystemTotal: Number(values.inSystemTotal),
    yearTotal: Number(values.yearTotal),
    inSystemYear: Number(values.inSystemYear),
    monthTotal: Number(values.monthTotal),
    inSystemMonth: Number(values.inSystemMonth),
    failedMeters: Number(values.failedMeters),
    id: Number(values.id),
    date,
    year,
    month
  };

  return handledValues;
}

async function handleTotalMeters({
  id, type, totalMeters, inSystemTotal, date
}: UpdateTotalMetersType,
  prevData: PrevDataType) {
  const lastMetersQuantityId = await getLastRecordId({
    transformerSubstationId: id,
    type
  });

  if (lastMetersQuantityId) {
    const prevQuantity = prevData.totalMeters.addedToSystem;

    if (!(prevQuantity === inSystemTotal)) {
      await updateRecordOnId({
        id: lastMetersQuantityId,
        quantity: inSystemTotal
      });
    }
  } else {
    await insertNewMeters({
      quantity: inSystemTotal,
      transformerSubstationId: id,
      date,
      type
    });
  }

  const lastNotInSystemId = await getLastNotInSystemId({
    transformerSubstationId: id,
    type
  });

  if (lastNotInSystemId) {
    const prevQuantity =
      prevData.totalMeters.quantity - prevData.totalMeters.addedToSystem;
    const actualQuantity = totalMeters - inSystemTotal;

    if (!(prevQuantity === actualQuantity)) {
      await updateNotInSystemOnId({
        id: lastNotInSystemId,
        quantity: actualQuantity
      });
    }
  } else {
    await insertNotInSystem({
      transformerSubstationId: id,
      quantity: totalMeters - inSystemTotal,
      date,
      type
    });
  }
}

async function handleYearMeters({
  id, type, yearTotal, inSystemYear, date, year
}: UpdateTotalYearMetersType,
  prevData: PrevDataType) {
  const lastYearId = await getLastYearId({
    transformerSubstationId: id,
    type,
    year
  });

  if (lastYearId) {
    const prevValues = prevData.totalYearMeters;
    const isEqual = yearTotal === prevValues.quantity
      && inSystemYear === prevValues.addedToSystem;

    if (!isEqual) {
      await updateLastYearOnId({
        id: lastYearId,
        quantity: yearTotal,
        added_to_system: inSystemYear
      });
    }
  } else {
    await insertYearMeters({
      quantity: yearTotal,
      added_to_system: inSystemYear,
      transformerSubstationId: id,
      date,
      type,
      year
    });
  }
}

async function handleMonthMeters({
  id, type, monthTotal, inSystemMonth, date, year, month
}: UpdateTotalMonthMetersType,
  prevData: PrevDataType
  ) {
  const lastMonthId = await getLastMonthId({
    transformerSubstationId: id,
    type,
    month,
    year
  });

  if (lastMonthId) {
    const prevValues = prevData.totalMonthMeters;
    const isEqual = monthTotal === prevValues.quantity
      && inSystemMonth === prevValues.addedToSystem;

    if (!isEqual) {
      await updateLastMonthOnId({
        id: lastMonthId,
        quantity: monthTotal,
        added_to_system: inSystemMonth
      });
    }
  } else {
    await insertMonthMeters({
      quantity: monthTotal,
      added_to_system: inSystemMonth,
      transformerSubstationId: id,
      type,
      date,
      year,
      month
    });
  }
}

async function handleFailedMeters({
  quantity, type, transformerSubstationId
}: FailedMetersValues) {
  const prevValue = await selectFailedMeters({ type, transformerSubstationId });

  if (prevValue) {
    const isEqual = prevValue === quantity;

    if (!isEqual) {
      await updateFailedMeters({
        quantity,
        type,
        transformerSubstationId
      });
    }
  } else {
    await insertFailedMeters({
      quantity, type, transformerSubstationId
    });
  }
}
