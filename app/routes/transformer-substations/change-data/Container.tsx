import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  heading: string;
}

export default function Container({ children, heading }: ContainerProps) {
  return (
    <div className="join join-vertical gap-2">
      <h2 className="join-item text-center">{heading}</h2>
      {children}
    </div>
  );
}
