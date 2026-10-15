"use client";

import "./globals.css";
import React, { useState } from "react";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";
import { CheckIcon, ClockIcon, WarnIcon } from "./components/Icons";

export interface BinStatus {
  id: "Bin A" | "Bin B" | "Bin C";
  label: string;
  theme: "green" | "blue" | "red";
  current: number;
  capacity: number;
  percentage: number;
  lastSorted: string;
  nextCollection: string;
  alertText?: string;
}

export interface RoutingQueueItem {
  id: string;
  time: string;
  result: "resellable" | "recycle" | "disposal";
  resultLabel: string;
  suggestedBin: "Bin A" | "Bin B" | "Bin C";
  status: "Awaiting verification" | "Verified";
  hasWarning?: boolean;
}

const INITIAL_BINS: BinStatus[] = [
  {
    id: "Bin A",
    label: "Resellable / Refurbishable",
    theme: "green",
    current: 27,
    capacity: 60,
    percentage: 45,
    lastSorted: "14:32",
    nextCollection: "17:00",
  },
  {
    id: "Bin B",
    label: "Recycle / Safe Dismantling",
    theme: "blue",
    current: 15,
    capacity: 60,
    percentage: 25,
    lastSorted: "14:09",
    nextCollection: "17:00",
  },
  {
    id: "Bin C",
    label: "Disposal",
    theme: "red",
    current: 6,
    capacity: 20,
    percentage: 30,
    lastSorted: "13:57",
    nextCollection: "16:30",
    alertText: "Hazardous battery alert active",
  },
];

const INITIAL_QUEUE: RoutingQueueItem[] = [
  {
    id: "REG-20261013-008",
    time: "14:41",
    result: "resellable",
    resultLabel: "Resellable / Refurbishable",
    suggestedBin: "Bin A",
    status: "Awaiting verification",
  },
  {
    id: "REG-20261013-007",
    time: "14:32",
    result: "resellable",
    resultLabel: "Resellable / Refurbishable",
    suggestedBin: "Bin A",
    status: "Awaiting verification",
  },
  {
    id: "REG-20261013-004",
    time: "13:57",
    result: "disposal",
    resultLabel: "Disposal",
    suggestedBin: "Bin C",
    status: "Awaiting verification",
    hasWarning: true,
  },
];

export function SortingPage() {
  const [bins, setBins] = useState<BinStatus[]>(INITIAL_BINS);
  const [queue, setQueue] = useState<RoutingQueueItem[]>(INITIAL_QUEUE);

  function handleVerifyRoute(item: RoutingQueueItem) {
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: "Verified" } : q))
    );
    setBins((prev) =>
      prev.map((b) =>
        b.id === item.suggestedBin
          ? {
              ...b,
              current: b.current + 1,
              percentage: Math.min(100, Math.round(((b.current + 1) / b.capacity) * 100)),
            }
          : b
      )
    );
  }

  function handleEmptyBin(binId: string) {
    setBins((prev) =>
      prev.map((b) => (b.id === binId ? { ...b, current: 0, percentage: 0 } : b))
    );
  }

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          {/* Title bar */}
          <div className="rg-titlebar">
            <div>
              <h1>Sorting & Bins</h1>
              <p className="rg-sub">
                Bin capacity status and conveyor dispatch queue. Sample data, no hardware connected.
              </p>
            </div>
            <div className="rg-titlebar__actions">
              <button className="rg-btn">Collection schedule</button>
              <button className="rg-btn rg-btn--primary">＋ Manual sort</button>
            </div>
          </div>

          {/* 3 Bin Capacity Cards */}
          <section className="rg-bins-grid" aria-label="Sorting bins status">
            {bins.map((bin) => (
              <div
                key={bin.id}
                className={`rg-card rg-card--pad rg-bin-card rg-bin-card--${bin.theme}`}
              >
                <div className="rg-bin-head">
                  <div className="rg-bin-title">
                    <Pill color={bin.theme}>{bin.id}</Pill>
                    <h3>{bin.label}</h3>
                  </div>
                  <div className="rg-bin-capacity">
                    {bin.current} <small>/ {bin.capacity}</small>
                  </div>
                </div>

                <div className="rg-bin-progress-wrap">
                  <div className="rg-row rg-row--between rg-small rg-muted">
                    <span>Capacity utilized</span>
                    <strong>{bin.percentage}%</strong>
                  </div>
                  <div className="rg-bin-progress-bar">
                    <div
                      className={`rg-bin-progress-fill rg-bin-progress-fill--${bin.theme}`}
                      style={{ width: `${bin.percentage}%` }}
                    />
                  </div>
                </div>

                {bin.alertText && (
                  <div className="rg-row rg-row--gap6 rg-small" style={{ color: "var(--rg-danger)" }}>
                    <WarnIcon size={14} />
                    <strong>{bin.alertText}</strong>
                  </div>
                )}

                <div className="rg-bin-meta-grid">
                  <div className="rg-bin-meta-item">
                    <span className="rg-bin-meta-label">Last sorted</span>
                    <span className="rg-bin-meta-val">{bin.lastSorted}</span>
                  </div>
                  <div className="rg-bin-meta-item">
                    <span className="rg-bin-meta-label">Next collection</span>
                    <span className="rg-bin-meta-val">{bin.nextCollection}</span>
                  </div>
                </div>

                <div className="rg-bin-actions">
                  <button className="rg-btn" onClick={() => handleEmptyBin(bin.id)}>
                    Empty bin
                  </button>
                  <button className="rg-btn">Request collection</button>
                </div>
              </div>
            ))}
          </section>

          {/* Routing Queue Card */}
          <section className="rg-card rg-card--pad">
            <div className="rg-row rg-row--between">
              <div>
                <h3>Routing queue</h3>
                <p className="rg-small rg-muted">
                  Devices diagnosed and awaiting verification before conveyor routing.
                </p>
              </div>
              <span className="rg-badge rg-badge--neutral">
                {queue.filter((q) => q.status === "Awaiting verification").length} awaiting
              </span>
            </div>

            <div className="rg-table-wrap" style={{ marginTop: "14px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Time</th>
                    <th>Diagnostic Result</th>
                    <th>Suggested Bin</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Operator Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => {
                    const isAwaiting = item.status === "Awaiting verification";
                    const pillColor =
                      item.result === "resellable"
                        ? "green"
                        : item.result === "recycle"
                        ? "blue"
                        : "red";

                    return (
                      <tr key={item.id} className="rg-row-clickable">
                        <td>
                          <span className="rg-row rg-row--gap6">
                            {item.hasWarning && (
                              <span className="rg-warn-icon">
                                <WarnIcon size={14} />
                              </span>
                            )}
                            <strong>{item.id}</strong>
                          </span>
                        </td>
                        <td>{item.time}</td>
                        <td>
                          <Pill color={pillColor}>{item.resultLabel}</Pill>
                        </td>
                        <td>
                          <strong>{item.suggestedBin}</strong>
                        </td>
                        <td>
                          {isAwaiting ? (
                            <Pill color="amber">Awaiting verification</Pill>
                          ) : (
                            <span className="rg-row rg-row--gap6" style={{ color: "var(--rg-safe)" }}>
                              <CheckIcon size={14} /> Verified & Routed
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isAwaiting ? (
                            <div className="rg-row rg-row--gap8" style={{ justifyContent: "flex-end" }}>
                              <button
                                className="rg-btn rg-btn--primary"
                                onClick={() => handleVerifyRoute(item)}
                              >
                                Verify & route
                              </button>
                              <button className="rg-btn">Override</button>
                            </div>
                          ) : (
                            <span className="rg-small rg-muted">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default SortingPage;
