"use client";

import React, { useState } from "react";
import { TopNav } from "../components/TopNav";

// --- Chevron Icon for Selects ---
function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// --- Toggle Switch Component ---
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}

function ToggleSwitch({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`rg-toggle${checked ? " rg-toggle--on" : " rg-toggle--off"}`}
    >
      <span aria-hidden="true" className="rg-toggle__knob" />
    </button>
  );
}

export default function SettingsPage() {
  // Notification Toggles
  const [safetyAlertPopup, setSafetyAlertPopup] = useState(true);
  const [soundDisposal, setSoundDisposal] = useState(true);
  const [awaitingReminder, setAwaitingReminder] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);

  // Display Settings
  const [weightUnit, setWeightUnit] = useState("Grams (g)");
  const [temperatureUnit, setTemperatureUnit] = useState("Degrees Celsius (°C)");
  const [timeFormat, setTimeFormat] = useState("24-hour");
  const [language, setLanguage] = useState("English");

  // Data Source Settings
  const [useSampleData, setUseSampleData] = useState(true);

  // Save feedback state
  const [savedMessage, setSavedMessage] = useState(false);

  const handleDiscard = () => {
    setSafetyAlertPopup(true);
    setSoundDisposal(true);
    setAwaitingReminder(true);
    setDailySummary(false);
    setWeightUnit("Grams (g)");
    setTemperatureUnit("Degrees Celsius (°C)");
    setTimeFormat("24-hour");
    setLanguage("English");
    setUseSampleData(true);
    setSavedMessage(false);
  };

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          {/* Title Bar */}
          <div className="rg-titlebar">
            <div>
              <h1>Settings</h1>
              <p className="rg-sub">
                Notifications, display and data source. Grading limits are view only.
              </p>
            </div>
            <div className="rg-titlebar__actions">
              <button type="button" className="rg-btn" onClick={handleDiscard}>
                Discard changes
              </button>
              <button
                type="button"
                className="rg-btn rg-btn--primary"
                onClick={handleSave}
              >
                Save changes
              </button>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="rg-settings-grid">
            {/* Left Column */}
            <div className="rg-settings-col">
              {/* Card 1: Notifications */}
              <section className="rg-card rg-card--pad" aria-labelledby="notifications-heading">
                <div className="rg-card-head">
                  <h3 id="notifications-heading">Notifications</h3>
                  <p className="rg-sub">
                    Choose how the team hears about results and hazards.
                  </p>
                </div>
                <div className="rg-settings-list">
                  <div className="rg-setting-row">
                    <div className="rg-setting-info">
                      <span className="rg-setting-title">Safety alert pop-up</span>
                      <span className="rg-setting-desc">
                        Show a banner on every screen when a Disposal result needs attention.
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={safetyAlertPopup}
                      onChange={setSafetyAlertPopup}
                      ariaLabel="Safety alert pop-up"
                    />
                  </div>

                  <div className="rg-setting-row">
                    <div className="rg-setting-info">
                      <span className="rg-setting-title">Sound for Disposal results</span>
                      <span className="rg-setting-desc">
                        Play a short tone when a device is graded as Disposal.
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={soundDisposal}
                      onChange={setSoundDisposal}
                      ariaLabel="Sound for Disposal results"
                    />
                  </div>

                  <div className="rg-setting-row">
                    <div className="rg-setting-info">
                      <span className="rg-setting-title">Awaiting verification reminder</span>
                      <span className="rg-setting-desc">
                        Remind the operator after 15 minutes without a decision.
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={awaitingReminder}
                      onChange={setAwaitingReminder}
                      ariaLabel="Awaiting verification reminder"
                    />
                  </div>

                  <div className="rg-setting-row" style={{ borderBottom: "none" }}>
                    <div className="rg-setting-info">
                      <span className="rg-setting-title">Daily summary</span>
                      <span className="rg-setting-desc">
                        Create a summary report at the end of each shift.
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={dailySummary}
                      onChange={setDailySummary}
                      ariaLabel="Daily summary"
                    />
                  </div>
                </div>
              </section>

              {/* Card 2: Display */}
              <section className="rg-card rg-card--pad" aria-labelledby="display-heading">
                <div className="rg-card-head">
                  <h3 id="display-heading">Display</h3>
                  <p className="rg-sub">How readings and times are shown.</p>
                </div>
                <div className="rg-display-grid">
                  <div className="rg-field">
                    <label className="rg-field-label" htmlFor="weight-unit">
                      Weight unit
                    </label>
                    <div className="rg-select-wrap">
                      <select
                        id="weight-unit"
                        className="rg-select"
                        value={weightUnit}
                        onChange={(e) => setWeightUnit(e.target.value)}
                      >
                        <option value="Grams (g)">Grams (g)</option>
                        <option value="Kilograms (kg)">Kilograms (kg)</option>
                        <option value="Ounces (oz)">Ounces (oz)</option>
                      </select>
                      <span className="rg-select-chevron" aria-hidden="true">
                        <ChevronDownIcon />
                      </span>
                    </div>
                  </div>

                  <div className="rg-field">
                    <label className="rg-field-label" htmlFor="temp-unit">
                      Temperature unit
                    </label>
                    <div className="rg-select-wrap">
                      <select
                        id="temp-unit"
                        className="rg-select"
                        value={temperatureUnit}
                        onChange={(e) => setTemperatureUnit(e.target.value)}
                      >
                        <option value="Degrees Celsius (°C)">Degrees Celsius (°C)</option>
                        <option value="Degrees Fahrenheit (°F)">Degrees Fahrenheit (°F)</option>
                      </select>
                      <span className="rg-select-chevron" aria-hidden="true">
                        <ChevronDownIcon />
                      </span>
                    </div>
                  </div>

                  <div className="rg-field">
                    <label className="rg-field-label" htmlFor="time-format">
                      Time format
                    </label>
                    <div className="rg-select-wrap">
                      <select
                        id="time-format"
                        className="rg-select"
                        value={timeFormat}
                        onChange={(e) => setTimeFormat(e.target.value)}
                      >
                        <option value="24-hour">24-hour</option>
                        <option value="12-hour">12-hour</option>
                      </select>
                      <span className="rg-select-chevron" aria-hidden="true">
                        <ChevronDownIcon />
                      </span>
                    </div>
                  </div>

                  <div className="rg-field">
                    <label className="rg-field-label" htmlFor="language">
                      Language
                    </label>
                    <div className="rg-select-wrap">
                      <select
                        id="language"
                        className="rg-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                      </select>
                      <span className="rg-select-chevron" aria-hidden="true">
                        <ChevronDownIcon />
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="rg-settings-col">
              {/* Card 3: Data Source */}
              <section className="rg-card rg-card--pad" aria-labelledby="datasource-heading">
                <div className="rg-row rg-row--between">
                  <h3 id="datasource-heading" style={{ margin: 0 }}>Data source</h3>
                  <span className="rg-tag-amber">Sample data mode</span>
                </div>
                <p className="rg-sub" style={{ marginTop: 4 }}>
                  Where the dashboard gets its values.
                </p>

                <div className="rg-settings-list" style={{ marginTop: 8 }}>
                  <div className="rg-setting-row" style={{ padding: "14px 0" }}>
                    <div className="rg-setting-info">
                      <span className="rg-setting-title">Use sample data</span>
                      <span className="rg-setting-desc">
                        Show placeholder values instead of device messages.
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={useSampleData}
                      onChange={setUseSampleData}
                      ariaLabel="Use sample data"
                    />
                  </div>

                  <div
                    className="rg-row rg-row--between"
                    style={{ padding: "12px 0", borderBottom: "1px solid var(--rg-line-soft)" }}
                  >
                    <span className="rg-muted" style={{ fontSize: "12.5px" }}>
                      Connection status
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--rg-ink)" }}>
                      Not connected
                    </span>
                  </div>

                  <div className="rg-row rg-row--between" style={{ padding: "12px 0 2px" }}>
                    <span className="rg-muted" style={{ fontSize: "12.5px" }}>
                      Last update
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--rg-ink)" }}>
                      None yet
                    </span>
                  </div>
                </div>
              </section>

              {/* Card 4: Grading Limits */}
              <section className="rg-card rg-card--pad" aria-labelledby="limits-heading">
                <div className="rg-row rg-row--between">
                  <h3 id="limits-heading" style={{ margin: 0 }}>Grading limits</h3>
                  <span className="rg-tag-gray">View only</span>
                </div>
                <p className="rg-sub" style={{ marginTop: 4 }}>
                  Edited by the team, not during testing.
                </p>

                <div className="rg-limits-list">
                  <div className="rg-limit-row">
                    <span className="rg-limit-label">Weight tolerance</span>
                    <span className="rg-limit-val">±5% of nominal</span>
                  </div>
                  <div className="rg-limit-row">
                    <span className="rg-limit-label">Recycle weight</span>
                    <span className="rg-limit-val">Below −15%</span>
                  </div>
                  <div className="rg-limit-row">
                    <span className="rg-limit-label">Casing swell limit</span>
                    <span className="rg-limit-val">2.0 mm</span>
                  </div>
                  <div className="rg-limit-row">
                    <span className="rg-limit-label">Hazard casing swell</span>
                    <span className="rg-limit-val">Above 3.5 mm</span>
                  </div>
                  <div className="rg-limit-row">
                    <span className="rg-limit-label">Thermal rise limit</span>
                    <span className="rg-limit-val">15 °C</span>
                  </div>
                  <div className="rg-limit-row">
                    <span className="rg-limit-label">Normal charging draw</span>
                    <span className="rg-limit-val">Above 500 mA</span>
                  </div>
                  <div className="rg-limit-row">
                    <span className="rg-limit-label">No charging draw</span>
                    <span className="rg-limit-val">Below 50 mA</span>
                  </div>
                  <div className="rg-limit-row" style={{ borderBottom: "none" }}>
                    <span className="rg-limit-label">Battery ESR limit</span>
                    <span className="rg-limit-val">
                      250 mΩ{" "}
                      <span style={{ fontWeight: 400, color: "var(--rg-muted)" }}>
                        (placeholder)
                      </span>
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Toast feedback */}
          {savedMessage && (
            <div className="rg-toast-success" role="status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Settings saved successfully</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
