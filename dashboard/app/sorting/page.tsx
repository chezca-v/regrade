import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// --- Types ---
export type DiagnosticResultType =
  | "Resellable / Refurbishable"
  | "Recycle / Safe Dismantling"
  | "Disposal";

export interface QueueItem {
  id: string;
  sessionId: number;
  time: string;
  diagnosticResult: DiagnosticResultType;
  suggestedBin: "Bin A" | "Bin B" | "Bin C";
  processingDecision: string;
  hasWarning?: boolean;
}

export interface BinStatus {
  id: "Bin A" | "Bin B" | "Bin C";
  label: DiagnosticResultType;
  current: number;
  capacity: number;
  percentage: number;
  lastSortedTime: string;
  nextCollectionTime: string;
  theme: "green" | "blue" | "red";
  alertText?: string;
}

// --- Default Data matching Screenshot ---
const defaultBins: BinStatus[] = [
  {
    id: "Bin A",
    label: "Resellable / Refurbishable",
    current: 27,
    capacity: 60,
    percentage: 45,
    lastSortedTime: "14:32",
    nextCollectionTime: "17:00",
    theme: "green",
  },
  {
    id: "Bin B",
    label: "Recycle / Safe Dismantling",
    current: 15,
    capacity: 60,
    percentage: 25,
    lastSortedTime: "14:09",
    nextCollectionTime: "17:00",
    theme: "blue",
  },
  {
    id: "Bin C",
    label: "Disposal",
    current: 6,
    capacity: 20,
    percentage: 30,
    lastSortedTime: "13:57",
    nextCollectionTime: "Special pickup",
    theme: "red",
    alertText: "Handle with gloves. Keep away from heat.",
  },
];

const defaultQueue: QueueItem[] = [
  {
    id: "REG-20261013-012",
    sessionId: 12,
    time: "15:04",
    diagnosticResult: "Resellable / Refurbishable",
    suggestedBin: "Bin A",
    processingDecision: "Awaiting verification",
  },
  {
    id: "REG-20261013-007",
    sessionId: 7,
    time: "14:32",
    diagnosticResult: "Resellable / Refurbishable",
    suggestedBin: "Bin A",
    processingDecision: "Awaiting verification",
  },
  {
    id: "REG-20261013-004",
    sessionId: 4,
    time: "13:57",
    diagnosticResult: "Disposal",
    suggestedBin: "Bin C",
    processingDecision: "Awaiting verification",
    hasWarning: true,
  },
  {
    id: "REG-20261013-001",
    sessionId: 1,
    time: "13:20",
    diagnosticResult: "Recycle / Safe Dismantling",
    suggestedBin: "Bin B",
    processingDecision: "Awaiting verification",
  },
  {
    id: "REG-20261012-041",
    sessionId: 41,
    time: "16:52",
    diagnosticResult: "Resellable / Refurbishable",
    suggestedBin: "Bin A",
    processingDecision: "Awaiting verification",
  },
  {
    id: "REG-20261012-039",
    sessionId: 39,
    time: "16:40",
    diagnosticResult: "Disposal",
    suggestedBin: "Bin C",
    processingDecision: "Awaiting verification",
    hasWarning: true,
  },
];

// --- Server Actions for Action Handling ---
export async function verifyAndRouteAction(formData: FormData) {
  "use server";
  const sessionIdStr = formData.get("sessionId")?.toString();
  const bin = formData.get("bin")?.toString() || "Bin A";

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = await createClient();
      const sessionId = sessionIdStr ? parseInt(sessionIdStr, 10) : null;

      if (sessionId) {
        // Query bin_id from label
        const { data: binRow } = await supabase
          .from("bin")
          .select("bin_id")
          .eq("label", bin)
          .maybeSingle();

        // If bin found, insert sort_action or update test_session
        if (binRow) {
          await supabase.from("sort_action").upsert({
            session_id: sessionId,
            bin_id: binRow.bin_id,
            servo_angle: bin === "Bin A" ? 45 : bin === "Bin B" ? 90 : 135,
            executed_at: new Date().toISOString(),
            success: true,
          });
        }

        await supabase
          .from("test_session")
          .update({ status: "Complete" })
          .eq("session_id", sessionId);
      }
    } catch (err) {
      console.warn("Could not persist verifyAndRouteAction to Supabase:", err);
    }
  }

  revalidatePath("/sorting");
  revalidatePath("/inventory");
}

export async function overrideAction(formData: FormData) {
  "use server";
  const sessionIdStr = formData.get("sessionId")?.toString();

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = await createClient();
      const sessionId = sessionIdStr ? parseInt(sessionIdStr, 10) : null;

      if (sessionId) {
        await supabase
          .from("test_session")
          .update({ status: "Review" })
          .eq("session_id", sessionId);
      }
    } catch (err) {
      console.warn("Could not persist overrideAction to Supabase:", err);
    }
  }

  revalidatePath("/sorting");
  revalidatePath("/inventory");
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

// --- Data Fetching Helper ---
async function fetchSortingData() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return { bins: defaultBins, queue: defaultQueue };
  }

  try {
    const supabase = await createClient();

    // Query unrouted/review sessions from dashboard_diagnostics
    const [diagResult, binsResult] = await Promise.all([
      supabase
        .from("dashboard_diagnostics")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20),
      supabase.from("bin").select("*"),
    ]);

    if (!diagResult.data || diagResult.data.length === 0) {
      return { bins: defaultBins, queue: defaultQueue };
    }

    // Map database diagnostics into queue items
    const queue: QueueItem[] = diagResult.data.map((row) => {
      const dateObj = new Date(row.started_at);
      const timeStr = `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
      const datePrefix = row.started_at.slice(0, 10).replace(/-/g, "");
      const formattedId = `REG-${datePrefix}-${String(row.session_id).padStart(3, "0")}`;

      let result: DiagnosticResultType = "Resellable / Refurbishable";
      let bin: "Bin A" | "Bin B" | "Bin C" = "Bin A";

      if (row.final_grade === "D") {
        result = "Disposal";
        bin = "Bin C";
      } else if (row.final_grade === "C") {
        result = "Recycle / Safe Dismantling";
        bin = "Bin B";
      } else {
        result = "Resellable / Refurbishable";
        bin = "Bin A";
      }

      return {
        id: formattedId,
        sessionId: row.session_id,
        time: timeStr,
        diagnosticResult: result,
        suggestedBin: bin,
        processingDecision: "Awaiting verification",
        hasWarning: row.final_grade === "D",
      };
    });

    const mappedBins = defaultBins.map((b) => {
      const match = binsResult.data?.find((row) => row.label === b.id);
      if (match && match.capacity) {
        return { ...b, capacity: match.capacity };
      }
      return b;
    });

    return { bins: mappedBins, queue: queue.length > 0 ? queue : defaultQueue };
  } catch {
    return { bins: defaultBins, queue: defaultQueue };
  }
}

// --- Server Component Page ---
export default async function SortingPage() {
  const { bins, queue } = await fetchSortingData();

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

          {/* Center Links (Pill Container) */}
          <nav className="hidden lg:flex items-center bg-white rounded-full px-2 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-[#e8ece9]">
            <Link
              href="/"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Overview
            </Link>
            <Link
              href="/#diagnostics"
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
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
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-[#163d2d] rounded-full shadow-xs"
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
        {/* PAGE HEADER & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] md:text-[28px] font-extrabold text-[#15271f] tracking-tight leading-tight">
              Sorting
            </h1>
            <p className="text-[13px] text-[#718077] mt-1">
              Bin status and the routing queue. Sample data, no hardware connected.
            </p>
          </div>

          <div>
            <button
              type="button"
              className="bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] text-[13px] font-semibold px-4 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors cursor-pointer inline-flex items-center"
            >
              Export bin log
            </button>
          </div>
        </div>

        {/* 2. BIN STATUS CARDS (GRID OF 3) */}
        <section
          aria-label="Bin Status"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 items-start"
        >
          {bins.map((bin) => {
            const isGreen = bin.theme === "green";
            const isBlue = bin.theme === "blue";
            const isRed = bin.theme === "red";

            return (
              <div
                key={bin.id}
                className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge & Bin Tag */}
                  <div className="flex items-center justify-between">
                    {isGreen && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#e7f7ee] text-[#15803d]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                        {bin.label}
                      </span>
                    )}
                    {isBlue && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#edf4fe] text-[#2563eb]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                        {bin.label}
                      </span>
                    )}
                    {isRed && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fef0ed] text-[#dc2626]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                        {bin.label}
                      </span>
                    )}

                    <span className="bg-[#f0f3f1] text-[#65756c] px-2.5 py-0.5 rounded-md text-[11px] font-medium">
                      {bin.id}
                    </span>
                  </div>

                  {/* Main Capacity Stat */}
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-[34px] font-extrabold tracking-tight text-[#15271f] leading-none">
                      {bin.current}
                    </span>
                    <span className="text-[13px] text-[#718077] font-medium">
                      of {bin.capacity} items
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#edf1ee] h-2 rounded-full mt-3 mb-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isGreen
                          ? "bg-[#16835b]"
                          : isBlue
                          ? "bg-[#2563eb]"
                          : "bg-[#dc2626]"
                      }`}
                      style={{ width: `${bin.percentage}%` }}
                    />
                  </div>

                  {/* Metrics Rows */}
                  <div className="space-y-0 text-[12px]">
                    <div className="flex items-center justify-between py-2.5 border-t border-[#f1f4f2]">
                      <span className="text-[#718077]">Last item sorted</span>
                      <span className="font-bold text-[#15271f]">
                        {bin.lastSortedTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-t border-[#f1f4f2]">
                      <span className="text-[#718077]">Next collection</span>
                      <span className="font-bold text-[#15271f]">
                        {bin.nextCollectionTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional Alert Section (Bin C) */}
                {bin.alertText && (
                  <div className="bg-[#feebe7] rounded-xl p-3 mt-4 flex items-center gap-2 text-[12px] font-bold text-[#c53022]">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#c53022"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>{bin.alertText}</span>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* 3. ROUTING QUEUE SECTION (DATA TABLE) */}
        <section
          aria-label="Routing Queue"
          className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] mt-6 p-6 overflow-hidden"
        >
          {/* Card Title & Subtext */}
          <div className="mb-4">
            <h2 className="text-[17px] font-extrabold text-[#15271f] tracking-tight">
              Routing queue
            </h2>
            <p className="text-[12px] text-[#718077] mt-0.5">
              {queue.length} devices are graded and waiting for an operator to verify and route them.
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="border-b border-[#f0f3f1] text-[11px] font-semibold text-[#839189]">
                  <th className="py-3 px-4 font-semibold">Device ID</th>
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold">Diagnostic result</th>
                  <th className="py-3 px-4 font-semibold">Suggested bin</th>
                  <th className="py-3 px-4 font-semibold">Processing decision</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((row) => {
                  const rowBgClass = row.hasWarning
                    ? "bg-[#fdf4ee] hover:bg-[#faeee6]"
                    : "bg-white hover:bg-[#f9faf9]";

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-[#f1f4f2] text-[12px] text-[#3e4f45] transition-colors ${rowBgClass}`}
                    >
                      {/* Device ID */}
                      <td className="py-3.5 px-4 font-bold text-[#15271f] whitespace-nowrap">
                        <Link
                          href={`/inventory/${row.id}`}
                          className="hover:underline flex items-center"
                        >
                          {row.hasWarning && <WarningTriangleIcon />}
                          <span>{row.id}</span>
                        </Link>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#495a50]">
                        {row.time}
                      </td>

                      {/* Diagnostic result */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
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

                      {/* Suggested bin */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#15271f]">
                        {row.suggestedBin}
                      </td>

                      {/* Processing decision */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fef6e5] text-[#b45309]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                          {row.processingDecision}
                        </span>
                      </td>

                      {/* Action buttons (Forms invoking Server Actions) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <form action={verifyAndRouteAction}>
                            <input type="hidden" name="deviceId" value={row.id} />
                            <input type="hidden" name="sessionId" value={row.sessionId} />
                            <input type="hidden" name="bin" value={row.suggestedBin} />
                            <button
                              type="submit"
                              className="bg-[#246e4c] hover:bg-[#1B4332] text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Verify and route
                            </button>
                          </form>

                          <form action={overrideAction}>
                            <input type="hidden" name="deviceId" value={row.id} />
                            <input type="hidden" name="sessionId" value={row.sessionId} />
                            <button
                              type="submit"
                              className="bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] text-[12px] font-semibold px-3.5 py-1.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Override
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
