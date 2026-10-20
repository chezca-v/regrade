import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/app/components/TopNav";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchDeviceDetails(deviceId: string) {
  const fallback = {
    isLive: false, deviceId, deviceType: "Phone", modelName: "Sample phone record", testTime: "—",
    hasSafetyAlert: false, alertTitle: "", alertSubtext: "", completedTime: "Sample only",
    fullReadingsSubtitle: "Example inventory record; this is not a live scan.",
    metrics: {
      batteryEsr: { label: "Battery ESR", value: "—", unit: "mΩ", limitText: "Not reported", statusText: "Not reported" },
      powerDraw: { label: "Power draw", value: "—", unit: "mA", limitText: "Not reported", statusText: "Not reported" },
      tempRise: { label: "Temperature rise", value: "—", unit: "°C", limitText: "Not reported", statusText: "Not reported" },
      casingSwell: { label: "Thickness", value: "—", unit: "mm", limitText: "Not reported", statusText: "Not reported" },
    },
    whyReasons: ["This sample inventory row does not contain station telemetry."],
    activity: [{ label: "Sample record", time: "—", type: "pending" as const }],
    diagnosticResult: "Not available", diagnosticResultDescription: "No station result is associated with this sample record.",
    processingDecision: "No operator review", processingDecisionSubtitle: "Use Diagnostics to review real station reports.",
    info: { deviceType: "Phone", model: "Not recorded", nominalWeight: "Not recorded", measuredWeight: "Not recorded", intakeBatch: "Not recorded", received: "Not recorded", collectionCenter: "Not recorded" },
  };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return fallback;
  try {
    const supabase = await createClient();
    const { data: report } = await supabase.from("station_telemetry")
      .select("station_id, session_id, status, readings, grade, health_score, fault, reported_at")
      .eq("session_id", deviceId).order("reported_at", { ascending: false }).limit(1).maybeSingle();
    if (!report) return fallback;
    const readings = report.readings && typeof report.readings === "object" && !Array.isArray(report.readings) ? report.readings as Record<string, number | string | null> : {};
    const value = (key: string) => typeof readings[key] === "number" ? Number(readings[key]).toFixed(1) : "—";
    const grade = report.grade;
    const result = grade === "D" ? "Safety review required" : grade === "C" ? "Recycle review" : grade ? "Reuse review" : "Not graded";
    const recorded = new Date(report.reported_at).toISOString().replace("T", " ").slice(0, 16) + " UTC";
    return {
      ...fallback, isLive: true, deviceId: report.session_id, deviceType: "Not identified by station", modelName: "Not identified by station",
      testTime: recorded.slice(11, 16), completedTime: recorded, fullReadingsSubtitle: report.fault ?? "Station report received.",
      hasSafetyAlert: grade === "D" || Boolean(report.fault), alertTitle: "Station safety flag", alertSubtext: report.fault ?? "Grade D: follow the approved safety procedure.",
      metrics: {
        batteryEsr: { label: "Battery ESR", value: "—", unit: "mΩ", limitText: "Not reported by station", statusText: "Not reported" },
        powerDraw: { label: "Charging current", value: value("current_ma"), unit: "mA", limitText: "See diagnostic rules", statusText: "Recorded" },
        tempRise: { label: "Temperature rise", value: value("temperature_rise_c"), unit: "°C", limitText: "See diagnostic rules", statusText: "Recorded" },
        casingSwell: { label: "Thickness", value: value("thickness_mm"), unit: "mm", limitText: "Compare with selected phone reference", statusText: "Recorded" },
      },
      whyReasons: [report.fault ?? `Station grade ${grade ?? "not reported"}${report.health_score === null ? "" : ` · health score ${report.health_score}%`}. Review readings before deciding.`],
      activity: [{ label: "Station report received", time: recorded, type: "completed" as const }],
      diagnosticResult: result, diagnosticResultDescription: "Review the full station readings in Diagnostics before recording an operator disposition.",
      processingDecision: "Review in Diagnostics", processingDecisionSubtitle: "The operator disposition is recorded in the scan result review.",
      info: { deviceType: "Not identified by station", model: "Not identified by station", nominalWeight: "Select a reference in Diagnostics", measuredWeight: value("weight_g") === "—" ? "Not recorded" : `${value("weight_g")} g`, intakeBatch: report.station_id, received: recorded, collectionCenter: "Not recorded" },
    };
  } catch {
    return fallback;
  }
}

// --- Server Component Page ---
export default async function DeviceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchDeviceDetails(id);

  return (
    <div className="min-h-screen bg-[#f3f5f3] text-[#15271f] font-sans antialiased pb-16">
      <TopNav />
      <main className="w-full px-6 md:px-10 max-w-[1440px] mx-auto mt-7">
        {/* 2. PAGE HEADER & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] md:text-[28px] font-extrabold text-[#15271f] tracking-tight leading-tight">
              {data.deviceId}
            </h1>
            <p className="text-[13px] text-[#718077] mt-1">
              Inventory / Device detail. {data.deviceType}, {data.modelName}, tested at{" "}
              {data.testTime}.{!data.isLive && " Sample data."}
            </p>
          </div>

          <div>
            <Link
              href="/inventory"
              className="bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] text-[13px] font-semibold px-4 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors cursor-pointer inline-flex items-center"
            >
              Back to inventory
            </Link>
          </div>
        </div>

        {/* 3. SAFETY ALERT BANNER */}
        {data.hasSafetyAlert && (
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 md:p-6 border border-[#e5ebe7] border-l-[5px] border-l-[#dc2626] flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
            <div className="flex items-start sm:items-center gap-3.5">
              <WarningTriangleIcon className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <div className="font-bold text-[14px] text-[#15271f] leading-snug">
                  {data.alertTitle}
                </div>
                <div className="text-[12px] text-[#718077] mt-0.5">
                  {data.alertSubtext}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] text-[12px] font-semibold px-4 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors cursor-pointer shrink-0 self-start md:self-auto"
            >
              Acknowledge alert
            </button>
          </div>
        )}

        {/* 4. MAIN CONTENT GRID (TWO COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          {/* LEFT COLUMN (Wider, 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Full readings */}
            <div className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[16px] font-extrabold text-[#15271f] tracking-tight">
                    Full readings
                  </h2>
                  <p className="text-[12px] text-[#718077] mt-0.5">
                    {data.fullReadingsSubtitle}
                  </p>
                </div>
                <span className="bg-[#f0f3f1] text-[#65756c] px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap">
                  Completed {data.completedTime}
                </span>
              </div>

              {/* 4-Column Grid for Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mt-5">
                {/* Metric 1: Battery ESR */}
                <div className="border border-[#e6eae7] rounded-xl p-4 flex flex-col justify-between min-h-[140px] bg-white">
                  <div className="text-[12px] font-medium text-[#65756c]">
                    {data.metrics.batteryEsr.label}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-[26px] font-extrabold text-[#15271f] tracking-tight leading-none">
                        {data.metrics.batteryEsr.value}
                      </span>
                      <span className="text-[13px] font-semibold text-[#65756c]">
                        {data.metrics.batteryEsr.unit}
                      </span>
                    </div>
                    {/* Thick Red Indicator Bar */}
                    <div className="h-1.5 w-full bg-[#dc2626] rounded-full my-2.5" />
                    <div className="text-[11px] text-[#718077]">
                      {data.metrics.batteryEsr.limitText}
                    </div>
                    <div className="text-[11px] font-bold text-[#dc2626] mt-0.5">
                      {data.metrics.batteryEsr.statusText}
                    </div>
                  </div>
                </div>

                {/* Metric 2: Power draw */}
                <div className="border border-[#e6eae7] rounded-xl p-4 flex flex-col justify-between min-h-[140px] bg-white">
                  <div className="text-[12px] font-medium text-[#65756c]">
                    {data.metrics.powerDraw.label}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-[26px] font-extrabold text-[#15271f] tracking-tight leading-none">
                        {data.metrics.powerDraw.value}
                      </span>
                      <span className="text-[13px] font-semibold text-[#65756c]">
                        {data.metrics.powerDraw.unit}
                      </span>
                    </div>
                    {/* Thick Red Indicator Bar */}
                    <div className="h-1.5 w-full bg-[#dc2626] rounded-full my-2.5" />
                    <div className="text-[11px] text-[#718077]">
                      {data.metrics.powerDraw.limitText}
                    </div>
                    <div className="text-[11px] font-bold text-[#dc2626] mt-0.5">
                      {data.metrics.powerDraw.statusText}
                    </div>
                  </div>
                </div>

                {/* Metric 3: Temperature rise */}
                <div className="border border-[#e6eae7] rounded-xl p-4 flex flex-col justify-between min-h-[140px] bg-white">
                  <div className="text-[12px] font-medium text-[#65756c]">
                    {data.metrics.tempRise.label}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-[26px] font-extrabold text-[#15271f] tracking-tight leading-none">
                        {data.metrics.tempRise.value}
                      </span>
                      <span className="text-[13px] font-semibold text-[#65756c]">
                        {data.metrics.tempRise.unit}
                      </span>
                    </div>
                    {/* Thick Red Indicator Bar */}
                    <div className="h-1.5 w-full bg-[#dc2626] rounded-full my-2.5" />
                    <div className="text-[11px] text-[#718077]">
                      {data.metrics.tempRise.limitText}
                    </div>
                    <div className="text-[11px] font-bold text-[#dc2626] mt-0.5">
                      {data.metrics.tempRise.statusText}
                    </div>
                  </div>
                </div>

                {/* Metric 4: Casing swell */}
                <div className="border border-[#e6eae7] rounded-xl p-4 flex flex-col justify-between min-h-[140px] bg-white">
                  <div className="text-[12px] font-medium text-[#65756c]">
                    {data.metrics.casingSwell.label}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-[26px] font-extrabold text-[#15271f] tracking-tight leading-none">
                        {data.metrics.casingSwell.value}
                      </span>
                      <span className="text-[13px] font-semibold text-[#65756c]">
                        {data.metrics.casingSwell.unit}
                      </span>
                    </div>
                    {/* Thick Red Indicator Bar */}
                    <div className="h-1.5 w-full bg-[#dc2626] rounded-full my-2.5" />
                    <div className="text-[11px] text-[#718077]">
                      {data.metrics.casingSwell.limitText}
                    </div>
                    <div className="text-[11px] font-bold text-[#dc2626] mt-0.5">
                      {data.metrics.casingSwell.statusText}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Why this result */}
            <div className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6">
              <h2 className="text-[16px] font-extrabold text-[#15271f] tracking-tight">
                Why this result
              </h2>
              <p className="text-[12px] text-[#718077] mt-0.5 mb-3.5">
                The readings that caused the {data.diagnosticResult} result.
              </p>

              <div className="space-y-2">
                {data.whyReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[12px] text-[#33443a]">
                    <WarningTriangleIcon className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                    <span className="leading-snug">{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Activity */}
            <div className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6">
              <h2 className="text-[16px] font-extrabold text-[#15271f] tracking-tight">
                Activity
              </h2>
              <p className="text-[12px] text-[#718077] mt-0.5 mb-3">
                What happened to this device, in order.
              </p>

              <div className="divide-y divide-[#f1f4f2]">
                {data.activity.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      {item.type === "completed" && <GreenCheckIcon />}
                      {item.type === "alert" && (
                        <WarningTriangleIcon className="w-4 h-4 text-[#dc2626]" />
                      )}
                      {item.type === "pending" && <ClockIcon />}
                      <span className="text-[13px] font-bold text-[#15271f]">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#718077] font-medium">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Narrower, 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Decision Card */}
            <div className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="p-6 pb-4">
                <h2 className="text-[16px] font-extrabold text-[#15271f] tracking-tight">
                  Decision
                </h2>
                <p className="text-[12px] text-[#718077] mt-0.5 leading-relaxed">
                  The diagnostic result is a suggestion. The processing decision is final only after verification.
                </p>
              </div>

              {/* Top section: Diagnostic result */}
              <div className="px-6 mb-4">
                <div className="border border-[#e6eae7] rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#15271f]">
                      Diagnostic result
                    </span>
                    <span className="bg-[#f0f3f1] text-[#65756c] px-2 py-0.5 rounded text-[11px] font-medium">
                      Automated
                    </span>
                  </div>

                  <div className="my-2.5">
                    {data.diagnosticResult === "Disposal" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fef0ed] text-[#dc2626]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                        Disposal
                      </span>
                    ) : data.diagnosticResult === "Recycle / Safe Dismantling" ||
                      data.diagnosticResult === "Resellable / Refurbishable" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e7f7ee] text-[#15803d]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                        {data.diagnosticResult}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f0f3f1] text-[#65756c]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9aa79f]" />
                        {data.diagnosticResult}
                      </span>
                    )}
                  </div>

                  <p className="text-[12px] text-[#55665d] leading-snug">
                    {data.diagnosticResultDescription}
                  </p>
                </div>
              </div>

            </div>

            {/* Device info Card */}
            <div className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6">
              <h2 className="text-[16px] font-extrabold text-[#15271f] tracking-tight mb-2">
                Device info
              </h2>

              <div className="divide-y divide-[#f1f4f2]">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-[#718077]">Device type</span>
                  <span className="text-[12px] font-bold text-[#15271f]">
                    {data.info.deviceType}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-[#718077]">Model</span>
                  <span className="text-[12px] font-bold text-[#15271f]">
                    {data.info.model}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-[#718077]">Nominal weight</span>
                  <span className="text-[12px] font-bold text-[#15271f]">
                    {data.info.nominalWeight}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-[#718077]">Measured weight</span>
                  <span className="text-[12px] font-bold text-[#15271f]">
                    {data.info.measuredWeight}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-[#718077]">Intake batch</span>
                  <span className="text-[12px] font-bold text-[#15271f]">
                    {data.info.intakeBatch}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-[#718077]">Received</span>
                  <span className="text-[12px] font-bold text-[#15271f]">
                    {data.info.received}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
