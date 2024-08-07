export default function validateInput(
  values: { [k: string]: FormDataEntryValue; }
) {
  const errors: { [k: string]: string } = {};
  const message = `Поле 'Количество новых ПУ' не должно быть меньше,
      чем поле 'Из них добавлено в систему'.`;

  if (Number(values.inSystemTotal) > Number(values.totalMeters)) {
    errors.totalDiff = message;
  }

  if (Number(values.inSystemYear) > Number(values.yearTotal)) {
    errors.yearDiff = message;
  }

  if (Number(values.inSystemMonth) > Number(values.monthTotal)) {
    errors.monthDiff = message;
  }

  return errors;
}
