export const SETTINGS_STORAGE_KEY = "regrade-dashboard-settings-v1";

export type StationMode = "live" | "demo";

/** Reads the operator's station-mode preference saved from the Settings page. */
export function getStationMode(): StationMode {
  if (typeof window === "undefined") return "live";
  try {
    const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!saved) return "live";
    const values = JSON.parse(saved) as Record<string, unknown>;
    return values.stationMode === "demo" ? "demo" : "live";
  } catch {
    return "live";
  }
}
