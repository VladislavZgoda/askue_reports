type DateInputType = {
  labelText: string;
  inputName: string;
};

export default function DateInputWithoutDef({
  labelText,
  inputName,
}: DateInputType) {
  return (
    <label className="form-control w-full max-w-xs">
      <div className="label">
        <span className="label-text">{labelText}</span>
      </div>
      <input
        type="date"
        min="0"
        placeholder="0"
        className="input"
        aria-label={labelText}
        name={inputName}
      />
    </label>
  );
}
