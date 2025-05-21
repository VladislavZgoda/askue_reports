import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"input"> & {
  error?: string | undefined;
};

export default function Input({ className, error, ...props }: Props) {
  return (
    <>
      <input
        {...props}
        className={`input input-xs sm:input-sm md:input-md lg:input-lg ${error && "input-error"} ${className}`}
      />
      {error && <p className="fieldset-label text-error">{error}</p>}
    </>
  );
}
