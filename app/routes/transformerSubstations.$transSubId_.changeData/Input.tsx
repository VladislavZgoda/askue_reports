import type { InputType } from "~/types";

export default function Input({
  defValue, name, label, error=undefined
 }: InputType) {
  return (
    <label className="form-control w-full max-w-xs join-item">
      <div className="label">
        <span className="label-text">{label}</span>
      </div>
      <input
        type="number"
        placeholder="0"
        min="0"
        className={`input w-full max-w-xs
          ${error ? 'input-error' : 'input-bordered'}`}
        aria-label={label}
        name={name}
        defaultValue={defValue}
        required />
      {error ? (
        <div className="label">
          <span className="label-text-alt text-error">{error}</span>
        </div>
      ) : null}
    </label>
  );
}
