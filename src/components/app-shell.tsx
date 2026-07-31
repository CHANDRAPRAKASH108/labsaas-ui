"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { SessionUser } from "@/lib/auth";
import { AppSidebar, readSidebarCollapsed } from "@/components/app-sidebar";
import {
  BillingSessionBadge,
  BillingSessionProvider,
  useBillingUnloadGuard,
} from "@/components/billing-session-context";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import { ProfileMenu } from "@/components/profile-menu";
import type { SidebarSection } from "@/lib/sidebar-nav";

function titleForPath(pathname: string) {
  if (pathname === "/app") return "Dashboard";
  if (/^\/app\/patients\/[^/]+$/.test(pathname)) return "Patient";
  if (pathname.startsWith("/app/patients")) return "Patients";
  if (pathname === "/app/orders/new") return "Billing counter";
  if (/^\/app\/orders\/[^/]+$/.test(pathname)) return "Order";
  if (pathname.startsWith("/app/orders")) return "Test Orders";
  if (/^\/app\/reports\/[^/]+$/.test(pathname)) return "Report workbench";
  if (pathname.startsWith("/app/reports")) return "Test Reports";
  if (pathname.startsWith("/app/tests/packages")) return "Packages";
  if (/^\/app\/tests\/[^/]+$/.test(pathname)) return "Test fields";
  if (pathname.startsWith("/app/tests")) return "Test Catalog";
  if (/^\/app\/invoices\/[^/]+$/.test(pathname)) return "Invoice";
  if (pathname.startsWith("/app/invoices")) return "Invoices";
  if (pathname.startsWith("/app/income")) return "Analytics";
  if (pathname.startsWith("/app/users")) return "Users";
  if (pathname.startsWith("/app/features")) return "Features";
  if (pathname.startsWith("/app/settings")) return "Settings";
  if (pathname.startsWith("/app/inventory")) return "Inventory";
  if (pathname.startsWith("/app/doctors")) return "Doctors";
  if (pathname.startsWith("/app/prescriptions")) return "Prescriptions";
  if (pathname.startsWith("/app/appointments")) return "Appointments";
  if (pathname.startsWith("/super/messaging")) return "Support mail";
  if (pathname === "/super") return "Clients";
  if (pathname.startsWith("/super/clients")) return "Client";
  return "LabSaaS";
}

export function AppShell({
  session,
  title,
  sections,
  children,
  clientName,
  pathname,
}: {
  session: SessionUser;
  title?: string;
  sections: SidebarSection[];
  children: ReactNode;
  clientName?: string | null;
  pathname: string;
}) {
  const impersonating = Boolean(session.impersonatingClientId);
  const homeHref =
    session.role === "SUPER_ADMIN" && !impersonating ? "/super" : "/app";
  const pageTitle = title ?? titleForPath(pathname);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
  }, []);

  function onCollapsedChange(value: boolean) {
    setCollapsed(value);
    try {
      localStorage.setItem("labsaas.sidebar.collapsed", value ? "1" : "0");
    } catch {
      // ignore
    }
  }

  const padLeft = collapsed ? "lg:pl-[4.25rem]" : "lg:pl-64";

  return (
    <BillingSessionProvider>
      <AppShellFrame
        session={session}
        pageTitle={pageTitle}
        sections={sections}
        clientName={clientName}
        homeHref={homeHref}
        impersonating={impersonating}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        padLeft={padLeft}
        onCollapsedChange={onCollapsedChange}
        setMobileOpen={setMobileOpen}
      >
        {children}
      </AppShellFrame>
    </BillingSessionProvider>
  );
}

function AppShellFrame({
  session,
  pageTitle,
  sections,
  clientName,
  homeHref,
  impersonating,
  collapsed,
  mobileOpen,
  padLeft,
  onCollapsedChange,
  setMobileOpen,
  children,
}: {
  session: SessionUser;
  pageTitle: string;
  sections: SidebarSection[];
  clientName?: string | null;
  homeHref: string;
  impersonating: boolean;
  collapsed: boolean;
  mobileOpen: boolean;
  padLeft: string;
  onCollapsedChange: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
  children: ReactNode;
}) {
  useBillingUnloadGuard();

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <a href="#main-content" className="skip-link no-print">
        Skip to main content
      </a>

      <AppSidebar
        sections={sections}
        homeHref={homeHref}
        clientName={clientName}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={`app-content min-h-screen transition-[padding] duration-200 ${padLeft} print:pl-0`}
      >
        <header className="no-print sticky top-0 z-30 border-b border-emerald-800/15 bg-[#dff5ea]/92 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-emerald-800/15 bg-white text-emerald-950 hover:bg-emerald-50 lg:hidden"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </button>
              <button
                type="button"
                className="hidden size-9 items-center justify-center rounded-lg border border-emerald-800/15 bg-white text-emerald-950 hover:bg-emerald-50 lg:inline-flex"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => onCollapsedChange(!collapsed)}
              >
                <MenuIcon />
              </button>
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h1 className="truncate text-base font-semibold leading-tight text-emerald-950 sm:text-lg">
                    {pageTitle}
                  </h1>
                  <BillingSessionBadge />
                </div>
                {clientName ? (
                  <p className="truncate text-xs leading-tight text-emerald-900/60 lg:hidden">
                    {clientName}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled
                title="Global search — coming soon"
                className="hidden min-h-9 items-center gap-2 rounded-lg border border-emerald-800/15 bg-white px-3 text-sm text-emerald-900/45 sm:inline-flex"
              >
                <SearchIcon />
                <span>Search</span>
              </button>
              <button
                type="button"
                disabled
                title="Notifications — coming soon"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-emerald-800/15 bg-white text-emerald-900/45"
                aria-label="Notifications"
              >
                <BellIcon />
              </button>
              <FullscreenToggle />
              <ProfileMenu
                name={session.name}
                email={session.email}
                impersonating={impersonating}
              />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="w-full px-4 py-6 outline-none sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9a6 6 0 1 1 12 0c0 4 2 5 2 5H4s2-1 2-5Zm4 11a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
