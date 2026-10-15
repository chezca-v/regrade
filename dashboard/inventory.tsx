"use client";

import React, { useState, useMemo } from "react";

// --- Types ---
export type TabCategory =
  | "All devices"
  | "Resellable"
  | "Recycle"
  | "Disposal"
  | "Needs verification";

export type DiagnosticResultType =
  | "Resellable / Refurbishable"
  | "Recycle / Safe Dismantling"
  | "Disposal";

export type ProcessingDecisionType =
  | "Awaiting verification"
  | "Verified, Bin A"
  | "Verified, Bin B"
  | "Verified, Bin C";

export interface AuditRecord {
  id: string;
  time: string;
  esr: string;
  powerDraw: string;
  tempRise: string;
  swell: string;
  diagnosticResult: DiagnosticResultType;
  processingDecision: ProcessingDecisionType;
  hasWarning?: boolean;
}

// --- Hardcoded Mock Data (Exact from UI screenshot) ---
export const mockInventoryData: AuditRecord[] = [
  {
    id: "REG-20261013-012",
    time: "15:04",
    esr: "128 mΩ",
    powerDraw: "672 mA",
    tempRise: "9.7 °C",
    swell: "0.5 mm",
    diagnosticResult: "Resellable / Refurbishable",
    processingDecision: "Awaiting verification",
  },
  {
    id: "REG-20261013-011",
    time: "14:51",
    esr: "126 mΩ",
    powerDraw: "701 mA",
    tempRise: "9.1 °C",
    swell: "0.4 mm",
    diagnosticResult: "Resellable / Refurbishable",
    processingDecision: "Verified, Bin A",
  },
  {
    id: "REG-20261013-010",
    time: "14:44",
    esr: "—",
    powerDraw: "8 mA",
    tempRise: "0.9 °C",
    swell: "2.8 mm",
    diagnosticResult: "Recycle / Safe Dismantling",
    processingDecision: "Verified, Bin B",
  },
  {
    id: "REG-20261013-009",
    time: "14:37",
    esr: "133 mΩ",
    powerDraw: "688 mA",
    tempRise: "12.2 °C",
    swell: "0.7 mm",
    diagnosticResult: "Resellable / Refurbishable",
    processingDecision: "Verified, Bin A",
  },
  {
    id: "REG-20261013-007",
    time: "14:32",
    esr: "142 mΩ",
    powerDraw: "640 mA",
    tempRise: "11.8 °C",
    swell: "0.6 mm",
    diagnosticResult: "Resellable / Refurbishable",
    processingDecision: "Awaiting verification",
  },
  {
    id: "REG-20261013-006",
    time: "14:21",
    esr: "390 mΩ",
    powerDraw: "1,240 mA",
    tempRise: "18.4 °C",
    swell: "3.9 mm",
    diagnosticResult: "Disposal",
    processingDecision: "Verified, Bin C",
  },
  {
    id: "REG-20261013-005",
    time: "14:09",
    esr: "—",
    powerDraw: "12 mA",
    tempRise: "1.1 °C",
    swell: "2.4 mm",
    diagnosticResult: "Recycle / Safe Dismantling",
    processingDecision: "Verified, Bin B",
  },
  {
    id: "REG-20261013-004",
    time: "13:57",
    esr: "412 mΩ",
    powerDraw: "980 mA",
    tempRise: "16.2 °C",
    swell: "4.1 mm",
    diagnosticResult: "Disposal",
    processingDecision: "Awaiting verification",
    hasWarning: true,
  },
  {
    id: "REG-20261013-003",
    time: "13:44",
    esr: "118 mΩ",
    powerDraw: "710 mA",
    tempRise: "8.3 °C",
    swell: "0.3 mm",
    diagnosticResult: "Resellable / Refurbishable",
    processingDecision: "Verified, Bin A",
  },
  {
    id: "REG-20261013-002",
    time: "13:31",
    esr: "121 mΩ",
    powerDraw: "695 mA",
    tempRise: "8.8 °C",
    swell: "0.2 mm",
    diagnosticResult: "Resellable / Refurbishable",
    processingDecision: "Verified, Bin A",
  },
];

// --- Icons ---
function BrandMarkIcon() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#163d2d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" />
        <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" />
        <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" />
        <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" />
      </svg>
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#55645c"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#55645c"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function WarningTriangleIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#c2410c"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function GreenCheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "-1px", marginRight: 5 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9ca7a0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6b7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// --- Main Component ---
export function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<TabCategory>("All devices");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("Last 7 days");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Filtered rows
  const filteredData = useMemo(() => {
    return mockInventoryData.filter((record) => {
      // Tab filter
      if (activeTab === "Resellable" && record.diagnosticResult !== "Resellable / Refurbishable") {
        return false;
      }
      if (activeTab === "Recycle" && record.diagnosticResult !== "Recycle / Safe Dismantling") {
        return false;
      }
      if (activeTab === "Disposal" && record.diagnosticResult !== "Disposal") {
        return false;
      }
      if (activeTab === "Needs verification" && record.processingDecision !== "Awaiting verification") {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!record.id.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f3f5f3] text-[#15271f] font-sans antialiased pb-12">
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="w-full bg-[#f3f5f3] pt-4 px-6 md:px-10 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <BrandMarkIcon />
            <div>
              <div className="font-extrabold text-[17px] text-[#15271f] tracking-tight leading-none">
                ReGrade
              </div>
              <div className="text-[10px] text-[#86948d] font-medium tracking-normal mt-1 leading-none">
                E-waste diagnostics
              </div>
            </div>
          </div>

          {/* Center Links (Pill Container) */}
          <nav className="hidden lg:flex items-center bg-white rounded-full px-2 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-[#e8ece9]">
            <a
              href="#overview"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Overview
            </a>
            <a
              href="#diagnostics"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Diagnostics
            </a>
            <a
              href="#inventory"
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-[#163d2d] rounded-full shadow-xs"
            >
              Inventory
            </a>
            <a
              href="#sorting"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Sorting
            </a>
            <a
              href="#safety-alerts"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full flex items-center gap-1"
            >
              Safety alerts{" "}
              <span className="text-[#dc2626] font-semibold text-[13px] ml-0.5">2</span>
            </a>
            <a
              href="#reports"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Reports
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-black/5 text-[#55645c] transition-colors"
              aria-label="Notifications"
            >
              <BellIcon />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-black/5 text-[#55645c] transition-colors"
              aria-label="Settings and Filters"
            >
              <SlidersIcon />
            </button>
            <div
              className="w-8 h-8 rounded-full bg-[#dcf0e4] text-[#194b36] font-bold text-[11px] flex items-center justify-center tracking-wider cursor-pointer select-none"
              title="Operator Profile"
            >
              OP
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-start gap-2 overflow-x-auto py-2.5 mt-2">
          {["Overview", "Diagnostics", "Inventory", "Sorting", "Safety alerts 2", "Reports"].map(
            (tab) => {
              const isActive = tab === "Inventory";
              return (
                <button
                  key={tab}
                  type="button"
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium ${
                    isActive
                      ? "bg-[#163d2d] text-white"
                      : "bg-white text-[#46564e] border border-[#e8ece9]"
                  }`}
                >
                  {tab === "Safety alerts 2" ? (
                    <>
                      Safety alerts{" "}
                      <span className="text-[#dc2626] font-bold ml-0.5">2</span>
                    </>
                  ) : (
                    tab
                  )}
                </button>
              );
            }
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full px-6 md:px-10 max-w-[1440px] mx-auto mt-8">
        {/* 2. PAGE HEADER & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] md:text-[28px] font-extrabold text-[#15271f] tracking-tight leading-tight">
              Inventory
            </h1>
            <p className="text-[13px] text-[#718077] mt-1">
              Every tested device and where it is going. Sample data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] text-[13px] font-semibold px-4 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors cursor-pointer"
            >
              Export report
            </button>
            <button
              type="button"
              className="bg-[#246e4c] hover:bg-[#1d5c3f] text-white text-[13px] font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="text-[16px] font-normal leading-none">+</span>
              New diagnostic test
            </button>
          </div>
        </div>

        {/* 3. KPI SUMMARY CARDS (GRID OF 4) */}
        <section
          aria-label="Summary KPIs"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
        >
          {/* Card 1: Primary (Dark green) */}
          <div className="bg-[#194e37] text-white rounded-xl p-5 shadow-[0_2px_8px_rgba(25,78,55,0.12)] flex flex-col justify-between min-h-[136px]">
            <div className="text-[12px] font-medium text-white/80">Devices on record</div>
            <div className="text-[34px] font-extrabold tracking-tight text-white leading-none my-1">
              1,284
            </div>
            <div className="text-[11px] text-white/70">Since January 2026</div>
          </div>

          {/* Card 2: Awaiting verification */}
          <div className="bg-white border border-[#e6eae7] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[136px]">
            <div className="text-[12px] font-medium text-[#6c7d74]">Awaiting verification</div>
            <div className="text-[34px] font-extrabold tracking-tight text-[#15271f] leading-none my-1">
              6
            </div>
            <div className="text-[11px] text-[#8e9c94]">Diagnosed, not yet routed</div>
          </div>

          {/* Card 3: Resellable / Refurbishable */}
          <div className="bg-white border border-[#e6eae7] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[136px]">
            <div className="text-[12px] font-medium text-[#6c7d74]">Resellable / Refurbishable</div>
            <div className="text-[34px] font-extrabold tracking-tight text-[#15271f] leading-none my-1">
              612
            </div>
            <div className="text-[11px] text-[#8e9c94]">Bin A, 48% of devices</div>
          </div>

          {/* Card 4: Disposal */}
          <div className="bg-white border border-[#e6eae7] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[136px]">
            <div className="text-[12px] font-medium text-[#6c7d74]">Disposal</div>
            <div className="text-[34px] font-extrabold tracking-tight text-[#dc2626] leading-none my-1">
              38
            </div>
            <div className="text-[11px] text-[#8e9c94]">Bin C, handle with care</div>
          </div>
        </section>

        {/* 4. AUDIT LOG DATA TABLE */}
        <section
          aria-label="Audit Log"
          className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] mt-6 overflow-hidden"
        >
          {/* Header & Description */}
          <div className="p-6 pb-0">
            <h2 className="text-[17px] font-extrabold text-[#15271f] tracking-tight">Audit log</h2>
            <p className="text-[12px] text-[#7f8f86] mt-0.5">
              Newest first. Select a row to open the device detail.
            </p>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-5 pb-5 border-b border-[#f0f3f1]">
              {/* Segmented Filter Tabs */}
              <div className="bg-[#eef2ef] p-1 rounded-xl flex items-center gap-1 self-start overflow-x-auto max-w-full">
                {(
                  [
                    "All devices",
                    "Resellable",
                    "Recycle",
                    "Disposal",
                    "Needs verification",
                  ] as TabCategory[]
                ).map((tab) => {
                  const isSelected = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3.5 py-1.5 text-[12px] rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? "bg-white text-[#15271f] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                          : "text-[#67776f] hover:text-[#15271f] font-medium"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Right Toolbar Controls: Dropdown & Search */}
              <div className="flex items-center gap-3">
                {/* Time Range Dropdown */}
                <div className="relative">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="appearance-none bg-white border border-[#dce2de] hover:border-[#c5cdc7] text-[#34443b] text-[12px] font-medium pl-3 pr-8 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer outline-none transition-colors"
                  >
                    <option>Last 7 days</option>
                    <option>Last 24 hours</option>
                    <option>Last 30 days</option>
                    <option>All time</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#75847c]">
                    <ChevronDownIcon />
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none text-[#8e9c94]">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search device ID"
                    className="w-52 md:w-64 bg-white border border-[#dce2de] focus:border-[#246e4c] text-[#15271f] placeholder:text-[#93a199] text-[12px] pl-8 pr-3 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="border-b border-[#f0f3f1] text-[11px] font-semibold text-[#839189]">
                  <th className="py-3 px-6 font-semibold">Device ID</th>
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold">ESR</th>
                  <th className="py-3 px-4 font-semibold">Power draw</th>
                  <th className="py-3 px-4 font-semibold">Temp rise</th>
                  <th className="py-3 px-4 font-semibold">Swell</th>
                  <th className="py-3 px-6 font-semibold">Diagnostic result</th>
                  <th className="py-3 px-6 font-semibold">Processing decision</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8e9c94] text-[13px]">
                      No devices match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => {
                    const isSelected = selectedRowId === row.id;

                    // Row background styling:
                    // REG-20261013-004 has faint red/orange warning background #fdf5ef
                    const rowBgClass = row.hasWarning
                      ? "bg-[#fdf4ee] hover:bg-[#faeee6]"
                      : isSelected
                      ? "bg-[#f3f7f4]"
                      : "bg-white hover:bg-[#f9faf9]";

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                        className={`border-b border-[#f1f4f2] text-[12px] text-[#3e4f45] transition-colors cursor-pointer ${rowBgClass}`}
                      >
                        {/* Device ID */}
                        <td className="py-3.5 px-6 font-bold text-[#15271f] whitespace-nowrap">
                          {row.hasWarning && <WarningTriangleIcon />}
                          <span>{row.id}</span>
                        </td>

                        {/* Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                          {row.time}
                        </td>

                        {/* ESR */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                          {row.esr}
                        </td>

                        {/* Power draw */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                          {row.powerDraw}
                        </td>

                        {/* Temp rise */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                          {row.tempRise}
                        </td>

                        {/* Swell */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                          {row.swell}
                        </td>

                        {/* Diagnostic result */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          {row.diagnosticResult === "Resellable / Refurbishable" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#e7f7ee] text-[#15803d]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                              Resellable / Refurbishable
                            </span>
                          )}
                          {row.diagnosticResult === "Recycle / Safe Dismantling" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#edf4fe] text-[#2563eb]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                              Recycle / Safe Dismantling
                            </span>
                          )}
                          {row.diagnosticResult === "Disposal" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fef0ed] text-[#dc2626]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                              Disposal
                            </span>
                          )}
                        </td>

                        {/* Processing decision */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          {row.processingDecision === "Awaiting verification" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fef6e5] text-[#b45309]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                              Awaiting verification
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[12px] font-bold text-[#15271f]">
                              <GreenCheckIcon />
                              {row.processingDecision}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="py-4 px-6 flex items-center justify-between border-t border-[#f0f3f1] text-[12px] text-[#718077]">
            <div>Showing 1 to 10 of 1,284 sample records</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] font-semibold text-[12px] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                className="px-3 py-1.5 bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] font-semibold text-[12px] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default InventoryDashboard;
