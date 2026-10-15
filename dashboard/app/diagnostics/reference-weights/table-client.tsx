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
      stroke="#6b7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
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

export default function ReferenceWeightsClient({ initialModels }: Props) {
  const [selectedBrand, setSelectedBrand] = useState("All brands");
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <section
      aria-label="Smartphone Models Reference Weights"
      className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] mt-6 p-6 overflow-hidden"
    >
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-[17px] font-extrabold text-[#15271f] tracking-tight">
          Smartphone models
        </h2>
        <p className="text-[12px] text-[#718077] mt-0.5">
          Placeholder models and weights for design review.
        </p>
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 mb-5">
        {/* Left: Brand Dropdown */}
        <div className="relative">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="appearance-none bg-white border border-[#dce2de] hover:border-[#c5cdc7] text-[#34443b] text-[12px] font-medium pl-3 pr-8 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer outline-none transition-colors"
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#75847c]">
            <ChevronDownIcon />
          </div>
        </div>

        {/* Right: Search Input */}
        <div className="relative flex items-center">
          <div className="absolute left-3 pointer-events-none text-[#8e9c94]">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search model name"
            className="w-56 md:w-64 bg-white border border-[#dce2de] focus:border-[#246e4c] text-[#15271f] placeholder:text-[#93a199] text-[12px] pl-8 pr-3 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="border-b border-[#f0f3f1] text-[11px] font-semibold text-[#839189]">
              <th className="py-3 px-4 font-semibold">Model</th>
              <th className="py-3 px-4 font-semibold">Brand</th>
              <th className="py-3 px-4 font-semibold">Nominal weight</th>
              <th className="py-3 px-4 font-semibold">Accepted range (±5%)</th>
              <th className="py-3 px-4 font-semibold">Recycle below (−15%)</th>
              <th className="py-3 px-4 font-semibold">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#8e9c94] text-[13px]">
                  No models match your current filters.
                </td>
              </tr>
            ) : (
              filteredModels.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#f1f4f2] text-[12px] text-[#3e4f45] hover:bg-[#f9faf9] transition-colors"
                >
                  {/* Model */}
                  <td className="py-3.5 px-4 font-bold text-[#15271f] whitespace-nowrap">
                    {item.model}
                  </td>

                  {/* Brand */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                    {item.brand}
                  </td>

                  {/* Nominal weight */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                    {item.nominalWeightG} g
                  </td>

                  {/* Accepted range */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                    {item.acceptedRange}
                  </td>

                  {/* Recycle below */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                    {item.recycleBelow}
                  </td>

                  {/* Last updated */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                    {item.lastUpdated}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="py-4 mt-2 flex items-center justify-between border-t border-[#f0f3f1] text-[12px] text-[#718077]">
        <div>
          Showing 1 to {Math.min(filteredModels.length, 12)} of {initialModels.length > 12 ? initialModels.length : 86} sample models
        </div>
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
  );
}
