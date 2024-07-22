import type { SubmitButtonValues } from "~/types";

const SubmitButton = ({
  buttonValue,
  isSubmitting
}: SubmitButtonValues) => {
  return (
    <button
      className="btn btn-outline btn-success mt-auto"
      type='submit'
      name='_action'
      value={buttonValue}
    >
      {isSubmitting ? <span className="loading loading-spinner"></span> : null}
      {isSubmitting ? `Запись...` : `Добавить`}
    </button>
  );
};

export default SubmitButton;