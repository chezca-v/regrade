import Link from "next/link";
import { TopNav } from "@/app/components/TopNav";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

interface PageProps {
  params: Promise<{ id: string }>;
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

function WarningTriangleIcon({ className = "w-4 h-4 text-[#dc2626]" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
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
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#718077"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// --- Dynamic Data Loader ---
async function fetchDeviceDetails(deviceId: string) {
  // Default values matching the design mock for REG-20261013-004
  const defaultData = {
    deviceId: deviceId || "REG-20261013-004",
    deviceType: "Smartphone",
    modelName: "Model X14 (placeholder)",
    testTime: "13:57",
    hasSafetyAlert: true,
    alertTitle: "Safety alert: battery swelling on this device",
    alertSubtext: "Wear gloves and move the device to the quarantine shelf. Do not charge it.",
    completedTime: "13:57",
    fullReadingsSubtitle: "All four readings are outside their limits.",
    metrics: {
      batteryEsr: {
        label: "Battery ESR",
        value: "412",
        unit: "mΩ",
        limitText: "Limit 250 mΩ",
        statusText: "Over limit",
        isAlert: true,
      },
      powerDraw: {
        label: "Power draw",
        value: "980",
        unit: "mA",
        limitText: "Range 500 to 800 mA",
        statusText: "Above range",
        isAlert: true,
      },
      tempRise: {
        label: "Temperature rise",
        value: "16.2",
        unit: "°C",
        limitText: "Limit 15 °C",
        statusText: "Over limit",
        isAlert: true,
      },
      casingSwell: {
        label: "Casing swell",
        value: "4.1",
        unit: "mm",
        limitText: "Hazard above 3.5 mm",
        statusText: "Over hazard limit",
        isAlert: true,
      },
    },
    whyReasons: [
      "Casing swell is 4.1 mm. The hazard limit is 3.5 mm.",
      "Temperature rise is 16.2 °C. The limit is 15 °C.",
      "Battery ESR is 412 mΩ, above the 250 mΩ placeholder limit.",
      "Power draw is 980 mA, above the expected 500 to 800 mA range.",
    ],
    activity: [
      { label: "Scan completed", time: "13:52", type: "completed" },
      { label: "Electrical check completed", time: "13:54", type: "completed" },
      { label: "Graded as Disposal", time: "13:57", type: "completed" },
      { label: "Safety alert raised", time: "13:57", type: "alert" },
      { label: "Waiting for operator verification", time: "Now", type: "pending" },
    ],
    diagnosticResult: "Disposal",
    diagnosticResultDescription:
      "Heavy casing swelling and a thermal rise. Suggested destination is Bin C.",
    processingDecision: "Awaiting verification",
    processingDecisionSubtitle:
      "Not yet verified. Confirm to route to Bin C, or override with a reason.",
    info: {
      deviceType: "Smartphone",
      model: "Model X14 (placeholder)",
      nominalWeight: "174 g",
      measuredWeight: "171 g",
      intakeBatch: "BATCH-1013-A",
      received: "13 Oct 2026, 13:49",
      collectionCenter: "Sample recycling center",
    },
  };

  // Attempt database query if Supabase credentials are configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return defaultData;
  }

  try {
    const supabase = await createClient();

    // Determine numerical session ID from string ID if applicable
    let numericSessionId: number | null = null;
    if (/^\d+$/.test(deviceId)) {
      numericSessionId = parseInt(deviceId, 10);
    } else {
      const match = deviceId.match(/-(\d+)$/);
      if (match) {
        numericSessionId = parseInt(match[1], 10);
      }
    }

    if (numericSessionId === null) {
      return defaultData;
    }

    // Query session diagnostic summary from view
    const { data: diagnosticRow } = await supabase
      .from("dashboard_diagnostics")
      .select("*")
      .eq("session_id", numericSessionId)
      .maybeSingle();

    // Query sensor readings
    const { data: readings } = await supabase
      .from("sensor_reading")
      .select("*")
      .eq("session_id", numericSessionId);

    // Query active alerts
    const { data: alerts } = await supabase
      .from("alert")
      .select("*")
      .eq("session_id", numericSessionId)
      .order("created_at", { ascending: false });

    // Query grade result
    const { data: gradeResult } = await supabase
      .from("grade_result")
      .select("*")
      .eq("session_id", numericSessionId)
      .maybeSingle();

    // Query rule set if available
    let activeRule: Database["public"]["Tables"]["grading_rule_set"]["Row"] | null = null;
    if (gradeResult?.rule_version_id) {
      const { data: ruleData } = await supabase
        .from("grading_rule_set")
        .select("*")
        .eq("rule_version_id", gradeResult.rule_version_id)
        .maybeSingle();
      activeRule = ruleData;
    }

    if (!diagnosticRow && !readings && !alerts) {
      return defaultData;
    }

    // Merge database record into data structure
    const formatTime = (isoString?: string | null) => {
      if (!isoString) return defaultData.testTime;
      const d = new Date(isoString);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    const timeStr = formatTime(diagnosticRow?.started_at);

    // Sensor readings map
    const esrReading = readings?.find((r) => r.sensor_type.toLowerCase().includes("esr"));
    const currentReading = readings?.find(
      (r) => r.sensor_type.toLowerCase().includes("current") || r.sensor_type.toLowerCase().includes("power"),
    );
    const tempReading = readings?.find((r) => r.sensor_type.toLowerCase().includes("temp"));
    const swellReading = readings?.find(
      (r) => r.sensor_type.toLowerCase().includes("swell") || r.sensor_type.toLowerCase().includes("thickness"),
    );
    const weightReading = readings?.find((r) => r.sensor_type.toLowerCase().includes("weight"));

    const grade = diagnosticRow?.final_grade ?? gradeResult?.final_grade ?? "D";
    const mappedResult =
      grade === "D"
        ? "Disposal"
        : grade === "C"
        ? "Recycle / Safe Dismantling"
        : "Resellable / Refurbishable";

    const hasAlert = Boolean(alerts && alerts.length > 0) || grade === "D";

    return {
      deviceId,
      deviceType:
        diagnosticRow?.device_type === "charger" ? "5V Charger" : "Smartphone",
      modelName: diagnosticRow?.model_name ?? defaultData.modelName,
      testTime: timeStr,
      hasSafetyAlert: hasAlert,
      alertTitle: alerts?.[0]?.message ?? defaultData.alertTitle,
      alertSubtext: defaultData.alertSubtext,
      completedTime: timeStr,
      fullReadingsSubtitle: defaultData.fullReadingsSubtitle,
      metrics: {
        batteryEsr: {
          label: "Battery ESR",
          value: esrReading ? String(esrReading.value) : defaultData.metrics.batteryEsr.value,
          unit: esrReading?.unit || "mΩ",
          limitText: activeRule ? `Limit ${activeRule.zero_current_ma || 250} mΩ` : defaultData.metrics.batteryEsr.limitText,
          statusText: defaultData.metrics.batteryEsr.statusText,
          isAlert: true,
        },
        powerDraw: {
          label: "Power draw",
          value: currentReading ? String(currentReading.value) : defaultData.metrics.powerDraw.value,
          unit: currentReading?.unit || "mA",
          limitText: activeRule ? `Overcurrent ${activeRule.overcurrent_ma} mA` : defaultData.metrics.powerDraw.limitText,
          statusText: defaultData.metrics.powerDraw.statusText,
          isAlert: true,
        },
        tempRise: {
          label: "Temperature rise",
          value: tempReading ? String(tempReading.value) : defaultData.metrics.tempRise.value,
          unit: tempReading?.unit || "°C",
          limitText: activeRule ? `Limit ${activeRule.temp_rise_c} °C` : defaultData.metrics.tempRise.limitText,
          statusText: defaultData.metrics.tempRise.statusText,
          isAlert: true,
        },
        casingSwell: {
          label: "Casing swell",
          value: swellReading ? String(swellReading.value) : defaultData.metrics.casingSwell.value,
          unit: swellReading?.unit || "mm",
          limitText: activeRule ? `Hazard above ${activeRule.thickness_swell_mm} mm` : defaultData.metrics.casingSwell.limitText,
          statusText: defaultData.metrics.casingSwell.statusText,
          isAlert: true,
        },
      },
      whyReasons: defaultData.whyReasons,
      activity: defaultData.activity,
      diagnosticResult: mappedResult,
      diagnosticResultDescription:
        grade === "D"
          ? "Heavy casing swelling and a thermal rise. Suggested destination is Bin C."
          : "Device within expected triage operating range.",
      processingDecision: "Awaiting verification",
      processingDecisionSubtitle:
        grade === "D"
          ? "Not yet verified. Confirm to route to Bin C, or override with a reason."
          : "Ready for operator verification.",
      info: {
        deviceType: diagnosticRow?.device_type === "charger" ? "5V Charger" : "Smartphone",
        model: diagnosticRow?.model_name ?? defaultData.info.model,
        nominalWeight: defaultData.info.nominalWeight,
        measuredWeight: weightReading ? `${weightReading.value} g` : defaultData.info.measuredWeight,
        intakeBatch: defaultData.info.intakeBatch,
        received: defaultData.info.received,
        collectionCenter: defaultData.info.collectionCenter,
      },
    };
  } catch {
    return defaultData;
  }
}

// --- Server Component Page ---
export default async function DeviceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchDeviceDetails(id);

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
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-[#163d2d] rounded-full shadow-xs"
            >
              Inventory
            </Link>
            <Link
              href="/#sorting"
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
              {data.deviceId}
            </h1>
            <p className="text-[13px] text-[#718077] mt-1">
              Inventory / Device detail. {data.deviceType}, {data.modelName}, tested at{" "}
              {data.testTime}. Sample data.
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
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e7f7ee] text-[#15803d]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                        {data.diagnosticResult}
                      </span>
                    )}
                  </div>

                  <p className="text-[12px] text-[#55665d] leading-snug">
                    {data.diagnosticResultDescription}
                  </p>
                </div>
              </div>

              {/* Bottom section (Gray background): Processing decision */}
              <div className="px-6 pb-6">
                <div className="rounded-xl p-4 bg-[#f5f8f6] border border-[#e5ebe7]">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#15271f]">
                      Processing decision
                    </span>
                    <span className="text-[11px] text-[#718077] font-medium">
                      Needs operator
                    </span>
                  </div>

                  <div className="my-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fef6e5] text-[#b45309]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                      {data.processingDecision}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#55665d] leading-snug mb-3.5">
                    {data.processingDecisionSubtitle}
                  </p>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      className="bg-[#246e4c] hover:bg-[#1d5c3f] text-white text-[12px] font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Verify and route
                    </button>
                    <button
                      type="button"
                      className="bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] text-[12px] font-semibold px-4 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer"
                    >
                      Override
                    </button>
                  </div>
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
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-[#718077]">Collection center</span>
                  <span className="text-[12px] font-bold text-[#15271f]">
                    {data.info.collectionCenter}
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
