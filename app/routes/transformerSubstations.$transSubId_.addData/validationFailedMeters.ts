export default function validateInputFailedMeters (
  values: { [k: string]: FormDataEntryValue; }
) {
  const errors: { [k: string]: string } = {};

  if (!values.brokenMeters) {
    errors.brokenMeters = 'Пустое поле, введите число.'
  }

  if (!values.type) {
    errors.failedType = 'Пустое поле, выберете балансовую принадлежность.'
  }

  return errors;
}