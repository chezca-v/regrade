import { loadDiagnosticRecords } from "@/lib/diagnostic-records";
import InventoryPage from "../inventory";

export const dynamic = "force-dynamic";

export default async function Page() {
  const records = await loadDiagnosticRecords();
  return <InventoryPage records={records} />;
}
