// Pill – small colored badge with a dot. Used everywhere.
import React from "react";

interface PillProps {
  color: "green" | "blue" | "red" | "amber";
  children: React.ReactNode;
}

export function Pill({ color, children }: PillProps) {
  return (
    <span className={`rg-pill rg-pill--${color}`}>
      <i className="rg-pill__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
