import type { SubmitButtonValues } from "~/types";

const SubmitButton = ({
  buttonValue,
  isSubmitting
}: SubmitButtonValues) => {
  const btn = isSubmitting
    ? (
      <i
        className="btn btn-outline btn-success btn-active not-italic"
        role="button"
        tabIndex={0}>
        <span className="loading loading-spinner"></span>
        Запись...
      </i>
    )
    : (
      <button
        className="btn btn-outline btn-success mt-auto"
        type='submit'
        name='_action'
        value={buttonValue}>
        Добавить
      </button>
    );

  return btn;
};

export default SubmitButton;
