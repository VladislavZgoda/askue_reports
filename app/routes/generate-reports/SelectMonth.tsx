export default function SelectMonth() {
  return (
    <label className="form-control w-full max-w-xs">
      <div className="label">
        <span className="label-text">
          Выберете месяц для заголовков таблиц Excel
        </span>
      </div>
      <select
        className="select select-bordered"
        aria-label="Выберете месяц для заголовков таблиц Excel"
        name="month"
        defaultValue=""
        required
      >
        <option value="" disabled>
          Выбрать
        </option>
        <option>Январь</option>
        <option>Февраль</option>
        <option>Март</option>
        <option>Апрель</option>
        <option>Май</option>
        <option>Июнь</option>
        <option>Июль</option>
        <option>Август</option>
        <option>Сентябрь</option>
        <option>Октябрь</option>
        <option>Ноябрь</option>
        <option>Декабрь</option>
      </select>
    </label>
  );
}
