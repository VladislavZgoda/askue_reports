export default function validateInputNewMeters(values: {
  [k: string]: FormDataEntryValue;
}) {
  const errors: { [k: string]: string } = {};
  if (!values.newMeters) {
    errors.newMeters = "Пустое поле, введите число.";
  }

  if (!values.addedToSystem) {
    errors.addedToSystem = "Пустое поле, введите число.";
  }

  if (!values.type) {
    errors.type = "Пустое поле, выберете балансовую принадлежность.";
  }

  if (Number(values.addedToSystem) > Number(values.newMeters)) {
    errors.difference = `Поле 'Количество новых ПУ' не должно быть меньше,
      чем поле 'Из них добавлено в систему'.`;
  }

  return errors;
}
