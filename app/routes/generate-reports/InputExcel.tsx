export default function InputExcel() {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">
        Добавить данные из приложения №9
      </legend>
      <input
        className="file-input file-input-info"
        aria-label="Добавить данные из приложения №9"
        type="file"
        name="upload"
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
    </fieldset>
  );
}
