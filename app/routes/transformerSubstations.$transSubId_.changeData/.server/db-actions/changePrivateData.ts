import type {
  BalanceType,
  UpdateTotalMetersType,
  UpdateTotalYearMetersType,
  UpdateTotalMonthMetersType,
  FailedMetersValues
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

export default async function updatePrivateData(
  values: { [k: string]: FormDataEntryValue }
) {
  const handledValues = handleValues(values);
  await updateTotalMeters(handledValues);
  await updateYearMeters(handledValues);
  await updateMonthMeters(handledValues);
  await changeFailedMeters({
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
    isSystemMonth: Number(values.isSystemMonth),
    failedMeters: Number(values.failedMeters),
    id: Number(values.id),
    date,
    year,
    month
  };

  return handledValues;
}

async function updateTotalMeters({
  id, type, totalMeters, inSystemTotal, date
}: UpdateTotalMetersType) {
  const lastMetersQuantityId = await getLastRecordId({
    transformerSubstationId: id,
    type
  });

  if (lastMetersQuantityId) {
    await updateRecordOnId({
      id: lastMetersQuantityId,
      quantity: inSystemTotal
    });
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
    await updateNotInSystemOnId({
      id: lastNotInSystemId,
      quantity: totalMeters - inSystemTotal
    });
  } else {
    await insertNotInSystem({
      transformerSubstationId: id,
      quantity: totalMeters - inSystemTotal,
      date,
      type
    });
  }
}

async function updateYearMeters({
  id, type, yearTotal, inSystemYear, date, year
}: UpdateTotalYearMetersType) {
  const lastYearId = await getLastYearId({
    transformerSubstationId: id,
    type,
    year
  });

  if (lastYearId) {
    await updateLastYearOnId({
      id: lastYearId,
      quantity: yearTotal,
      added_to_system: inSystemYear
    });
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

async function updateMonthMeters({
  id, type, monthTotal, isSystemMonth, date, year, month
}: UpdateTotalMonthMetersType) {
  const lastMonthId = await getLastMonthId({
    transformerSubstationId: id,
    type,
    month,
    year
  });

  if (lastMonthId) {
    await updateLastMonthOnId({
      id: lastMonthId,
      quantity: monthTotal,
      added_to_system: isSystemMonth
    });
  } else {
    await insertMonthMeters({
      quantity: monthTotal,
      added_to_system: isSystemMonth,
      transformerSubstationId: id,
      type,
      date,
      year,
      month
    });
  }
}

async function changeFailedMeters({
  quantity, type, transformerSubstationId
}: FailedMetersValues) {
  const prevValue = await selectFailedMeters({ type, transformerSubstationId });

  if (prevValue) {
    await updateFailedMeters({
      quantity,
      type,
      transformerSubstationId
    });
  } else {
    await insertFailedMeters({
      quantity, type, transformerSubstationId
    });
  }
}
