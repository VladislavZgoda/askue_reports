import type { ErrorProp } from "~/types";

const DateInput = ({
  error
}: ErrorProp) => {
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
          className={`input w-full max-w-xs
            ${error ? 'input-error' : 'input-bordered'}`}
          aria-label='Дата'
          name='date'
          defaultValue={todayDate()}
        />
        {error ? (
        <div className="label">
          <span className="label-text-alt text-error">{error}</span>
        </div>
      ) : null}
    </label>
  );
};

const todayDate = () => {
  const date = new Date().toLocaleDateString('en-CA');
  
  return date;
};

export default DateInput;