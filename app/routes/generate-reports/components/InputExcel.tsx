import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"input"> & {
  error?: string | undefined;
};

export default function InputExcel({ error, className, ...props }: Props) {
  return (
    <>
      <input
        {...props}
        className={`file-input input-xs sm:input-sm md:input-md lg:input-lg ${error ? "file-input-error" : "file-input-info"} ${className}`}
        aria-label="Добавить данные из приложения №9"
        type="file"
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
      {error && <p className="fieldset-label text-error">{error}</p>}
    </>
  );
}
