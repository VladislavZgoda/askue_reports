import React from "react";

type ButtonContainer = {
  children: React.ReactNode;
  errors: boolean;
};

export default function BtnContainer({
  children, errors
}: ButtonContainer) {
  return (
    <div className={`h-full mt-auto ${errors ? 'mb-12' : ''}`}>
      {children}
    </div>
  );
}
