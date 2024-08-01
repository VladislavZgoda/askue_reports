import type { BalanceType } from "~/types";
import { getLastRecordId } from "~/.server/db-queries/electricityMetersTable";

export default async function updatePrivateData(
  values: { [k: string]: FormDataEntryValue }
) {
  const handledValues = handleValues(values);
  const lastMetersQuantityId = await getLastRecordId({
    transformerSubstationId: handledValues.id,
    type: handledValues.type
  });
  console.log(lastMetersQuantityId);

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
