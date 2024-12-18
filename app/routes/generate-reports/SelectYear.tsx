import { todayDate, cutOutYear } from "~/utils/dateFunctions";

export default function SelectYear() {
  const year = cutOutYear(todayDate());

  return (
    <label className="form-control w-full max-w-xs">
      <div className="label">
        <span className="label-text">
          Выберете год для заголовков таблиц Excel
        </span>
      </div>
      <select
        className="select select-bordered"
        aria-label="Выберете год для заголовков таблиц Excel"
        defaultValue=""
        name="year"
        required
      >
        <option value="" disabled>
          Выбрать
        </option>
        <option>{year - 1}</option>
        <option>{year}</option>
      </select>
    </label>
  );
}
