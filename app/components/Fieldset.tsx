import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"fieldset"> & {
  legend: string;
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
