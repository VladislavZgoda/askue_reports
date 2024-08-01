import type { BalanceType } from "~/types";

export default async function updatePrivateData(
  values: { [k: string]: FormDataEntryValue }
) {
  const handledValues = handleValues(values);
  console.log(handledValues);

}

function handleValues(
  values: { [k: string]: FormDataEntryValue }
) {
  const handledValues = {
    type: 'БЫТ' as BalanceType,
    totalMeters: Number(values.totalMeters),
    inSystemTotal: Number(values.inSystemTotal),
    yearTotal: Number(values.yearTotal),
    inSystemYear: Number(values.inSystemYear),
    monthTotal: Number(values.monthTotal),
    isSystemMonth: Number(values.isSystemMonth),
    failedMeters: Number(values.failedMeters)
  };

  return handledValues;
}
