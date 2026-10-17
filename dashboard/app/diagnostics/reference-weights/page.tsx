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

// --- Verified reference models from phone specifications dataset ---
const defaultModels: WeightModelRow[] = [
  // Apple
  {
    id: 1,
    model: "iPhone 16 Pro Max",
    brand: "Apple",
    nominalWeightG: 227,
    acceptedRange: "215.7 to 238.4 g",
    recycleBelow: "Under 193.0 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 2,
    model: "iPhone 16 Pro",
    brand: "Apple",
    nominalWeightG: 199,
    acceptedRange: "189.0 to 209.0 g",
    recycleBelow: "Under 169.2 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 3,
    model: "iPhone 16 Plus",
    brand: "Apple",
    nominalWeightG: 199,
    acceptedRange: "189.0 to 209.0 g",
    recycleBelow: "Under 169.2 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 4,
    model: "iPhone 16",
    brand: "Apple",
    nominalWeightG: 170,
    acceptedRange: "161.5 to 178.5 g",
    recycleBelow: "Under 144.5 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 5,
    model: "iPhone 15 Pro Max",
    brand: "Apple",
    nominalWeightG: 221,
    acceptedRange: "210.0 to 232.0 g",
    recycleBelow: "Under 187.8 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 6,
    model: "iPhone 15 Pro",
    brand: "Apple",
    nominalWeightG: 187,
    acceptedRange: "177.7 to 196.3 g",
    recycleBelow: "Under 158.9 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 7,
    model: "iPhone 15 Plus",
    brand: "Apple",
    nominalWeightG: 201,
    acceptedRange: "191.0 to 211.0 g",
    recycleBelow: "Under 170.8 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 8,
    model: "iPhone 15",
    brand: "Apple",
    nominalWeightG: 171,
    acceptedRange: "162.5 to 179.5 g",
    recycleBelow: "Under 145.4 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 9,
    model: "iPhone 14 Pro Max",
    brand: "Apple",
    nominalWeightG: 240,
    acceptedRange: "228.0 to 252.0 g",
    recycleBelow: "Under 204.0 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 10,
    model: "iPhone 14 Pro",
    brand: "Apple",
    nominalWeightG: 206,
    acceptedRange: "195.7 to 216.3 g",
    recycleBelow: "Under 175.1 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 11,
    model: "iPhone 14",
    brand: "Apple",
    nominalWeightG: 172,
    acceptedRange: "163.4 to 180.6 g",
    recycleBelow: "Under 146.2 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 12,
    model: "iPhone 13 Pro Max",
    brand: "Apple",
    nominalWeightG: 240,
    acceptedRange: "228.0 to 252.0 g",
    recycleBelow: "Under 204.0 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 13,
    model: "iPhone 13 Pro",
    brand: "Apple",
    nominalWeightG: 204,
    acceptedRange: "193.8 to 214.2 g",
    recycleBelow: "Under 173.4 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 14,
    model: "iPhone 13",
    brand: "Apple",
    nominalWeightG: 174,
    acceptedRange: "165.3 to 182.7 g",
    recycleBelow: "Under 147.9 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 15,
    model: "iPhone 13 mini",
    brand: "Apple",
    nominalWeightG: 141,
    acceptedRange: "133.9 to 148.1 g",
    recycleBelow: "Under 119.8 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 16,
    model: "iPhone 12",
    brand: "Apple",
    nominalWeightG: 164,
    acceptedRange: "155.8 to 172.2 g",
    recycleBelow: "Under 139.4 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 17,
    model: "iPhone 11",
    brand: "Apple",
    nominalWeightG: 194,
    acceptedRange: "184.3 to 203.7 g",
    recycleBelow: "Under 164.9 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 18,
    model: "iPhone SE (2022)",
    brand: "Apple",
    nominalWeightG: 144,
    acceptedRange: "136.8 to 151.2 g",
    recycleBelow: "Under 122.4 g",
    lastUpdated: "15 Oct 2026",
  },

  // Samsung
  {
    id: 19,
    model: "Galaxy S24 Ultra",
    brand: "Samsung",
    nominalWeightG: 232,
    acceptedRange: "220.4 to 243.6 g",
    recycleBelow: "Under 197.2 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 20,
    model: "Galaxy S24+",
    brand: "Samsung",
    nominalWeightG: 196,
    acceptedRange: "186.2 to 205.8 g",
    recycleBelow: "Under 166.6 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 21,
    model: "Galaxy S24",
    brand: "Samsung",
    nominalWeightG: 167,
    acceptedRange: "158.7 to 175.3 g",
    recycleBelow: "Under 141.9 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 22,
    model: "Galaxy S23 Ultra",
    brand: "Samsung",
    nominalWeightG: 234,
    acceptedRange: "222.3 to 245.7 g",
    recycleBelow: "Under 198.9 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 23,
    model: "Galaxy S23+",
    brand: "Samsung",
    nominalWeightG: 196,
    acceptedRange: "186.2 to 205.8 g",
    recycleBelow: "Under 166.6 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 24,
    model: "Galaxy S23",
    brand: "Samsung",
    nominalWeightG: 168,
    acceptedRange: "159.6 to 176.4 g",
    recycleBelow: "Under 142.8 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 25,
    model: "Galaxy S22 Ultra",
    brand: "Samsung",
    nominalWeightG: 228,
    acceptedRange: "216.6 to 239.4 g",
    recycleBelow: "Under 193.8 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 26,
    model: "Galaxy S22",
    brand: "Samsung",
    nominalWeightG: 167,
    acceptedRange: "158.7 to 175.3 g",
    recycleBelow: "Under 141.9 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 27,
    model: "Galaxy A54 5G",
    brand: "Samsung",
    nominalWeightG: 202,
    acceptedRange: "191.9 to 212.1 g",
    recycleBelow: "Under 171.7 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 28,
    model: "Galaxy A34 5G",
    brand: "Samsung",
    nominalWeightG: 199,
    acceptedRange: "189.0 to 209.0 g",
    recycleBelow: "Under 169.2 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 29,
    model: "Galaxy Z Flip 5",
    brand: "Samsung",
    nominalWeightG: 187,
    acceptedRange: "177.7 to 196.3 g",
    recycleBelow: "Under 158.9 g",
    lastUpdated: "15 Oct 2026",
  },

  // Google
  {
    id: 30,
    model: "Pixel 9 Pro",
    brand: "Google",
    nominalWeightG: 199,
    acceptedRange: "189.0 to 209.0 g",
    recycleBelow: "Under 169.2 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 31,
    model: "Pixel 9",
    brand: "Google",
    nominalWeightG: 198,
    acceptedRange: "188.1 to 207.9 g",
    recycleBelow: "Under 168.3 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 32,
    model: "Pixel 8 Pro",
    brand: "Google",
    nominalWeightG: 213,
    acceptedRange: "202.3 to 223.7 g",
    recycleBelow: "Under 181.0 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 33,
    model: "Pixel 8",
    brand: "Google",
    nominalWeightG: 187,
    acceptedRange: "177.7 to 196.3 g",
    recycleBelow: "Under 158.9 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 34,
    model: "Pixel 8a",
    brand: "Google",
    nominalWeightG: 188,
    acceptedRange: "178.6 to 197.4 g",
    recycleBelow: "Under 159.8 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 35,
    model: "Pixel 7 Pro",
    brand: "Google",
    nominalWeightG: 212,
    acceptedRange: "201.4 to 222.6 g",
    recycleBelow: "Under 180.2 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 36,
    model: "Pixel 7",
    brand: "Google",
    nominalWeightG: 197,
    acceptedRange: "187.1 to 206.9 g",
    recycleBelow: "Under 167.4 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 37,
    model: "Pixel 7a",
    brand: "Google",
    nominalWeightG: 193,
    acceptedRange: "183.3 to 202.7 g",
    recycleBelow: "Under 164.0 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 38,
    model: "Pixel 6a",
    brand: "Google",
    nominalWeightG: 178,
    acceptedRange: "169.1 to 186.9 g",
    recycleBelow: "Under 151.3 g",
    lastUpdated: "15 Oct 2026",
  },

  // OnePlus
  {
    id: 39,
    model: "OnePlus 12",
    brand: "OnePlus",
    nominalWeightG: 220,
    acceptedRange: "209.0 to 231.0 g",
    recycleBelow: "Under 187.0 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 40,
    model: "OnePlus 12R",
    brand: "OnePlus",
    nominalWeightG: 207,
    acceptedRange: "196.6 to 217.4 g",
    recycleBelow: "Under 175.9 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 41,
    model: "OnePlus 11",
    brand: "OnePlus",
    nominalWeightG: 205,
    acceptedRange: "194.8 to 215.2 g",
    recycleBelow: "Under 174.2 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 42,
    model: "OnePlus Nord 3",
    brand: "OnePlus",
    nominalWeightG: 193,
    acceptedRange: "183.3 to 202.7 g",
    recycleBelow: "Under 164.0 g",
    lastUpdated: "15 Oct 2026",
  },

  // Xiaomi
  {
    id: 43,
    model: "Xiaomi 14 Ultra",
    brand: "Xiaomi",
    nominalWeightG: 220,
    acceptedRange: "209.0 to 231.0 g",
    recycleBelow: "Under 187.0 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 44,
    model: "Xiaomi 14",
    brand: "Xiaomi",
    nominalWeightG: 193,
    acceptedRange: "183.3 to 202.7 g",
    recycleBelow: "Under 164.0 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 45,
    model: "Redmi Note 13 Pro+",
    brand: "Xiaomi",
    nominalWeightG: 204,
    acceptedRange: "193.8 to 214.2 g",
    recycleBelow: "Under 173.4 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 46,
    model: "Poco F5 Pro",
    brand: "Xiaomi",
    nominalWeightG: 204,
    acceptedRange: "193.8 to 214.2 g",
    recycleBelow: "Under 173.4 g",
    lastUpdated: "15 Oct 2026",
  },

  // Motorola
  {
    id: 47,
    model: "Edge 40 Pro",
    brand: "Motorola",
    nominalWeightG: 199,
    acceptedRange: "189.0 to 209.0 g",
    recycleBelow: "Under 169.2 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 48,
    model: "Moto G84",
    brand: "Motorola",
    nominalWeightG: 166,
    acceptedRange: "157.7 to 174.3 g",
    recycleBelow: "Under 141.1 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 49,
    model: "Razr 40 Ultra",
    brand: "Motorola",
    nominalWeightG: 188,
    acceptedRange: "178.6 to 197.4 g",
    recycleBelow: "Under 159.8 g",
    lastUpdated: "15 Oct 2026",
  },

  // Sony
  {
    id: 50,
    model: "Xperia 1 V",
    brand: "Sony",
    nominalWeightG: 187,
    acceptedRange: "177.7 to 196.3 g",
    recycleBelow: "Under 158.9 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 51,
    model: "Xperia 5 V",
    brand: "Sony",
    nominalWeightG: 182,
    acceptedRange: "172.9 to 191.1 g",
    recycleBelow: "Under 154.7 g",
    lastUpdated: "15 Oct 2026",
  },
  {
    id: 52,
    model: "Xperia 10 V",
    brand: "Sony",
    nominalWeightG: 159,
    acceptedRange: "151.0 to 167.0 g",
    recycleBelow: "Under 135.2 g",
    lastUpdated: "15 Oct 2026",
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
