type ErrorProp = {
  error: string | undefined;
};

export default function SelectInput({ error }: ErrorProp) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">
        Выберете балансовую принадлежность
      </legend>
      <select
        className={`select select-lg ${error && "select-error"}`}
        aria-label="Выберете балансовую принадлежность"
        defaultValue="Выбрать группу"
        name="type"
      >
        <option disabled={true}>Выбрать группу</option>
        <option value="Быт">Быт</option>
        <option value="ЮР Sims">ЮР Sims</option>
        <option value="ЮР П2">ЮР П2</option>
        <option value="ОДПУ Sims">ОДПУ Sims</option>
        <option value="ОДПУ П2">ОДПУ П2</option>
      </select>
      {error && <p className="fieldset-label text-error">{error}</p>}
    </fieldset>
  );
}
