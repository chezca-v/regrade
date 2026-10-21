import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDiagnosticRecords } from "@/lib/diagnostic-records";
import { getReadings, isStableRecord } from "@/lib/diagnostic-record-types";
import { TopNav } from "@/app/components/TopNav";

interface PageProps {
  params: Promise<{ id: string }>;
}

const dispositionLabels = {
  resellable: "Suitable for reuse review",
  recycle: "Recycle review",
  disposal: "Disposal review",
  "needs-review": "Needs more review",
} as const;

export const dynamic = "force-dynamic";

export default async function DeviceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const records = await loadDiagnosticRecords();
  const record = records.find((item) => item.session_id === id);
  if (!record) notFound();

  const stable = isStableRecord(record);
  const readings = getReadings(record.readings);
  const display = (key: string, unit: string) => {
    const value = readings[key];
    return stable && typeof value === "number" ? `${value.toFixed(2)} ${unit}` : "Not available";
  };

  return (
    <div className="min-h-screen bg-[#f3f5f3] text-[#15271f] font-sans antialiased pb-16">
      <TopNav />
      <main className="w-full px-6 md:px-10 max-w-[1440px] mx-auto mt-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] md:text-[28px] font-extrabold tracking-tight">{record.session_id}</h1>
            <p className="text-[13px] text-[#718077] mt-1">Station {record.station_id} · received {new Date(record.reported_at).toLocaleString()}</p>
          </div>
          <Link href="/inventory" className="bg-white border border-[#d9e0db] text-[#2c3d34] text-[13px] font-semibold px-4 py-2 rounded-lg inline-flex items-center">Back to inventory</Link>
        </div>

        {record.fault && <div role="alert" className="bg-white rounded-xl p-5 border border-[#f3c6c1] border-l-[5px] border-l-[#dc2626] mt-6"><strong>Station fault</strong><p className="text-[13px] text-[#718077] mt-1">{record.fault}</p></div>}

        <section className="bg-white rounded-2xl border border-[#e5ebe7] p-6 mt-6">
          <h2 className="text-[16px] font-extrabold">Station report</h2>
          <p className="text-[12px] text-[#718077] mt-1">Status: {record.status} · Stability: {stable ? "confirmed" : "not confirmed"} · duration: {record.duration_ms === null ? "not reported" : `${record.duration_ms} ms`}</p>
          <p className="text-[12px] text-[#718077] mt-1">Firmware grade: {stable ? record.grade ?? "not produced" : "not available"} · health score: {stable ? record.health_score ?? "not reported" : "not available"}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
            {[
              ["Weight", display("weight_g", "g")],
              ["Thickness", display("thickness_mm", "mm")],
              ["Current", display("current_ma", "mA")],
              ["Surface temperature", display("surface_temp_c", "°C")],
              ["Temperature rise", display("temperature_rise_c", "°C")],
            ].map(([label, value]) => <div key={label} className="border border-[#e6eae7] rounded-xl p-4"><span className="text-[12px] text-[#65756c]">{label}</span><p className="text-[20px] font-bold mt-2">{value}</p></div>)}
          </div>
          {!stable && <p className="text-[12px] text-[#718077] mt-4">Raw sensor values are hidden because the station did not confirm stability.</p>}
        </section>

        <section className="bg-white rounded-2xl border border-[#e5ebe7] p-6 mt-6">
          <h2 className="text-[16px] font-extrabold">Saved operator review</h2>
          <p className="text-[13px] text-[#718077] mt-2">
            {record.review
              ? `${dispositionLabels[record.review.decision]}${record.phoneReference ? ` · ${record.phoneReference.brand} ${record.phoneReference.model_name}` : ""} · saved ${new Date(record.review.created_at).toLocaleString()}`
              : "No review is saved for this account."}
          </p>
          {record.review?.notes && <p className="text-[13px] text-[#718077] mt-2">Notes: {record.review.notes}</p>}
          <p className="text-[12px] text-[#718077] mt-3">Operator disposition is a review record, not an automated device-safety determination.</p>
        </section>
      </main>
    </div>
  );
}
