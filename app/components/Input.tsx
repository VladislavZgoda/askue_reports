import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"input"> & {
  error?: string | undefined;
  legend: string;
};

export default function Input({ className, error, legend, ...props }: Props) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{legend}</legend>
      <input
        {...props}
        className={`input input-xs sm:input-sm md:input-md lg:input-lg ${error && "input-error"} ${className}`}
      />
      {error && <p className="fieldset-label text-error">{error}</p>}
    </fieldset>
  );
}
