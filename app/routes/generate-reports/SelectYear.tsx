import type { ComponentPropsWithoutRef } from "react";
import { todayDate, cutOutYear } from "~/utils/dateFunctions";

type Props = ComponentPropsWithoutRef<"select"> & {
  error?: string | undefined;
};

export default function SelectYear({ error, ...props }: Props) {
  const year = cutOutYear(todayDate());

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">
        Выберете год для заголовков таблиц Excel
      </legend>

      <select
        {...props}
        className="select select-xs sm:select-sm md:select-md lg:select-lg"
        aria-label="Выберете год для заголовков таблиц Excel"
        defaultValue="Выбрать год"
      >
        <option disabled={true}>Выбрать год</option>
        <option>{year - 1}</option>
        <option>{year}</option>
      </select>
      {error && <p className="fieldset-label text-error">{error}</p>}
    </fieldset>
  );
}
