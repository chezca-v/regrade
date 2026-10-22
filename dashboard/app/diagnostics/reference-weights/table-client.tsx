"use client";

import React, { useState, useMemo } from "react";
import type { WeightModelRow } from "./page";
import { createClient } from "@/lib/supabase/client";
import { ensureUser } from "@/lib/supabase/ensure-user";

interface Props {
  initialModels: WeightModelRow[];
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error !== null && typeof error === "object" && "message" in error && typeof error.message === "string") {
    const details = "details" in error && typeof error.details === "string" ? error.details : "";
    const hint = "hint" in error && typeof error.hint === "string" ? error.hint : "";
    const code = "code" in error && typeof error.code === "string" ? ` (${error.code})` : "";
    return [error.message + code, details, hint].filter(Boolean).join(" ");
  }
  return fallback;
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
  const [models, setModels] = useState(initialModels);
  const [formOpen, setFormOpen] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState("All brands");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Extract unique brands for dropdown
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    models.forEach((m) => {
      if (m.brand) brandSet.add(m.brand);
    });
    return ["All brands", ...Array.from(brandSet).sort()];
  }, [models]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter((item) => {
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
  }, [models, selectedBrand, searchQuery]);

  async function addReference(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setFormMessage("");
    const form = new FormData(formElement);
    const brand = String(form.get("brand") ?? "").trim();
    const model = String(form.get("model") ?? "").trim();
    const weight = Number(form.get("weight"));
    const thicknessInput = String(form.get("thickness") ?? "").trim();
    const thickness = thicknessInput ? Number(thicknessInput) : null;
    if (!brand || !model || !Number.isFinite(weight) || weight <= 0 || (thickness !== null && (!Number.isFinite(thickness) || thickness <= 0))) {
      setFormMessage("Enter a brand, model, positive weight, and a valid optional thickness.");
      setSaving(false);
      return;
    }
    try {
      const client = createClient();
      const user = await ensureUser(client);
      const { data, error } = await client.from("device_model").insert({
        brand, model_name: model, device_type: "phone", baseline_weight_g: weight,
        baseline_thickness_mm: thickness, nominal_current_ma: null, source: "operator-added", created_by: user.id,
      }).select("model_id").single();
      if (error) throw error;
      setModels((current) => [{ id: data.model_id, brand, model, nominalWeightG: weight, acceptedRange: `${(weight * .95).toFixed(1)} to ${(weight * 1.05).toFixed(1)} g`, recycleBelow: `Under ${(weight * .85).toFixed(1)} g`, lastUpdated: "Just added" }, ...current]);
      setFormMessage("Reference saved for future sessions.");
      formElement.reset();
    } catch (error) {
      setFormMessage(errorMessage(error, "Could not save. Check the operator phone references migration and try again."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteReference(item: WeightModelRow) {
    if (!item.canDelete || !window.confirm(`Delete the saved reference ${item.brand} ${item.model}?`)) return;
    setDeletingId(item.id);
    setDeleteMessage("");
    try {
      const client = createClient();
      const user = await ensureUser(client);
      const { data, error } = await client.from("device_model").delete().eq("model_id", item.id).eq("created_by", user.id).select("model_id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Only the operator who added this reference can delete it.");
      setModels((current) => current.filter((model) => model.id !== item.id));
    } catch (error) {
      setDeleteMessage(errorMessage(error, "Could not delete this reference."));
    } finally {
      setDeletingId(null);
    }
  }

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
          Phone weights used as comparison references. Measured results still need operator review.
        </p>
        <button className="rg-btn" type="button" onClick={() => setFormOpen((value) => !value)}>{formOpen ? "Close form" : "Add reference phone"}</button>
      </div>
      {formOpen && <form className="rg-reference-form" onSubmit={addReference}>
        <label>Brand<input name="brand" required maxLength={80} placeholder="e.g. Samsung" /></label>
        <label>Model<input name="model" required maxLength={120} placeholder="e.g. Galaxy S24" /></label>
        <label>Healthy reference weight (g)<input name="weight" type="number" min="1" step="0.1" required /></label>
        <label>Thickness (mm), optional<input name="thickness" type="number" min="0.1" step="0.1" /></label>
        <button className="rg-btn rg-btn--primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save phone reference"}</button>
        {formMessage && <span className="rg-small" role="status">{formMessage}</span>}
      </form>}

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
        {deleteMessage && <p className="rg-small" role="alert">{deleteMessage}</p>}
        <table className="rg-data-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Brand</th>
              <th>Nominal weight</th>
              <th>Accepted range (±5%)</th>
              <th>Recycle below (−15%)</th>
              <th>Last updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedModels.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
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
                  <td>{item.canDelete && <button type="button" className="rg-btn" disabled={deletingId === item.id} onClick={() => void deleteReference(item)}>{deletingId === item.id ? "Deleting…" : "Delete"}</button>}</td>
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
