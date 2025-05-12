export default function validateInput(
  values: Record<string, FormDataEntryValue>,
) {
  const errors: Record<string, string> = {};

  if (Object.hasOwn(values, "inSystemTotal")) {
    checkInput(values, errors);
  }

  if (Object.hasOwn(values, "underVoltage")) {
    checkTechMetersInput(values, errors);
  }

  return errors;
}

function checkInput(
  values: Record<string, FormDataEntryValue>,
  errors: Record<string, string>,
) {
  const message = `Поле 'Количество ПУ' не должно быть меньше,
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
}

function checkTechMetersInput(
  values: Record<string, FormDataEntryValue>,
  errors: Record<string, string>,
) {
  const message = `Поле 'Количество ПУ' не должно быть меньше,
      чем поле 'Из них под напряжением'.`;

  if (Number(values.underVoltage) > Number(values.quantity)) {
    errors.techDiff = message;
  }
}
