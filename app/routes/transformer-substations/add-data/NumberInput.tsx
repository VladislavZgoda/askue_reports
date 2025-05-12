interface NumberInputProps {
  labelName: string;
  inputName: string;
  error: string | undefined;
}

export default function NumberInput({
  labelName,
  inputName,
  error,
}: NumberInputProps) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{labelName}</legend>

      <input
        type="number"
        min="0"
        placeholder="0"
        className={`input input-lg ${error && "input-error"}`}
        aria-label={labelName}
        name={inputName}
      />
      {error && <p className="fieldset-label text-error">{error}</p>}
    </fieldset>
  );
}
