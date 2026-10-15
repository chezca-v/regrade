"use client";

import React from "react";
import { TopNav } from "../../components/TopNav";
import { Pill } from "../../components/Pill";

export default function SortingPage() {
  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          <div className="rg-titlebar">
            <div>
              <h1>Sorting & Bins</h1>
              <p className="rg-sub">Automated routing bins and conveyor dispatch.</p>
            </div>
          </div>

          <div className="rg-summary-grid">
            <div className="rg-card rg-card--pad rg-sumcard">
              <Pill color="green">Bin A: Resellable</Pill>
              <span className="rg-sumcard__value">27</span>
              <span className="rg-small rg-muted">Smartphones ready for refurbishing / resale</span>
            </div>
            <div className="rg-card rg-card--pad rg-sumcard">
              <Pill color="blue">Bin B: Recycle</Pill>
              <span className="rg-sumcard__value">15</span>
              <span className="rg-small rg-muted">Smartphones scheduled for material recovery</span>
            </div>
            <div className="rg-card rg-card--pad rg-sumcard">
              <Pill color="red">Bin C: Disposal</Pill>
              <span className="rg-sumcard__value">6</span>
              <span className="rg-small rg-muted">Hazardous or severely damaged units</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
