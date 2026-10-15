"use client";

import React, { useState, useMemo } from "react";
import type { WeightModelRow } from "./page";

interface Props {
  initialModels: WeightModelRow[];
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
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
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function ReferenceWeightsClient({ initialModels }: Props) {
  const [selectedBrand, setSelectedBrand] = useState("All brands");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Extract unique brands for dropdown
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    initialModels.forEach((m) => {
      if (m.brand) brandSet.add(m.brand);
    });
    return ["All brands", ...Array.from(brandSet).sort()];
  }, [initialModels]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return initialModels.filter((item) => {
      if (selectedBrand !== "All brands" && item.brand !== selectedBrand) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesModel = item.model.toLowerCase().includes(q);
        const matchesBrand = item.brand.toLowerCase().includes(q);
        if (!matchesModel && !matchesBrand) {
          return false;
        }
      }
      return true;
    });
  }, [initialModels, selectedBrand, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredModels.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIdx = (activePage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedModels = filteredModels.slice(startIdx, endIdx);

  return (
    <section
      aria-label="Smartphone Models Reference Weights"
      className="rg-card rg-card--pad"
    >
      {/* Title & Subtitle */}
      <div className="rg-card-head">
        <h3>Smartphone models</h3>
        <p className="rg-sub">
          Placeholder models and weights for design review.
        </p>
      </div>

      {/* Controls Toolbar */}
      <div className="rg-toolbar">
        {/* Left: Brand Dropdown */}
        <div className="rg-select-wrap" style={{ minWidth: 150 }}>
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setCurrentPage(1);
            }}
            className="rg-select"
            style={{ padding: "8px 32px 8px 12px", fontSize: "12.5px" }}
            aria-label="Filter by brand"
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <span className="rg-select-chevron" style={{ right: 10 }}>
            <ChevronDownIcon />
          </span>
        </div>

        {/* Right: Search Input */}
        <div className="rg-search">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search model name"
            aria-label="Search model name"
            style={{ width: 200 }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rg-table-container">
        <table className="rg-data-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Brand</th>
              <th>Nominal weight</th>
              <th>Accepted range (±5%)</th>
              <th>Recycle below (−15%)</th>
              <th>Last updated</th>
            </tr>
          </thead>
          <tbody>
            {paginatedModels.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "48px 16px",
                    textAlign: "center",
                    color: "var(--rg-muted)",
                  }}
                >
                  No models match your current filters.
                </td>
              </tr>
            ) : (
              paginatedModels.map((item) => (
                <tr key={item.id}>
                  {/* Model */}
                  <td style={{ fontWeight: 700, color: "var(--rg-ink)" }}>
                    {item.model}
                  </td>

                  {/* Brand */}
                  <td>{item.brand}</td>

                  {/* Nominal weight */}
                  <td>{item.nominalWeightG} g</td>

                  {/* Accepted range */}
                  <td>{item.acceptedRange}</td>

                  {/* Recycle below */}
                  <td>{item.recycleBelow}</td>

                  {/* Last updated */}
                  <td>{item.lastUpdated}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="rg-pagination">
        <div className="rg-pagination-info">
          Showing {filteredModels.length === 0 ? 0 : startIdx + 1} to{" "}
          {Math.min(endIdx, filteredModels.length)} of {filteredModels.length} sample models
        </div>
        <div className="rg-pagination-actions">
          <button
            type="button"
            className="rg-btn"
            disabled={activePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{
              opacity: activePage <= 1 ? 0.45 : 1,
              cursor: activePage <= 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>
          <button
            type="button"
            className="rg-btn"
            disabled={activePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{
              opacity: activePage >= totalPages ? 0.45 : 1,
              cursor: activePage >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
