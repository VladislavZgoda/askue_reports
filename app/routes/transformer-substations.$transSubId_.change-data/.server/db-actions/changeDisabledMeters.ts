import { 
  selectDisabledLegalMeters,
  insertDisabledLegalMeters,
  updateDisabledLegalMeters
} from "~/.server/db-queries/disabledLegalMetersTable";

export default async function changeDisabledMeters(
  values: { [k: string]: FormDataEntryValue }
) {
  const {
    quantity,
    transformerSubstationId
  } = handleValues(values);

  const prevValue = await selectDisabledLegalMeters(
    transformerSubstationId);

  if (prevValue !== undefined) {
    const isEqual = prevValue ===quantity;

    if (!isEqual) {
      await updateDisabledLegalMeters({
        quantity,
        transformerSubstationId
      });
    }
  } else {
    await insertDisabledLegalMeters({
      quantity,
      transformerSubstationId
    });
  }
}

function handleValues(
  values: { [k: string]: FormDataEntryValue }
) {
  return {
    quantity: Number(values.quantity),
    transformerSubstationId: Number(values.id)
  };
}