import type { ComponentPropsWithoutRef } from "react";

export default function Button({
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      className={`btn btn-xs sm:btn-sm md:btn-md lg:btn-lg ${className ?? ""}`}
    />
  );
}
