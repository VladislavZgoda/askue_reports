type DateInputType = {
  labelText: string;
  inputName: string;
};

export default function DateInputWithoutDef({
  labelText,
  inputName,
}: DateInputType) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{labelText}</legend>
      <input
        type="date"
        min="0"
        placeholder="0"
        className="input"
        aria-label={labelText}
        name={inputName}
      />
    </fieldset>
  );
}
