import type { SubmitButtonValues } from "~/types";

export default function Button({
  buttonValue,
  isSubmitting
}: SubmitButtonValues) {
  const btn = isSubmitting
    ? (
      <i
        className="btn btn-outline btn-accent btn-active not-italic"
        role="button"
        tabIndex={0}>
        <span className="loading loading-spinner"></span>
        Изменение...
      </i>
    )
    : (
      <button
        type="submit"
        className="btn btn-outline btn-accent"
        name="_action"
        value={buttonValue}>
        Изменить данные
      </button >
    );

  return btn;
}
