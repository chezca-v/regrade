import type { Metadata } from "next";
import ExhibitKiosk from "./ExhibitKiosk";

export const metadata: Metadata = {
  title: "ReGrade | Exhibit mode",
  description:
    "A looping exhibit presentation about ReGrade, a non-destructive smartphone and USB charger triage prototype.",
};

export default function ExhibitPage() {
  return <ExhibitKiosk />;
}
