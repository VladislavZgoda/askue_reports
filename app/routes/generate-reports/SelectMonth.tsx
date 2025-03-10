export default function SelectMonth() {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">
        Выберете месяц для заголовков таблиц Excel
      </legend>

      <select
        className="select select-xs sm:select-sm md:select-md lg:select-lg"
        aria-label="Выберете месяц для заголовков таблиц Excel"
        name="month"
        defaultValue="Выбрать месяц"
        required
      >
        <option disabled={true}>Выбрать месяц</option>
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
    </fieldset>
  );
}
