import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import ReferenceWeightsClient from "./table-client";

export interface WeightModelRow {
  id: number;
  model: string;
  brand: string;
  nominalWeightG: number;
  acceptedRange: string;
  recycleBelow: string;
  lastUpdated: string;
}

// --- Fallback models matching the design screenshot ---
const defaultModels: WeightModelRow[] = [
  {
    id: 1,
    model: "Model X12",
    brand: "Brand A",
    nominalWeightG: 168,
    acceptedRange: "159.6 to 176.4 g",
    recycleBelow: "Under 142.8 g",
    lastUpdated: "02 Oct 2026",
  },
  {
    id: 2,
    model: "Model X14",
    brand: "Brand A",
    nominalWeightG: 174,
    acceptedRange: "165.3 to 182.7 g",
    recycleBelow: "Under 147.9 g",
    lastUpdated: "02 Oct 2026",
  },
  {
    id: 3,
    model: "Model S1",
    brand: "Brand B",
    nominalWeightG: 159,
    acceptedRange: "151.0 to 167.0 g",
    recycleBelow: "Under 135.2 g",
    lastUpdated: "28 Sep 2026",
  },
  {
    id: 4,
    model: "Model S2",
    brand: "Brand B",
    nominalWeightG: 163,
    acceptedRange: "154.8 to 171.2 g",
    recycleBelow: "Under 138.5 g",
    lastUpdated: "28 Sep 2026",
  },
  {
    id: 5,
    model: "Model P7",
    brand: "Brand C",
    nominalWeightG: 186,
    acceptedRange: "176.7 to 195.3 g",
    recycleBelow: "Under 158.1 g",
    lastUpdated: "15 Sep 2026",
  },
  {
    id: 6,
    model: "Model P8",
    brand: "Brand C",
    nominalWeightG: 192,
    acceptedRange: "182.4 to 201.6 g",
    recycleBelow: "Under 163.2 g",
    lastUpdated: "15 Sep 2026",
  },
  {
    id: 7,
    model: "Model L3",
    brand: "Brand D",
    nominalWeightG: 141,
    acceptedRange: "133.9 to 148.1 g",
    recycleBelow: "Under 119.8 g",
    lastUpdated: "09 Sep 2026",
  },
  {
    id: 8,
    model: "Model L5",
    brand: "Brand D",
    nominalWeightG: 148,
    acceptedRange: "140.6 to 155.4 g",
    recycleBelow: "Under 125.8 g",
    lastUpdated: "09 Sep 2026",
  },
  {
    id: 9,
    model: "Model Z1",
    brand: "Brand E",
    nominalWeightG: 205,
    acceptedRange: "194.8 to 215.3 g",
    recycleBelow: "Under 174.3 g",
    lastUpdated: "01 Sep 2026",
  },
  {
    id: 10,
    model: "Model Z2 Mini",
    brand: "Brand E",
    nominalWeightG: 132,
    acceptedRange: "125.4 to 138.6 g",
    recycleBelow: "Under 112.2 g",
    lastUpdated: "01 Sep 2026",
  },
  {
    id: 11,
    model: "Model N10",
    brand: "Brand F",
    nominalWeightG: 177,
    acceptedRange: "168.2 to 185.8 g",
    recycleBelow: "Under 150.4 g",
    lastUpdated: "22 Aug 2026",
  },
  {
    id: 12,
    model: "Model N10 Pro",
    brand: "Brand F",
    nominalWeightG: 195,
    acceptedRange: "185.3 to 204.8 g",
    recycleBelow: "Under 165.8 g",
    lastUpdated: "22 Aug 2026",
  },
];

// Helper calculations
function formatAcceptedRange(nominalG: number): string {
  const low = (nominalG * 0.95).toFixed(1);
  const high = (nominalG * 1.05).toFixed(1);
  return `${low} to ${high} g`;
}

function formatRecycleBelow(nominalG: number): string {
  const cutoff = (nominalG * 0.85).toFixed(1);
  return `Under ${cutoff} g`;
}

// Fetch models dynamically from Supabase database
async function fetchWeightModels(): Promise<WeightModelRow[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return defaultModels;
  }

  try {
    const supabase = await createClient();
    const { data: dbModels } = await supabase
      .from("device_model")
      .select("*")
      .order("brand", { ascending: true });

    if (!dbModels || dbModels.length === 0) {
      return defaultModels;
    }

    return dbModels.map((item: Database["public"]["Tables"]["device_model"]["Row"]) => {
      const weight = Number(item.baseline_weight_g) || 160;
      return {
        id: item.model_id,
        model: item.model_name,
        brand: item.brand,
        nominalWeightG: weight,
        acceptedRange: formatAcceptedRange(weight),
        recycleBelow: formatRecycleBelow(weight),
        lastUpdated: "02 Oct 2026",
      };
    });
  } catch {
    return defaultModels;
  }
}

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

// --- Server Component Page ---
export default async function ReferenceWeightsPage() {
  const models = await fetchWeightModels();

  return (
    <div className="min-h-screen bg-[#f3f5f3] text-[#15271f] font-sans antialiased pb-16">
      {/* 1. TOP NAVIGATION */}
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

          {/* Center Links (Pill Container: Diagnostics is ACTIVE) */}
          <nav className="hidden lg:flex items-center bg-white rounded-full px-2 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-[#e8ece9]">
            <Link
              href="/"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Overview
            </Link>
            <Link
              href="/#diagnostics"
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-[#163d2d] rounded-full shadow-xs"
            >
              Diagnostics
            </Link>
            <Link
              href="/inventory"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Inventory
            </Link>
            <Link
              href="/sorting"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Sorting
            </Link>
            <Link
              href="/#safety-alerts"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full flex items-center gap-1"
            >
              Safety alerts{" "}
              <span className="text-[#dc2626] font-semibold text-[13px] ml-0.5">2</span>
            </Link>
            <Link
              href="/#reports"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Reports
            </Link>
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
      </header>

      {/* Main Container */}
      <main className="w-full px-6 md:px-10 max-w-[1440px] mx-auto mt-7">
        {/* 2. PAGE HEADER & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] md:text-[28px] font-extrabold text-[#15271f] tracking-tight leading-tight">
              Reference weights
            </h1>
            <p className="text-[13px] text-[#718077] mt-1">
              Diagnostics / Reference weights. Nominal weights used for the weight check. View only, edited by the team.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#839189] font-medium">View only</span>
            <Link
              href="/#diagnostics"
              className="bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] text-[13px] font-semibold px-4 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors cursor-pointer inline-flex items-center"
            >
              Back to diagnostics
            </Link>
          </div>
        </div>

        {/* 3. MAIN CONTENT CONTAINER (DATA TABLE) */}
        <ReferenceWeightsClient initialModels={models} />
      </main>
    </div>
  );
}
