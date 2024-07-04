import { json } from "@remix-run/react";

export const checkNameConstrains = (
  error: unknown,
  name: string
) => {
  if (error instanceof Error
      && error.message.includes('name_unique')) {
      const error = `Наименование ${name} уже существует.`
      return json({ error, name });
    } else if (error instanceof Error
      && error.message.includes('character varying')) {
      const error = `Максимальная длина наименования - 8 символов.`
      return json({ error, name });
    }
};

export const checkNameLength = (
  name: string
) => {
  if (name.length < 3) {
    const error = 'Длина наименования должна быть не меньше 3 символов.'
    return json({ error, name });
  }
};