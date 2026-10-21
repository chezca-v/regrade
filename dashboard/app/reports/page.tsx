import { loadDiagnosticRecords } from "@/lib/diagnostic-records";
import ReportsPage from "../reports";

export const dynamic = "force-dynamic";

export default async function Page() {
  const records = await loadDiagnosticRecords();
  return <ReportsPage records={records} />;
}
