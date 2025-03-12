export default function Input({
  defValue,
  name,
  label,
  error = undefined,
  errors = false,
}: InputType) {
  return (
    <fieldset
      className={`fieldset
      ${errors && !error ? "mb-12" : "mb-1.5"}`}
    >
      <legend className="fieldset-legend">{label}</legend>

      <input
        type="number"
        placeholder="0"
        min="0"
        className={`input input-lg rounded-sm ${error && "input-error"}`}
        aria-label={label}
        name={name}
        defaultValue={defValue}
        required
      />
      {error && (
        <p className="fieldset-label text-error text-pretty w-72">{error}</p>
      )}
    </fieldset>
  );
}
