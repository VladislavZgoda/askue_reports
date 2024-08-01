import type {
  BalanceType,
  UpdateTotalMetersType
} from "~/types";
import {
  getLastRecordId,
  updateRecordOnId
} from "~/.server/db-queries/electricityMetersTable";

export default async function updatePrivateData(
  values: { [k: string]: FormDataEntryValue }
) {
  const handledValues = handleValues(values);
  await updateTotalMeters(handledValues);


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
    id: Number(values.id)
  };

  return handledValues;
}

async function updateTotalMeters({
  id, type, totalMeters, inSystemTotal
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
  }
}
