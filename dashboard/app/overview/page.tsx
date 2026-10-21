import { loadDiagnosticRecords } from "@/lib/diagnostic-records";
import DashboardPage from "../dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const records = await loadDiagnosticRecords();
  return <DashboardPage records={records} />;
}
