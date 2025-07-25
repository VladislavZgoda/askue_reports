import { todayDate } from "~/utils/dateFunctions";

interface DateInputProps {
  labelText: string;
  inputName: string;
  defValue?: string;
}

export default function DateInput({
  labelText,
  inputName,
  defValue,
}: DateInputProps) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{labelText}</legend>
      <input
        type="date"
        min="0"
        placeholder="0"
        className="input input-xs sm:input-sm md:input-md lg:input-lg"
        aria-label={labelText}
        name={inputName}
        defaultValue={defValue ?? todayDate()}
        required
      />
    </fieldset>
  );
}
