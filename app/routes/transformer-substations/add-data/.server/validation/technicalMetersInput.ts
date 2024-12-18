export default function validateInputTechnicalMeters(values: {
  [k: string]: FormDataEntryValue;
}) {
  const errors: { [k: string]: string } = {};

  if (!values.techMeters) {
    errors.techMeters = "Пустое поле, введите число.";
  }

  if (!values.underVoltage) {
    errors.underVoltage = "Пустое поле, введите число.";
  }

  if (Number(values.underVoltage) > Number(values.techMeters)) {
    errors.techDif = `Поле 'Количество Техучетов' не должно быть меньше,
      чем поле 'Из них под напряжением'.`;
  }

  return errors;
}
