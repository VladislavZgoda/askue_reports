import React from "react";

type ContainerType = {
  children: React.ReactNode;
  heading: string;
};

export default function Container({ children, heading }: ContainerType) {
  return (
    <div className="join join-vertical gap-2">
      <h2 className="join-item text-center">{heading}</h2>
      {children}
    </div>
  );
}
