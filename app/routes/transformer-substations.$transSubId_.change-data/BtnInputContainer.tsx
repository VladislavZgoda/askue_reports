import React from "react";

type BtnInputContainerType = {
  children: React.ReactNode;
  errors: boolean;
};

export default function BtnInputContainer({
  children, errors
}: BtnInputContainerType) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-center">Вышедшие из строя</h2>
      </div>
      <div className={`flex flex-col h-full justify-between
          ${errors ? 'mb-12' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}
