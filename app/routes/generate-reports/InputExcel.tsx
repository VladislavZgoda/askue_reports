import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"input"> & {
  error?: string | undefined;
};

export default function InputExcel({ error, ...props }: Props) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">
        Добавить данные из приложения №9
      </legend>
      <input
        {...props}
        className={`file-input input-xs sm:input-sm md:input-md lg:input-lg ${error ? "file-input-error" : "file-input-info"}`}
        aria-label="Добавить данные из приложения №9"
        type="file"
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
      {error && <p className="fieldset-label text-error">{error}</p>}
    </fieldset>
  );
}
