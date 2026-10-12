"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ActiveRule,
  type DiagnosticRecord,
  type DeviceType,
  type Grade,
  type StationRecord,
} from "@/lib/data";
import {
  createClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type Filter = "All devices" | DeviceType;

const gradeLabels: Record<Grade, string> = {
  A: "Refurbish",
  B: "Refurbish",
  C: "Recycle",
  D: "Dispose",
};

const grades: Grade[] = ["A", "B", "C", "D"];

function downloadCsv(rows: DiagnosticRecord[]) {
  const headers = [
    "Record",
    "Model",
    "Type",
    "Grade",
    "Health",
    "Status",
    "Station",
    "Received",
  ];
  const values = rows.map((row) => [
    row.id,
    `${row.brand} ${row.model}`,
    row.type,
    row.grade,
    row.health === null ? "" : `${row.health}%`,
    row.status,
    row.station,
    row.received,
  ]);
  const csv = [headers, ...values]
    .map((line) =>
      line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "regrade-inventory.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function GradeBadge({ grade }: { grade: Grade }) {
  return <span className={`grade-badge grade-${grade.toLowerCase()}`}>{grade}</span>;
}

function formatReceived(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function mapStatus(grade: Grade | null): DiagnosticRecord["status"] {
  if (grade === "D") return "Hazard";
  if (grade === "C") return "Review";
  if (grade === "A" || grade === "B") return "Complete";
  return "Incomplete";
}

export default function DashboardPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All devices");
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<DiagnosticRecord[]>([]);
  const [stations, setStations] = useState<StationRecord[]>([]);
  const [activeRule, setActiveRule] = useState<ActiveRule | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      setLoadError("Supabase is not configured. Add dashboard/.env.local and restart the web server.");
      return;
    }

    let active = true;
    const supabase = createClient();

    async function loadDashboard() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      if (userError) {
        setLoadError(`Could not verify your session: ${userError.message}`);
        setIsLoading(false);
        return;
      }
      if (!userData.user) {
        router.replace("/login");
        return;
      }
      setUserEmail(userData.user.email ?? "Signed-in operator");

      const [diagnostics, stationResult, ruleResult] = await Promise.all([
        supabase
          .from("dashboard_diagnostics")
          .select("*", { count: "exact" })
          .order("started_at", { ascending: false })
          .limit(100),
        supabase
          .from("station")
          .select("station_id,name,firmware_version,last_seen_at")
          .order("name"),
        supabase
          .from("grading_rule_set")
          .select(
            "rule_version_id,weight_min_pct,thickness_swell_mm,thickness_missing_mm,overcurrent_ma,zero_current_ma,temp_rise_c,created_at",
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!active) return;
      const queryErrors = [
        diagnostics.error?.message,
        stationResult.error?.message,
        ruleResult.error?.message,
      ].filter((message): message is string => Boolean(message));
      if (queryErrors.length > 0) {
        setLoadError(
          `Could not load Supabase dashboard data: ${queryErrors.join("; ")}`,
        );
        setIsLoading(false);
        return;
      }

      const loadedRecords: DiagnosticRecord[] = (diagnostics.data ?? []).map(
        (row) => {
          const grade = row.final_grade;
          return {
            id: String(row.session_id),
            model: row.model_name,
            brand: row.brand,
            type: row.device_type === "phone" ? "Smartphone" : "5V Charger",
            grade,
            status: mapStatus(grade),
            health: row.health_score,
            received: formatReceived(row.started_at),
            startedAt: row.started_at,
            station: row.station_name,
            stationId: row.station_id,
          };
        },
      );
      setRecords(loadedRecords);
      setSessionCount(diagnostics.count ?? loadedRecords.length);
      setStations(
        (stationResult.data ?? []).map((station) => ({
          id: station.station_id,
          name: station.name,
          firmwareVersion: station.firmware_version,
          lastSeenAt: station.last_seen_at,
        })),
      );
      setActiveRule(
        ruleResult.data
          ? {
              ruleVersionId: ruleResult.data.rule_version_id,
              weightMinPct: ruleResult.data.weight_min_pct,
              thicknessSwellMm: ruleResult.data.thickness_swell_mm,
              thicknessMissingMm: ruleResult.data.thickness_missing_mm,
              overcurrentMa: ruleResult.data.overcurrent_ma,
              zeroCurrentMa: ruleResult.data.zero_current_ma,
              tempRiseC: ruleResult.data.temp_rise_c,
              createdAt: ruleResult.data.created_at,
            }
          : null,
      );
      setIsLoading(false);
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [router]);

  const now = Date.now();
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesType = filter === "All devices" || record.type === filter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${record.id} ${record.brand} ${record.model} ${record.station}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [filter, query, records]);

  const gradedRecords = records.filter((record) => record.grade !== null);
  const gradeTotals = Object.fromEntries(
    grades.map((grade) => [
      grade,
      gradedRecords.filter((record) => record.grade === grade).length,
    ]),
  ) as Record<Grade, number>;
  const refurbishCount = gradeTotals.A + gradeTotals.B;
  const refurbishPercent =
    gradedRecords.length === 0
      ? 0
      : Math.round((refurbishCount / gradedRecords.length) * 100);
  const totalGrades = grades.reduce((total, grade) => total + gradeTotals[grade], 0);
  let gradeOffset = 0;
  const donutBackground =
    totalGrades === 0
      ? "#e9eeeb"
      : `conic-gradient(${grades
          .map((grade) => {
            const start = gradeOffset;
            gradeOffset += (gradeTotals[grade] / totalGrades) * 100;
            return `var(--grade-${grade.toLowerCase()}) ${start}% ${gradeOffset}%`;
          })
          .join(", ")})`;

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const dayRecords = gradedRecords.filter((record) => {
      const started = new Date(record.startedAt);
      return started.toDateString() === date.toDateString();
    });
    return {
      day: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
      a: dayRecords.filter((record) => record.grade === "A").length,
      b: dayRecords.filter((record) => record.grade === "B").length,
      c: dayRecords.filter((record) => record.grade === "C").length,
      d: dayRecords.filter((record) => record.grade === "D").length,
    };
  });
  const maxDailyGrades = Math.max(
    1,
    ...days.map((day) => day.a + day.b + day.c + day.d),
  );
  const onlineStations = stations.filter(
    (station) =>
      station.lastSeenAt !== null &&
      now - new Date(station.lastSeenAt).getTime() < 5 * 60 * 1000,
  ).length;

  async function signOut() {
    const { error } = await createClient().auth.signOut();
    if (error) {
      setLoadError(`Could not sign out: ${error.message}`);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  if (isLoading) {
    return <main className="auth-shell"><p className="auth-description">Loading ReGrade dashboard…</p></main>;
  }

  if (loadError) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <a className="brand-lockup auth-brand" href="/" aria-label="ReGrade home">
            <span className="brand-mark">R</span>
            <span><strong>regrade</strong><small>TRIAGE PLATFORM</small></span>
          </a>
          <h1>Dashboard unavailable</h1>
          <p className="auth-message auth-error" role="alert">{loadError}</p>
          <p className="auth-footnote">Check your Supabase project URL, publishable key, database migration, and signed-in account.</p>
          <button className="button button-secondary" onClick={() => router.replace("/login")}>Go to sign in</button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href="#overview" aria-label="ReGrade home">
          <span className="brand-mark">R</span>
          <span>
            <strong>regrade</strong>
            <small>TRIAGE PLATFORM</small>
          </span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#overview">
            <span className="nav-icon">▦</span> Overview
          </a>
          <a className="nav-item" href="#inventory">
            <span className="nav-icon">▤</span> Device inventory
            <span className="nav-count">{sessionCount}</span>
          </a>
          <a className="nav-item" href="#stations">
            <span className="nav-icon">⌁</span> Test stations
          </a>
          <a className="nav-item" href="#grading-rules">
            <span className="nav-icon">◷</span> Grading rules
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="demo-note">
            <span className="demo-pulse" />
            Supabase connected
            <small>Authenticated read access</small>
          </div>
          <div className="user-card">
            <div className="avatar">CV</div>
            <div className="user-details">
              <strong>{userEmail}</strong>
              <span>Signed-in operator</span>
            </div>
            <button className="user-menu" onClick={signOut} aria-label="Sign out">↪</button>
          </div>
        </div>
      </aside>

      <section className="main-panel" id="overview">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Overview</strong>
          </div>
          <div className="topbar-right">
            <span className="live-indicator"><i /> Supabase</span>
            <button className="button button-secondary" onClick={signOut}>Sign out</button>
            <div className="top-avatar">RG</div>
          </div>
        </header>

        <div className="content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">
                {new Intl.DateTimeFormat(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date()).toUpperCase()}
              </p>
              <h1>ReGrade overview <span>✳</span></h1>
              <p className="heading-subtitle">
                Here&apos;s what&apos;s happening at your triage stations today.
              </p>
            </div>
            <button className="button button-primary" onClick={() => downloadCsv(filteredRecords)}>
              <span aria-hidden="true">↓</span> Export inventory
            </button>
          </section>

          <section className="metric-grid" aria-label="Inventory summary">
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Devices processed</span>
                <span className="metric-icon mint">▤</span>
              </div>
              <div className="metric-value">{sessionCount.toLocaleString()}</div>
              <div className="metric-foot">Recorded diagnostic sessions</div>
              <div className="sparkline spark-green" aria-hidden="true"><i /></div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Ready to refurbish</span>
                <span className="metric-icon blue">↗</span>
              </div>
              <div className="metric-value">{refurbishPercent}<span className="metric-unit">%</span></div>
              <div className="metric-foot">{refurbishCount} Grade A/B in latest 100</div>
              <div className="sparkline spark-blue" aria-hidden="true"><i /></div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Safety flags</span>
                <span className="metric-icon amber">△</span>
              </div>
              <div className="metric-value">{gradeTotals.D}</div>
              <div className="metric-foot">Grade D in latest 100 sessions</div>
              <div className="sparkline spark-amber" aria-hidden="true"><i /></div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Active stations</span>
                <span className="metric-icon purple">⌁</span>
              </div>
              <div className="metric-value">{onlineStations}<span className="metric-fraction"> / {stations.length}</span></div>
              <div className="metric-foot"><span className="online-dot" /> Online in last 5 minutes</div>
              <div className="sparkline spark-purple" aria-hidden="true"><i /></div>
            </article>
          </section>

          <section className="insights-grid">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h2>Grading overview</h2>
                  <p>Device outcomes across all stations</p>
                </div>
                <button className="select-button">Last 7 days <span>⌄</span></button>
              </div>
              <div className="chart-summary">
                <strong>{totalGrades.toLocaleString()}</strong>
                <span>graded in latest 100 sessions</span>
              </div>
              <div className="bar-chart" role="img" aria-label="Stacked device grade totals across the last seven days">
                <div className="chart-y-labels"><span>{maxDailyGrades}</span><span>{Math.round(maxDailyGrades * 0.75)}</span><span>{Math.round(maxDailyGrades * 0.5)}</span><span>{Math.round(maxDailyGrades * 0.25)}</span><span>0</span></div>
                <div className="chart-area">
                  <div className="grid-lines"><i /><i /><i /><i /><i /></div>
                  <div className="bars">
                    {days.map((day) => (
                      <div className="bar-column" key={day.day}>
                        <div className="bar-stack">
                          <i className="bar-a" style={{ height: `${(day.a / maxDailyGrades) * 100}%` }} />
                          <i className="bar-b" style={{ height: `${(day.b / maxDailyGrades) * 100}%` }} />
                          <i className="bar-c" style={{ height: `${(day.c / maxDailyGrades) * 100}%` }} />
                          <i className="bar-d" style={{ height: `${(day.d / maxDailyGrades) * 100}%` }} />
                        </div>
                        <span>{day.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="chart-legend">
                <span><i className="legend-a" /> Grade A</span>
                <span><i className="legend-b" /> Grade B</span>
                <span><i className="legend-c" /> Grade C</span>
                <span><i className="legend-d" /> Grade D</span>
              </div>
            </article>

            <article className="panel distribution-panel">
              <div className="panel-heading">
                <div>
                  <h2>Grade distribution</h2>
                  <p>Breakdown of processed devices</p>
                </div>
                <button className="more-button" aria-label="More grade distribution options">···</button>
              </div>
              <div className="distribution-content">
                <div className="donut" role="img" aria-label={`Grade distribution from ${totalGrades} graded sessions`} style={{ background: donutBackground }}>
                  <div className="donut-center"><strong>{totalGrades}</strong><span>Graded</span></div>
                </div>
                <div className="distribution-legend">
                  {grades.map((grade) => (
                    <div className="distribution-row" key={grade}>
                      <span className={`grade-dot dot-${grade.toLowerCase()}`} />
                      <span className="distribution-name">Grade {grade}<small>{gradeLabels[grade]}</small></span>
                      <strong>{totalGrades === 0 ? 0 : Math.round((gradeTotals[grade] / totalGrades) * 100)}%</strong>
                    </div>
                  ))}
                </div>
              </div>
              <a className="text-link" href="#inventory">View all diagnostics <span>→</span></a>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel inventory-panel" id="inventory">
              <div className="panel-heading inventory-heading">
                <div>
                  <h2>Recent diagnostics</h2>
                  <p>Latest devices processed by your stations</p>
                </div>
                <a className="button button-secondary" href="#inventory">View inventory <span>→</span></a>
              </div>
              <div className="table-toolbar">
                <div className="filter-tabs" role="tablist" aria-label="Filter device type">
                  {(["All devices", "Smartphone", "5V Charger"] as Filter[]).map((option) => (
                    <button
                      className={`filter-tab ${filter === option ? "selected" : ""}`}
                      key={option}
                      onClick={() => setFilter(option)}
                      role="tab"
                      aria-selected={filter === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <label className="search-field">
                  <span aria-hidden="true">⌕</span>
                  <input
                    aria-label="Search inventory"
                    placeholder="Search devices..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <kbd>⌘ K</kbd>
                </label>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>DEVICE</th>
                      <th>GRADE</th>
                      <th>HEALTH SCORE</th>
                      <th>STATUS</th>
                      <th>RECEIVED</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div className="device-cell">
                            <span className={`device-avatar ${record.type === "Smartphone" ? "phone-avatar" : "charger-avatar"}`}>
                              {record.type === "Smartphone" ? "▯" : "ϟ"}
                            </span>
                            <span><strong>{record.brand} {record.model}</strong><small>{record.id} <i /> {record.type}</small></span>
                          </div>
                        </td>
                        <td>{record.grade ? <GradeBadge grade={record.grade} /> : <span className="muted">—</span>}</td>
                        <td>
                          {record.health === null ? (
                            <span className="muted">—</span>
                          ) : (
                            <div className="health-cell"><div className="health-track"><i style={{ width: `${record.health}%` }} /></div><span>{record.health}%</span></div>
                          )}
                        </td>
                        <td><span className={`status-pill status-${record.status.toLowerCase()}`}><i />{record.status}</span></td>
                        <td className="received-cell">{record.received}</td>
                        <td><button className="row-action" aria-label={`More actions for ${record.id}`}>···</button></td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr><td className="empty-state" colSpan={6}>No devices match your search.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>Showing <strong>{filteredRecords.length}</strong> of <strong>{sessionCount}</strong> sessions</span>
                <div><button disabled aria-label="Previous page">←</button><button disabled aria-label="Next page">→</button></div>
              </div>
            </article>

            <aside className="right-column">
              <article className="panel stations-panel" id="stations">
                <div className="panel-heading">
                  <div><h2>Test stations</h2><p>Connection and activity</p></div>
                  <a className="subtle-link" href="#stations">Manage</a>
                </div>
                {stations.length === 0 && <p className="empty-stations">No stations registered.</p>}
                {stations.map((station) => {
                  const lastSeen = station.lastSeenAt
                    ? new Date(station.lastSeenAt)
                    : null;
                  const isOnline =
                    lastSeen !== null && now - lastSeen.getTime() < 5 * 60 * 1000;
                  return (
                    <div className={`station-row ${isOnline ? "" : "offline"}`} key={station.id}>
                      <span className="station-icon">⌁</span>
                      <span className="station-details">
                        <strong>{station.name}</strong>
                        <small>
                          Firmware {station.firmwareVersion}
                          {station.lastSeenAt
                            ? ` · Seen ${formatReceived(station.lastSeenAt)}`
                            : " · Never connected"}
                        </small>
                      </span>
                      <span className="station-state"><i />{isOnline ? "Online" : "Offline"}</span>
                    </div>
                  );
                })}
              </article>

              <article className="panel rules-panel" id="grading-rules">
                <div className="panel-heading">
                  <div><h2>Active grading rules</h2><p>{activeRule ? `Version ${activeRule.ruleVersionId}` : "No active rules"}</p></div>
                  <span className="rules-icon">⚙</span>
                </div>
                {activeRule ? (
                  <div className="rules-list">
                    {[
                      { label: "Minimum weight", value: `${activeRule.weightMinPct}%`, note: "of model baseline" },
                      { label: "Swelling threshold", value: `${activeRule.thicknessSwellMm} mm`, note: "thickness increase" },
                      { label: "Missing thickness", value: `${activeRule.thicknessMissingMm} mm`, note: "below model baseline" },
                      { label: "Overcurrent", value: `${activeRule.overcurrentMa} mA`, note: "5 V input" },
                      { label: "Zero current", value: `${activeRule.zeroCurrentMa} mA`, note: "5 V input" },
                      { label: "Temperature rise", value: `${activeRule.tempRiseC} °C`, note: "above starting temperature" },
                    ].map((rule) => (
                      <div className="rule-row" key={rule.label}>
                        <span>{rule.label}<small>{rule.note}</small></span>
                        <strong>{rule.value}</strong>
                      </div>
                    ))}
                    <div className="rules-warning">
                      <span>ⓘ</span>
                      Calibrate and review thresholds before real-world grading.
                    </div>
                  </div>
                ) : (
                  <div className="rules-warning">
                    <span>ⓘ</span>
                    No active grading rule set is configured in Supabase.
                  </div>
                )}
              </article>
            </aside>
          </section>
          <footer className="page-footer"><span>ReGrade Dashboard <b>·</b> Prototype workspace</span><span>Read-only data from the authenticated Supabase project</span></footer>
        </div>
      </section>
    </main>
  );
}
