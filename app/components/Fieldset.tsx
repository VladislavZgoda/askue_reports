import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Props = ComponentPropsWithoutRef<"fieldset"> & {
  legend: ReactNode;
};

export default function Fieldset({
  children,
  className,
  legend,
  ...props
}: Props) {
  return (
    <fieldset {...props} className={`fieldset ${className}`}>
      <legend className="fieldset-legend">{legend}</legend>
      {children}
    </fieldset>
  );
}
