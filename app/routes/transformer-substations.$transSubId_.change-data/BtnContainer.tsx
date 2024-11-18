import React from "react";

type BtnContainer = {
  children: React.ReactNode;
  errors: boolean;
};

export default function BtnContainer({
  children, errors
}: BtnContainer) {
  return (
    <div className={`h-full mt-auto ${errors ? 'mb-12' : ''}`}>
      {children}
    </div>
  );
}
