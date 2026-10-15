"use client";

import "./globals.css";
import React, { useState } from "react";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";
import { ReadingCard } from "./components/ReadingCard";
import { CheckIcon, ClockIcon } from "./components/Icons";
import {
  STAGES,
  CURRENT_READINGS,
  GRADING_RULES,
  QUEUE,
} from "@/lib/rg-data";
import { RESULT_COLOR } from "@/lib/rg-helpers";
import type { Stage, QueueDevice } from "@/lib/rg-types";

function DeviceIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

export function DiagnosticsPage() {
  const [stages] = useState<Stage[]>(STAGES);
  const [queue] = useState<QueueDevice[]>(QUEUE);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          {/* Title bar */}
          <div className="rg-titlebar">
            <div>
              <h1>Diagnostics</h1>
              <p className="rg-sub">
                Current test, grading rules and the device queue. Sample data, no hardware connected.
              </p>
            </div>
            <div className="rg-titlebar__actions">
              <button className="rg-btn">View reference weights</button>
              <button className="rg-btn rg-btn--primary">
                ＋ New diagnostic test
              </button>
            </div>
          </div>

          {/* Current test card */}
          <section className="rg-card rg-card--pad rg-current-test">
            <div className="rg-row rg-row--between rg-current-test__header">
              <div>
                <h3>Current test</h3>
                <p className="rg-small rg-muted">
                  REG-20261013-008, Smartphone, Model X12 (placeholder). Weight 166 g, 1% under nominal.
                </p>
              </div>
              <span className="rg-badge rg-badge--neutral">
                In progress: Electrical check
              </span>
            </div>

            {/* 5-step stepper */}
            <div
              className="rg-stages-grid"
              role="list"
              aria-label="Diagnostic test stages"
            >
              {stages.map((stage) => {
                const isDone = stage.state === "done";
                const isActive = stage.state === "active";
                return (
                  <div
                    key={stage.label}
                    role="listitem"
                    className={`rg-stage-card${
                      isDone
                        ? " rg-stage-card--done"
                        : isActive
                        ? " rg-stage-card--active"
                        : ""
                    }`}
                  >
                    <div className="rg-stage-card__icon">
                      {isDone ? (
                        <CheckIcon size={16} />
                      ) : (
                        <ClockIcon size={16} />
                      )}
                    </div>
                    <div className="rg-stage-card__text">
                      <strong className="rg-stage-card__label">
                        {stage.label}
                      </strong>
                      <span className="rg-stage-card__sub">{stage.sub}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4 readings cards */}
            <div className="rg-readings-grid">
              {CURRENT_READINGS.map((reading) => (
                <ReadingCard key={reading.label} reading={reading} />
              ))}
            </div>
          </section>

          {/* Bottom split: Grading rules + Device queue */}
          <div className="rg-diag-split">
            {/* Left: How each result is graded */}
            <section className="rg-card rg-card--pad rg-diag-split__rules">
              <h3>How each result is graded</h3>
              <p className="rg-small rg-muted">
                The diagnostic result follows these limits. An operator verifies it before routing.
              </p>

              <div className="rg-table-wrap">
                <table className="rg-rules-table">
                  <thead>
                    <tr>
                      <th>Classification</th>
                      <th>Weight</th>
                      <th>Casing swell</th>
                      <th>Temp rise</th>
                      <th>Charging draw</th>
                      <th>Bin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRADING_RULES.map((rule) => {
                      const color = RESULT_COLOR[rule.resultKey] as
                        | "green"
                        | "blue"
                        | "red";
                      return (
                        <tr key={rule.resultKey}>
                          <td>
                            <Pill color={color}>{rule.label}</Pill>
                          </td>
                          <td>{rule.weight}</td>
                          <td>{rule.swell}</td>
                          <td>{rule.tempRise}</td>
                          <td>{rule.chargeDraw}</td>
                          <td className="rg-bin-cell">{rule.bin}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="rg-rules-footnote">
                Battery ESR limits are placeholders until the team confirms them.
              </p>
            </section>

            {/* Right: Device queue */}
            <section className="rg-card rg-card--pad rg-diag-split__queue">
              <div className="rg-row rg-row--between">
                <div>
                  <h3>Device queue</h3>
                  <p className="rg-small rg-muted">
                    {queue.length} devices waiting for a test
                  </p>
                </div>
              </div>

              <div className="rg-queue-list" role="list">
                {queue.map((item) => {
                  const isSelected = selectedQueueId === item.id;
                  return (
                    <div
                      key={item.id}
                      role="listitem"
                      tabIndex={0}
                      className={`rg-queue-item${
                        isSelected ? " rg-queue-item--selected" : ""
                      }`}
                      onClick={() => setSelectedQueueId(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedQueueId(item.id);
                        }
                      }}
                    >
                      <div className="rg-queue-item__icon">
                        <DeviceIcon />
                      </div>
                      <div className="rg-queue-item__info">
                        <strong>{item.id}</strong>
                        <span>{item.model}</span>
                      </div>
                      <span className="rg-badge rg-badge--neutral">
                        Waiting
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DiagnosticsPage;
