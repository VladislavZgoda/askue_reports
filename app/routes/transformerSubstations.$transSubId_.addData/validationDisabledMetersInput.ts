export default function validateInputDisabledMeters (
  values: { [k: string]: FormDataEntryValue; }
) { 
  const errors: { [k: string]: string } = {};

  if (!values.disabledMeters) {
    errors.disabledMeters = 'Пустое поле, введите число.'
  }

  return errors;
}