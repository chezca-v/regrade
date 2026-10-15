"use client";

import React, { useState } from "react";
import Link from "next/link";

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

function SlidersIcon({ isActive = false }: { isActive?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={isActive ? "#163d2d" : "#55645c"}
      strokeWidth={isActive ? "2.4" : "1.8"}
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

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6b7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#246e4c]" : "bg-[#dce3de]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
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

          {/* Center Links (None active as pill on Settings page) */}
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
              className="px-4 py-1.5 text-[13px] font-medium text-[#46564e] hover:text-[#15271f] transition-colors rounded-full"
            >
              Inventory
            </Link>
            <Link
              href="/sorting"
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

          {/* Right Actions: Settings icon active */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-black/5 text-[#55645c] transition-colors"
              aria-label="Notifications"
            >
              <BellIcon />
            </button>
            <Link
              href="/settings"
              className="p-1.5 rounded-full bg-black/5 text-[#163d2d] transition-colors"
              aria-label="Settings (Active)"
            >
              <SlidersIcon isActive={true} />
            </Link>
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
              Settings
            </h1>
            <p className="text-[13px] text-[#718077] mt-1">
              Notifications, display and data source. Grading limits are view only.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedMessage && (
              <span className="text-[12px] font-semibold text-[#15803d] animate-fade-in">
                Saved!
              </span>
            )}
            <button
              type="button"
              onClick={handleDiscard}
              className="bg-white border border-[#d9e0db] hover:bg-[#f9faf9] text-[#2c3d34] text-[13px] font-semibold px-4 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors cursor-pointer"
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#246e4c] hover:bg-[#1d5c3f] text-white text-[13px] font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Save changes
            </button>
          </div>
        </div>

        {/* 3. MAIN CONTENT GRID (TWO COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          {/* LEFT COLUMN (Wider, 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Notifications Card */}
            <div className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6">
              <h2 className="text-[17px] font-extrabold text-[#15271f] tracking-tight">
                Notifications
              </h2>
              <p className="text-[12px] text-[#718077] mt-0.5 mb-5">
                Choose how the team hears about results and hazards.
              </p>

              <div className="divide-y divide-[#f1f4f2]">
                {/* Row 1 */}
                <div className="py-4 flex items-center justify-between gap-4 first:pt-0">
                  <div>
                    <div className="text-[13px] font-bold text-[#15271f]">
                      Safety alert pop-up
                    </div>
                    <div className="text-[12px] text-[#718077] mt-0.5">
                      Show a banner on every screen when a Disposal result needs attention.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={safetyAlertPopup}
                    onChange={setSafetyAlertPopup}
                    ariaLabel="Toggle safety alert pop-up"
                  />
                </div>

                {/* Row 2 */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[13px] font-bold text-[#15271f]">
                      Sound for Disposal results
                    </div>
                    <div className="text-[12px] text-[#718077] mt-0.5">
                      Play a short tone when a device is graded as Disposal.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={soundDisposal}
                    onChange={setSoundDisposal}
                    ariaLabel="Toggle sound for Disposal results"
                  />
                </div>

                {/* Row 3 */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[13px] font-bold text-[#15271f]">
                      Awaiting verification reminder
                    </div>
                    <div className="text-[12px] text-[#718077] mt-0.5">
                      Remind the operator after 15 minutes without a decision.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={awaitingReminder}
                    onChange={setAwaitingReminder}
                    ariaLabel="Toggle awaiting verification reminder"
                  />
                </div>

                {/* Row 4 */}
                <div className="py-4 flex items-center justify-between gap-4 last:pb-0">
                  <div>
                    <div className="text-[13px] font-bold text-[#15271f]">
                      Daily summary
                    </div>
                    <div className="text-[12px] text-[#718077] mt-0.5">
                      Create a summary report at the end of each shift.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={dailySummary}
                    onChange={setDailySummary}
                    ariaLabel="Toggle daily summary"
                  />
                </div>
              </div>
            </div>

            {/* Display Card */}
            <div className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6">
              <h2 className="text-[17px] font-extrabold text-[#15271f] tracking-tight">
                Display
              </h2>
              <p className="text-[12px] text-[#718077] mt-0.5 mb-5">
                How readings and times are shown.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Weight unit */}
                <div>
                  <label
                    htmlFor="weight-unit"
                    className="text-[12px] font-bold text-[#15271f] mb-1.5 block"
                  >
                    Weight unit
                  </label>
                  <div className="relative">
                    <select
                      id="weight-unit"
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value)}
                      className="w-full appearance-none bg-white border border-[#dce2de] hover:border-[#c5cdc7] focus:border-[#246e4c] text-[#34443b] text-[13px] font-medium pl-3 pr-8 py-2.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer outline-none transition-colors"
                    >
                      <option>Grams (g)</option>
                      <option>Ounces (oz)</option>
                      <option>Kilograms (kg)</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#75847c]">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>

                {/* Temperature unit */}
                <div>
                  <label
                    htmlFor="temperature-unit"
                    className="text-[12px] font-bold text-[#15271f] mb-1.5 block"
                  >
                    Temperature unit
                  </label>
                  <div className="relative">
                    <select
                      id="temperature-unit"
                      value={temperatureUnit}
                      onChange={(e) => setTemperatureUnit(e.target.value)}
                      className="w-full appearance-none bg-white border border-[#dce2de] hover:border-[#c5cdc7] focus:border-[#246e4c] text-[#34443b] text-[13px] font-medium pl-3 pr-8 py-2.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer outline-none transition-colors"
                    >
                      <option>Degrees Celsius (°C)</option>
                      <option>Degrees Fahrenheit (°F)</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#75847c]">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>

                {/* Time format */}
                <div>
                  <label
                    htmlFor="time-format"
                    className="text-[12px] font-bold text-[#15271f] mb-1.5 block"
                  >
                    Time format
                  </label>
                  <div className="relative">
                    <select
                      id="time-format"
                      value={timeFormat}
                      onChange={(e) => setTimeFormat(e.target.value)}
                      className="w-full appearance-none bg-white border border-[#dce2de] hover:border-[#c5cdc7] focus:border-[#246e4c] text-[#34443b] text-[13px] font-medium pl-3 pr-8 py-2.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer outline-none transition-colors"
                    >
                      <option>24-hour</option>
                      <option>12-hour (AM/PM)</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#75847c]">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label
                    htmlFor="language"
                    className="text-[12px] font-bold text-[#15271f] mb-1.5 block"
                  >
                    Language
                  </label>
                  <div className="relative">
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full appearance-none bg-white border border-[#dce2de] hover:border-[#c5cdc7] focus:border-[#246e4c] text-[#34443b] text-[13px] font-medium pl-3 pr-8 py-2.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer outline-none transition-colors"
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#75847c]">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Narrower, 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Data Source Card */}
            <div className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-[17px] font-extrabold text-[#15271f] tracking-tight">
                    Data source
                  </h2>
                  <p className="text-[12px] text-[#718077] mt-0.5">
                    Where the dashboard gets its values.
                  </p>
                </div>
                <span className="bg-[#fef6e5] text-[#b45309] px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap">
                  Sample data mode
                </span>
              </div>

              <div className="divide-y divide-[#f1f4f2] mt-4">
                {/* Use sample data toggle */}
                <div className="py-3.5 flex items-center justify-between gap-4 first:pt-2">
                  <div>
                    <div className="text-[13px] font-bold text-[#15271f]">
                      Use sample data
                    </div>
                    <div className="text-[12px] text-[#718077] mt-0.5">
                      Show placeholder values instead of device messages.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={useSampleData}
                    onChange={setUseSampleData}
                    ariaLabel="Toggle use sample data"
                  />
                </div>

                {/* Connection status */}
                <div className="py-3 flex items-center justify-between text-[12px]">
                  <span className="text-[#718077]">Connection status</span>
                  <span className="font-bold text-[#15271f]">Not connected</span>
                </div>

                {/* Last update */}
                <div className="py-3 flex items-center justify-between text-[12px] last:pb-1">
                  <span className="text-[#718077]">Last update</span>
                  <span className="font-bold text-[#15271f]">None yet</span>
                </div>
              </div>
            </div>

            {/* Grading Limits Card */}
            <div className="bg-white rounded-2xl border border-[#e5ebe7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-[17px] font-extrabold text-[#15271f] tracking-tight">
                    Grading limits
                  </h2>
                  <p className="text-[12px] text-[#718077] mt-0.5">
                    Edited by the team, not during testing.
                  </p>
                </div>
                <span className="bg-[#f0f3f1] text-[#65756c] px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap">
                  View only
                </span>
              </div>

              <div className="divide-y divide-[#f1f4f2] mt-4">
                <div className="py-2.5 flex items-center justify-between text-[12px] first:pt-1">
                  <span className="text-[#718077]">Weight tolerance</span>
                  <span className="font-bold text-[#15271f]">±5% of nominal</span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#718077]">Recycle weight</span>
                  <span className="font-bold text-[#15271f]">Below −15%</span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#718077]">Casing swell limit</span>
                  <span className="font-bold text-[#15271f]">2.0 mm</span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#718077]">Hazard casing swell</span>
                  <span className="font-bold text-[#15271f]">Above 3.5 mm</span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#718077]">Thermal rise limit</span>
                  <span className="font-bold text-[#15271f]">15 °C</span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#718077]">Normal charging draw</span>
                  <span className="font-bold text-[#15271f]">Above 500 mA</span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#718077]">No charging draw</span>
                  <span className="font-bold text-[#15271f]">Below 50 mA</span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-[12px] last:pb-1">
                  <span className="text-[#718077]">Battery ESR limit</span>
                  <span className="font-bold text-[#15271f]">250 mΩ (placeholder)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
