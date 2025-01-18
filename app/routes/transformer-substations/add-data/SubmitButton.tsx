export default function SubmitButton({
  buttonValue,
  isSubmitting,
}: SubmitButtonValues) {
  return (
    <button
      className={`btn btn-outline btn-success mt-auto ${isSubmitting && "btn-active"}`}
      type={isSubmitting ? "button" : "submit"}
      name="_action"
      value={buttonValue}
    >
      {isSubmitting && <span className="loading loading-spinner"></span>}
      {isSubmitting ? "Запись..." : "Добавить"}
    </button>
  );
}
