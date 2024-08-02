import type {
  BalanceType,
  UpdateTotalMetersType
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

export default async function updatePrivateData(
  values: { [k: string]: FormDataEntryValue }
) {
  const handledValues = handleValues(values);
  await updateTotalMeters(handledValues);


}

function todayDate () {
  const date = new Date().toLocaleDateString('en-CA');

  return date;
}

function handleValues(
  values: { [k: string]: FormDataEntryValue }
) {
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
    date: todayDate()
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