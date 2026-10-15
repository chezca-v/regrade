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

import { TopNav } from "@/app/components/TopNav";

// --- Server Component Page ---
export default async function ReferenceWeightsPage() {
  const models = await fetchWeightModels();

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          {/* Title Bar */}
          <div className="rg-titlebar">
            <div>
              <h1>Reference weights</h1>
              <p className="rg-sub">
                Diagnostics / Reference weights. Nominal weights used for the weight check. View only, edited by the team.
              </p>
            </div>

            <div className="rg-titlebar__actions">
              <span className="rg-muted" style={{ fontSize: "12.5px", fontWeight: 500 }}>
                View only
              </span>
              <Link href="/diagnostics" className="rg-btn">
                Back to diagnostics
              </Link>
            </div>
          </div>

          {/* Main Content (Data Table Client) */}
          <ReferenceWeightsClient initialModels={models} />
        </div>
      </main>
    </div>
  );
}
