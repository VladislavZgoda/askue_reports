import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"select"> & {
  error?: string | undefined;
  label: string;
};

export default function Select({ children, error, label, ...props }: Props) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      <select
        {...props}
        className={`select select-xs sm:select-sm md:select-md lg:select-lg ${error && "select-error"}`}
      >
        {children}
      </select>
      {error && <p className="fieldset-label text-error">{error}</p>}
    </fieldset>
  );
}
