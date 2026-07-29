"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/logo";
import { SidebarNavIcon } from "@/components/sidebar-icons";
import {
  collectHrefs,
  groupContainsActivePath,
  isLeafActive,
  type SidebarGroup,
  type SidebarIcon,
  type SidebarSection,
} from "@/lib/sidebar-nav";

const COLLAPSED_KEY = "labsaas.sidebar.collapsed";
const SECTIONS_KEY = "labsaas.sidebar.sections";

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppSidebar({
  sections,
  homeHref,
  clientName,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}: {
  sections: SidebarSection[];
  homeHref: string;
  clientName?: string | null;
  collapsed: boolean;
  onCollapsedChange: (value: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const allHrefs = useMemo(() => collectHrefs(sections), [sections]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SECTIONS_KEY);
      if (raw) setExpandedGroups(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(expandedGroups));
    } catch {
      // ignore
    }
  }, [expandedGroups, hydrated]);

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const section of sections) {
        for (const group of section.items) {
          if (group.children?.length && groupContainsActivePath(group, pathname)) {
            if (!next[group.id]) {
              next[group.id] = true;
              changed = true;
            }
          }
        }
      }
      return changed ? next : prev;
    });
  }, [pathname, sections]);

  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const widthClass = collapsed ? "w-[4.25rem]" : "w-64";

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-emerald-950/40 backdrop-blur-[1px] lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={[
          "no-print fixed inset-y-0 left-0 z-50 flex flex-col border-r border-emerald-800/15 bg-[#e8f6ef] transition-[width,transform] duration-200 ease-out",
          widthClass,
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        aria-label="Main navigation"
        data-collapsed={collapsed ? "true" : "false"}
      >
        <div
          className={[
            "flex h-14 shrink-0 items-center gap-2 border-b border-emerald-800/10 px-3",
            collapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <Logo href={homeHref} size="sm" />
              {clientName ? (
                <p className="mt-0.5 truncate pl-0.5 text-[11px] font-medium text-emerald-900/55">
                  {clientName}
                </p>
              ) : null}
            </div>
          ) : (
            <Logo href={homeHref} size="sm" />
          )}
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-emerald-900/70 hover:bg-emerald-900/10 hover:text-emerald-950 lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {sections.map((section) => (
            <div key={section.id} className="mb-4">
              {section.label && !collapsed ? (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900/45">
                  {section.label}
                </p>
              ) : section.label && collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-emerald-800/15" aria-hidden="true" />
              ) : null}

              <ul className="space-y-0.5">
                {section.items.map((group) => (
                  <SidebarGroupItem
                    key={group.id}
                    group={group}
                    collapsed={collapsed}
                    pathname={pathname}
                    allHrefs={allHrefs}
                    expanded={Boolean(expandedGroups[group.id])}
                    onToggle={() => toggleGroup(group.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

function SidebarGroupItem({
  group,
  collapsed,
  pathname,
  allHrefs,
  expanded,
  onToggle,
}: {
  group: SidebarGroup;
  collapsed: boolean;
  pathname: string;
  allHrefs: string[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasChildren = Boolean(group.children?.length);
  const childActive = groupContainsActivePath(group, pathname);
  const open = expanded || childActive;

  if (!hasChildren && group.href) {
    const active = isLeafActive(group.href, pathname, allHrefs);
    return (
      <li>
        <NavLink
          href={group.href}
          label={group.label}
          icon={group.icon!}
          active={active}
          collapsed={collapsed}
          soon={group.status === "soon"}
        />
      </li>
    );
  }

  if (!hasChildren) return null;

  if (collapsed) {
    const target = group.href || group.children![0]!.href;
    return (
      <li>
        <NavLink
          href={target}
          label={group.label}
          icon={(group.icon || group.children![0]!.icon) as SidebarIcon}
          active={childActive}
          collapsed
          soon={group.status === "soon"}
        />
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={[
          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors",
          childActive
            ? "bg-emerald-900/10 text-emerald-950"
            : "text-emerald-900/80 hover:bg-emerald-900/8 hover:text-emerald-950",
        ].join(" ")}
        aria-expanded={open}
      >
        {group.icon ? (
          <SidebarNavIcon name={group.icon} className="size-5 shrink-0 opacity-90" />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        {group.status === "soon" ? <SoonBadge /> : null}
        <Chevron open={open} />
      </button>
      {open ? (
        <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-emerald-800/12 pl-2">
          {group.children!.map((child) => {
            const active = isLeafActive(child.href, pathname, allHrefs);
            return (
              <li key={child.id}>
                <NavLink
                  href={child.href}
                  label={child.label}
                  icon={child.icon}
                  active={active}
                  collapsed={false}
                  nested
                  soon={child.status === "soon"}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
  collapsed,
  nested,
  soon,
}: {
  href: string;
  label: string;
  icon: SidebarIcon;
  active: boolean;
  collapsed: boolean;
  nested?: boolean;
  soon?: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={[
        "group relative flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors",
        nested ? "px-2.5 py-1.5" : "px-2.5 py-2",
        collapsed ? "justify-center" : "",
        active
          ? "bg-emerald-800 text-white shadow-sm"
          : "text-emerald-900/80 hover:bg-emerald-900/8 hover:text-emerald-950",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <SidebarNavIcon name={icon} className="size-5 shrink-0 opacity-90" />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {soon ? <SoonBadge dim={active} /> : null}
        </>
      ) : null}
      {collapsed ? (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-emerald-950 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block">
          {label}
          {soon ? " (soon)" : ""}
        </span>
      ) : null}
    </Link>
  );
}

function SoonBadge({ dim }: { dim?: boolean } = {}) {
  return (
    <span
      className={[
        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        dim ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900",
      ].join(" ")}
    >
      Soon
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-emerald-900/45 transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {collapsed ? (
        <path
          d="M9 6l6 6-6 6M4 4v16"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M15 6l-6 6 6 6M20 4v16"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
