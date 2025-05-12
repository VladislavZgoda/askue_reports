import React from "react";

interface ButtonContainerProps {
  children: React.ReactNode;
  errors: boolean;
}

export default function BtnContainer({
  children,
  errors,
}: ButtonContainerProps) {
  return (
    <div className={`h-full mt-auto ${errors ? "mb-13" : "mb-2.5"}`}>
      {children}
    </div>
  );
}
