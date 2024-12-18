export default function InputExcel() {
  return (
    <label className="form-control w-full max-w-xs">
      <div className="label">
        <span className="label-text">Добавить данные из приложения №9</span>
      </div>
      <input
        className="file-input file-input-bordered file-input-info w-full max-w-xs"
        aria-label="Добавить данные из приложения №9"
        type="file"
        name="upload"
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
    </label>
  );
}
