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
          <Link
            href="/settings"
            className={`rg-icon-btn${pathname === "/settings" ? " rg-icon-btn--active" : ""}`}
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          </Link>
          <span className="rg-avatar" aria-label="Operator profile">OP</span>
        </div>
      </div>
    </header>
  );
}
