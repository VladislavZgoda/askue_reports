const SelectInput = () => {
  return (
    <label className="form-control w-full max-w-xs">
      <div className="label">
        <span className="label-text">
          Выберете балансовую принадлежность
        </span>
      </div>
      <select
        className="select select-bordered"
        aria-label='Выберете балансовую принадлежность'
        defaultValue={'DEFAULT'}
        name='type'
      >
        <option value='DEFAULT' disabled>Выбрать</option>
        <option value='Быт'>Быт</option>
        <option value='ЮР Sims'>ЮР Sims</option>
        <option value='ЮР П2'>ЮР П2</option>
        <option value='ОДПУ Sims'>ОДПУ Sims</option>
        <option value='ОДПУ П2'>ОДПУ П2</option>
      </select>
    </label>
  );
};

export default SelectInput;
