"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview" },
  { label: "Diagnostics", href: "/diagnostics" },
  { label: "Inventory", href: "/inventory" },
  { label: "Sorting", href: "/sorting" },
  { label: "Safety alerts", href: "/safety-alerts", badge: 2 },
  { label: "Reports", href: "/reports" },
];

interface TopNavProps {
  alertCount?: number;
}

export function TopNav({ alertCount = 2 }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header className="rg-topnav-wrap">
      <div className="rg-topnav">
        {/* Brand */}
        <Link href="/overview" className="rg-brand" aria-label="ReGrade home">
          <span className="rg-brand__mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <rect x="14" y="14" width="6" height="6" rx="1" />
            </svg>
          </span>
          <span className="rg-brand__name">
            ReGrade
            <small>E-waste diagnostics</small>
          </span>
        </Link>

        {/* Pill nav */}
        <nav className="rg-nav-pill" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const liveCount = item.label === "Safety alerts" ? alertCount : item.badge;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rg-nav-link${isActive ? " rg-nav-link--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
                {liveCount != null && liveCount > 0 && (
                  <b className="rg-nav-badge" aria-label={`${liveCount} alerts`}>
                    {liveCount}
                  </b>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="rg-topnav__right">
          <button className="rg-icon-btn" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <button className="rg-icon-btn" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <span className="rg-avatar" aria-label="Operator profile">OP</span>
        </div>
      </div>
    </header>
  );
}
