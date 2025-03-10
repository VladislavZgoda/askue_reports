import { todayDate } from "~/utils/dateFunctions";

type DateInputType = {
  labelText: string;
  inputName: string;
  defValue?: string;
};

export default function DateInput({
  labelText,
  inputName,
  defValue,
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
        defaultValue={defValue || todayDate()}
        required
      />
    </fieldset>
  );
}
