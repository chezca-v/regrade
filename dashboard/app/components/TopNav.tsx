"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview" },
  { label: "Diagnostics", href: "/diagnostics" },
  { label: "Inventory", href: "/inventory" },
  { label: "Reports", href: "/reports" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="rg-topnav-wrap">
      <div className="rg-topnav">
        {/* Brand */}
        <Link href="/overview" className="rg-brand" aria-label="ReGrade home">
          <span className="rg-brand__mark">
            <Image
              src="/logo.png"
              alt="ReGrade logo"
              width={34}
              height={34}
              className="rg-brand__logo-img"
              priority
            />
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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rg-nav-link${isActive ? " rg-nav-link--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="rg-topnav__right">
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
        </div>
      </div>
    </header>
  );
}
