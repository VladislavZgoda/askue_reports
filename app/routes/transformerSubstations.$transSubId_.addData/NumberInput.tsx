import type { NameForInput } from "~/types";

const NumberInput = ({ 
  labelName,
  inputName
 }: NameForInput) => {
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
        className="input input-bordered w-full max-w-xs"
        aria-label={labelName}
        name={inputName}
      />
    </label>
  );
};

export default NumberInput;