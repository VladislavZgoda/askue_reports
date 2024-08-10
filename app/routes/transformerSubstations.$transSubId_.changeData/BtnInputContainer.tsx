import type { BtnInputContainerType } from "~/types";

export default function BtnInputContainer({
  children
}: BtnInputContainerType) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-center">Вышедшие из строя</h2>
      </div>
      <div className="flex flex-col h-full justify-between">
        {children}
      </div>
    </div>
  );
}
