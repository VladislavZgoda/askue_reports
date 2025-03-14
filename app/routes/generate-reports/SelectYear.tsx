import { todayDate, cutOutYear } from "~/utils/dateFunctions";

export default function SelectYear() {
  const year = cutOutYear(todayDate());

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">
        Выберете год для заголовков таблиц Excel
      </legend>

      <select
        className="select select-xs sm:select-sm md:select-md lg:select-lg"
        aria-label="Выберете год для заголовков таблиц Excel"
        defaultValue="Выбрать год"
        name="year"
        required
      >
        <option disabled={true}>Выбрать год</option>
        <option>{year - 1}</option>
        <option>{year}</option>
      </select>
    </fieldset>
  );
}
