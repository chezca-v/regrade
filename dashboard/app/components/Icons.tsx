// Small SVG icon set. Add more as needed.
import React from "react";

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CheckIcon({ size = 16 }: { size?: number } = {}) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.2} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={1.8} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function WarnIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={1.8} aria-hidden="true">
      <path d="M12 3.5L2.5 20h19L12 3.5z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </svg>
  );
}

export function LaptopIcon() {
  return (
    <svg {...base} strokeWidth={1.8} aria-hidden="true">
      <rect x="5" y="5" width="14" height="10" rx="1.5" />
      <path d="M3 19h18" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...base} strokeWidth={1.8} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function SortIcon() {
  return (
    <svg {...base} strokeWidth={1.8} aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function PhoneIcon({ size = 16 }: { size?: number } = {}) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={1.8} aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path d="M11 18.3h2" />
    </svg>
  );
}

export function ChargerIcon({ size = 16 }: { size?: number } = {}) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={1.8} aria-hidden="true">
      <path d="M8 2.5v4M13 2.5v4M6 6.5h9a1.5 1.5 0 0 1 1.5 1.5v3A5.5 5.5 0 0 1 11 16.5a5.5 5.5 0 0 1-5.5-5.5V8A1.5 1.5 0 0 1 6 6.5Z" />
      <path d="M11 16.5V21" />
    </svg>
  );
}

export function PlusIcon({ size = 16 }: { size?: number } = {}) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.2} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
