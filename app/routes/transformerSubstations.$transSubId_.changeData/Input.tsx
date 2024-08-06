import type { InputType } from "~/types";

export default function Input({
  defValue, name, label
 }: InputType) {
  return (
    <label className="form-control w-full max-w-xs join-item">
      <div className="label">
        <span className="label-text">{label}</span>
      </div>
      <input
        type="number"
        placeholder="0"
        className="input input-bordered w-full max-w-xs"
        aria-label={label}
        name={name}
        defaultValue={defValue}
      />
    </label>
  );
}
