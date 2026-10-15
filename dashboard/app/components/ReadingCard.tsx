// ReadingCard – displays one sensor reading with progress bar
import React from "react";
import type { Reading } from "@/lib/rg-types";
import { CheckIcon, WarnIcon } from "./Icons";

interface ReadingCardProps {
  reading: Reading;
}

export function ReadingCard({ reading }: ReadingCardProps) {
  const { label, value, unit, pct, limit, status, tone } = reading;

  return (
    <div className="rg-reading">
      <span className="rg-reading__label">{label}</span>
      <span className="rg-reading__value">
        {value === null ? (
          <span className="rg-reading__dash" aria-label="Measuring" />
        ) : (
          value
        )}{" "}
        <small>{unit}</small>
      </span>
      <div className="rg-bar">
        <div
          className={`rg-bar__fill rg-bar__fill--${tone}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="rg-reading__limit">{limit}</span>
      <span className={`rg-reading__status rg-reading__status--${tone}`}>
        {tone === "ok" && <CheckIcon />}
        {(tone === "warn" || tone === "over") && <WarnIcon />}
        {status}
      </span>
    </div>
  );
}
