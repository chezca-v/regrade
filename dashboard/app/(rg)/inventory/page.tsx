"use client";

import React, { useState } from "react";
import { TopNav } from "../../components/TopNav";
import { Pill } from "../../components/Pill";
import { SearchIcon } from "../../components/Icons";
import { DEVICES } from "@/lib/rg-data";
import { RESULT_COLOR, RESULT_LABEL, DECISION_LABEL } from "@/lib/rg-helpers";
import type { Device } from "@/lib/rg-types";

export default function InventoryPage() {
  const [devices] = useState<Device[]>(DEVICES);
  const [query, setQuery] = useState("");

  const filtered = devices.filter(
    (d) =>
      d.id.toLowerCase().includes(query.toLowerCase()) ||
      d.model.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          <div className="rg-titlebar">
            <div>
              <h1>Inventory</h1>
              <p className="rg-sub">Processed and incoming smartphone inventory across all bins.</p>
            </div>
            <div className="rg-titlebar__actions">
              <button className="rg-btn">Export CSV</button>
              <button className="rg-btn rg-btn--primary">＋ Add device</button>
            </div>
          </div>

          <section className="rg-card rg-card--pad">
            <div className="rg-toolbar">
              <div className="rg-row rg-row--gap8 rg-row--full">
                <label className="rg-search" htmlFor="inv-search">
                  <SearchIcon />
                  <input
                    id="inv-search"
                    placeholder="Search inventory by ID or model"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="rg-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Model</th>
                    <th>Diagnostic Result</th>
                    <th>Decision / Route</th>
                    <th>Time Logged</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="rg-row-clickable">
                      <td><strong>{d.id}</strong></td>
                      <td>{d.model}</td>
                      <td>
                        <Pill color={RESULT_COLOR[d.diagnosticResult] as "green" | "blue" | "red"}>
                          {RESULT_LABEL[d.diagnosticResult]}
                        </Pill>
                      </td>
                      <td>
                        {d.processingDecision === "awaiting" ? (
                          <Pill color="amber">Awaiting verification</Pill>
                        ) : (
                          <Pill color="green">{DECISION_LABEL[d.processingDecision]}</Pill>
                        )}
                      </td>
                      <td>{d.time}</td>
                      <td>{d.nominalWeight} g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
