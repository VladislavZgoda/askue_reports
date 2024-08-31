import type { NameForInput } from "~/types";

export default function NumberInput({ 
  labelName,
  inputName,
  error
 }: NameForInput) {
  return (
    <label className="form-control w-full max-w-xs">
      <div className="label">
        <span className="label-text">
          {labelName}
        </span>
      </div>
      <input
        type="number"
        min='0'
        placeholder="0"
        className={`input w-full max-w-xs
          ${error ? 'input-error' : 'input-bordered'}`}
        aria-label={labelName}
        name={inputName}
      />
      {error && (
        <div className="label">
          <span className="label-text-alt text-error">{error}</span>
        </div>
      )}
    </label>
  );
}
