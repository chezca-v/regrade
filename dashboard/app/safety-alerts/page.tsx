import { redirect } from "next/navigation";

export default function SafetyAlertsPage() {
  redirect("/diagnostics");
}
