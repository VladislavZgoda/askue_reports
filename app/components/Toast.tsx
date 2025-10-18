export default function Toast({ message }: { message: string }) {
  return (
    <div className="toast toast-top toast-end">
      <div className="alert alert-success h-14">
        <span>{message}</span>
      </div>
    </div>
  );
}
