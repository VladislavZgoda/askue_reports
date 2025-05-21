import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"select"> & {
  error?: string | undefined;
};

export default function Select({
  className,
  children,
  error,
  ...props
}: Props) {
  return (
    <>
      <select
        {...props}
        className={`select select-xs sm:select-sm md:select-md lg:select-lg ${error && "select-error"} ${className}`}
      >
        {children}
      </select>
      {error && <p className="fieldset-label text-error">{error}</p>}
    </>
  );
}
