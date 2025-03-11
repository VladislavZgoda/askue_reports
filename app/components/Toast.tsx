type ToastPropType = {
  isVisible: boolean;
  message: string;
};

export default function Toast({ isVisible, message }: ToastPropType) {
  return (
    <div
      className={`toast toast-top toast-end
          ${isVisible ? "visible" : "invisible"}`}
    >
      <div className="alert alert-success h-14">
        <span>{message}</span>
      </div>
    </div>
  );
}
