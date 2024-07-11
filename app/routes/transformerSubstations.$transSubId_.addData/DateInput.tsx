const DateInput = () => {
  return (
    <label className="form-control w-full max-w-xs">
      <div className="label">
        <span className="label-text">
          Дата
        </span>
       </div>
        <input
          type="date"
          min='0'
          placeholder="0"
          className="input input-bordered w-full max-w-xs"
          aria-label='Дата'
          name='date'
          defaultValue={todayDate()}
        />
    </label>
  );
};

const todayDate = () => {
  const date = new Date().toLocaleDateString('en-CA');
  
  return date;
};

export default DateInput;