import type { SubmitButtonValues } from "~/types";

export default function Button({
  buttonValue,
  isSubmitting,
}: SubmitButtonValues) {
  return (
    <button
      type={isSubmitting ? "button" : "submit"}
      className={`btn btn-outline btn-accent ${isSubmitting && "btn-active"}`}
      name="_action"
      value={buttonValue}
    >
      {isSubmitting && <span className="loading loading-spinner"></span>}
      {isSubmitting ? "Изменение..." : "Изменить данные"}
    </button>
  );
}
