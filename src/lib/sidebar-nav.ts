/**
 * Lab app sidebar navigation tree.
 * Filtered by role / allowed screens / enabled module features.
 */

export type SidebarIcon =
  | "dashboard"
  | "billing"
  | "orders"
  | "reports"
  | "patients"
  | "tests"
  | "packages"
  | "inventory"
  | "stock"
  | "suppliers"
  | "categories"
  | "stockIn"
  | "stockOut"
  | "doctors"
  | "prescriptions"
  | "appointments"
  | "invoices"
  | "analytics"
  | "users"
  | "features"
  | "settings";

export type ModuleFeature =
  | "inventory"
  | "doctor"
  | "prescriptions"
  | "appointments";

export type SidebarLeaf = {
  id: string;
  label: string;
  href: string;
  icon: SidebarIcon;
  /** Staff screen permission key (maps to User.allowedScreens). */
  screenKey?: string;
  /** Staff must have every listed screen key (admins always pass). */
  requireScreens?: string[];
  /** Hide unless this module feature is enabled (admins still see `soon` items). */
  feature?: ModuleFeature;
  /** live = wired; soon = placeholder / future. */
  status?: "live" | "soon";
  /** Admin-only (users, settings, analytics, …). */
  adminOnly?: boolean;
  /** Open billing counter focus flow (fullscreen) instead of a plain link. */
  launch?: "billing-counter";
};

export type SidebarGroup = {
  id: string;
  label: string;
  /** Optional single link when group has no children. */
  href?: string;
  icon?: SidebarIcon;
  screenKey?: string;
  requireScreens?: string[];
  feature?: ModuleFeature;
  status?: "live" | "soon";
  adminOnly?: boolean;
  launch?: "billing-counter";
  children?: SidebarLeaf[];
};

export type SidebarSection = {
  id: string;
  label: string | null;
  /** Module feature for entire section (e.g. Doctor). */
  feature?: ModuleFeature;
  items: SidebarGroup[];
};

export type EnabledModules = Partial<Record<ModuleFeature, boolean>>;

/** Full lab navigation (pre-filter). */
export const LAB_SIDEBAR: SidebarSection[] = [
  {
    id: "home",
    label: null,
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/app",
        icon: "dashboard",
        screenKey: "dashboard",
        status: "live",
      },
    ],
  },
  {
    id: "front-desk",
    label: null,
    items: [
      {
        id: "billing-counter",
        label: "Billing counter",
        href: "/app/orders/new",
        icon: "billing",
        requireScreens: ["orders", "patients", "invoices"],
        launch: "billing-counter",
        status: "live",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        id: "orders",
        label: "Test Orders",
        href: "/app/orders",
        icon: "orders",
        screenKey: "orders",
        status: "live",
      },
      {
        id: "reports",
        label: "Test Reports",
        href: "/app/reports",
        icon: "reports",
        screenKey: "reports",
        status: "live",
      },
      {
        id: "patients",
        label: "Patients",
        href: "/app/patients",
        icon: "patients",
        screenKey: "patients",
        status: "live",
      },
    ],
  },
  {
    id: "lab-management",
    label: "Lab Management",
    items: [
      {
        id: "tests",
        label: "Tests",
        icon: "tests",
        screenKey: "tests",
        status: "live",
        children: [
          {
            id: "test-catalog",
            label: "Test Catalog",
            href: "/app/tests",
            icon: "tests",
            screenKey: "tests",
            status: "live",
          },
          {
            id: "packages",
            label: "Packages",
            href: "/app/tests/packages",
            icon: "packages",
            screenKey: "tests",
            status: "soon",
          },
        ],
      },
      {
        id: "inventory",
        label: "Inventory",
        icon: "inventory",
        feature: "inventory",
        status: "soon",
        children: [
          {
            id: "inv-dashboard",
            label: "Dashboard",
            href: "/app/inventory",
            icon: "dashboard",
            feature: "inventory",
            status: "soon",
          },
          {
            id: "inv-stock",
            label: "Stock",
            href: "/app/inventory/stock",
            icon: "stock",
            feature: "inventory",
            status: "soon",
          },
          {
            id: "inv-suppliers",
            label: "Suppliers",
            href: "/app/inventory/suppliers",
            icon: "suppliers",
            feature: "inventory",
            status: "soon",
          },
          {
            id: "inv-categories",
            label: "Categories",
            href: "/app/inventory/categories",
            icon: "categories",
            feature: "inventory",
            status: "soon",
          },
          {
            id: "inv-in",
            label: "Stock In",
            href: "/app/inventory/stock-in",
            icon: "stockIn",
            feature: "inventory",
            status: "soon",
          },
          {
            id: "inv-out",
            label: "Stock Out",
            href: "/app/inventory/stock-out",
            icon: "stockOut",
            feature: "inventory",
            status: "soon",
          },
        ],
      },
    ],
  },
  {
    id: "doctor",
    label: "Doctor",
    feature: "doctor",
    items: [
      {
        id: "doctors",
        label: "Doctors",
        href: "/app/doctors",
        icon: "doctors",
        feature: "doctor",
        status: "soon",
      },
      {
        id: "prescriptions",
        label: "Prescriptions",
        href: "/app/prescriptions",
        icon: "prescriptions",
        feature: "prescriptions",
        status: "soon",
      },
      {
        id: "appointments",
        label: "Appointments",
        href: "/app/appointments",
        icon: "appointments",
        feature: "appointments",
        status: "soon",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      {
        id: "invoices",
        label: "Invoices",
        href: "/app/invoices",
        icon: "invoices",
        screenKey: "invoices",
        status: "live",
      },
      {
        id: "analytics",
        label: "Analytics",
        href: "/app/income",
        icon: "analytics",
        screenKey: "income",
        status: "live",
        adminOnly: true,
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      {
        id: "users",
        label: "Users",
        href: "/app/users",
        icon: "users",
        screenKey: "users",
        status: "live",
        adminOnly: true,
      },
      {
        id: "features",
        label: "Features",
        href: "/app/features",
        icon: "features",
        screenKey: "features",
        status: "live",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/app/settings",
        icon: "settings",
        screenKey: "settings",
        status: "live",
        adminOnly: true,
      },
    ],
  },
];

export const SUPER_SIDEBAR: SidebarSection[] = [
  {
    id: "super",
    label: "Platform",
    items: [
      {
        id: "clients",
        label: "Clients",
        href: "/super",
        icon: "users",
        status: "live",
      },
      {
        id: "support-mail",
        label: "Support mail",
        href: "/super/messaging",
        icon: "features",
        status: "live",
      },
    ],
  },
];

function featureEnabled(
  feature: ModuleFeature | undefined,
  modules: EnabledModules,
  status: "live" | "soon" | undefined,
  isAdmin: boolean,
) {
  if (!feature) return true;
  const on = Boolean(modules[feature]);
  if (on) return true;
  // Admins see roadmap (soon) modules even when feature flag is off.
  if (isAdmin && status === "soon") return true;
  // Section/group with feature and no status: hide when off.
  return false;
}

function hasRequiredScreens(
  requireScreens: string[] | undefined,
  ctx: {
    isAdmin: boolean;
    allowedScreens: Set<string> | null;
  },
) {
  if (!requireScreens?.length) return true;
  if (ctx.isAdmin) return true;
  // Staff without a permission set: only defaults apply elsewhere — deny multi-screen items.
  if (!ctx.allowedScreens) return false;
  return requireScreens.every((key) => ctx.allowedScreens!.has(key));
}

function filterLeaf(
  leaf: SidebarLeaf,
  ctx: {
    isAdmin: boolean;
    allowedScreens: Set<string> | null;
    modules: EnabledModules;
  },
): SidebarLeaf | null {
  if (leaf.adminOnly && !ctx.isAdmin) return null;
  if (!featureEnabled(leaf.feature, ctx.modules, leaf.status, ctx.isAdmin)) {
    return null;
  }
  if (!ctx.isAdmin && leaf.status === "soon") return null;
  if (!hasRequiredScreens(leaf.requireScreens, ctx)) return null;
  if (!ctx.isAdmin && leaf.screenKey && ctx.allowedScreens) {
    if (!ctx.allowedScreens.has(leaf.screenKey)) return null;
  }
  return leaf;
}

function filterGroup(
  group: SidebarGroup,
  ctx: {
    isAdmin: boolean;
    allowedScreens: Set<string> | null;
    modules: EnabledModules;
  },
): SidebarGroup | null {
  if (group.adminOnly && !ctx.isAdmin) return null;
  if (!featureEnabled(group.feature, ctx.modules, group.status, ctx.isAdmin)) {
    return null;
  }
  if (!hasRequiredScreens(group.requireScreens, ctx)) return null;

  if (group.children?.length) {
    const children = group.children
      .map((c) => filterLeaf(c, ctx))
      .filter(Boolean) as SidebarLeaf[];
    if (children.length === 0) return null;
    return { ...group, children };
  }

  // Leaf-as-group
  if (!ctx.isAdmin && group.status === "soon") return null;
  if (!ctx.isAdmin && group.screenKey && ctx.allowedScreens) {
    if (!ctx.allowedScreens.has(group.screenKey)) return null;
  }
  if (!group.href) return null;
  return group;
}

export function filterSidebar(
  sections: SidebarSection[],
  input: {
    role: string;
    impersonating?: boolean;
    allowedScreens?: string[] | null;
    modules?: EnabledModules;
  },
): SidebarSection[] {
  const isSuperBare =
    input.role === "SUPER_ADMIN" && !input.impersonating && !input.allowedScreens;
  const isAdmin =
    input.role === "CLIENT_ADMIN" ||
    (input.role === "SUPER_ADMIN" && Boolean(input.impersonating)) ||
    isSuperBare;

  const modules = input.modules ?? {};
  const allowedScreens =
    isAdmin || !input.allowedScreens
      ? null
      : new Set(
          input.allowedScreens.length > 0
            ? input.allowedScreens
            : ["dashboard", "patients", "orders", "reports"],
        );

  const ctx = { isAdmin, allowedScreens, modules };

  return sections
    .map((section) => {
      // Hide whole section for staff when module feature is off.
      if (section.feature && !modules[section.feature] && !isAdmin) {
        return null;
      }

      const items = section.items
        .map((g) => filterGroup(g, ctx))
        .filter(Boolean) as SidebarGroup[];
      if (items.length === 0) return null;
      return { ...section, items };
    })
    .filter(Boolean) as SidebarSection[];
}

export function pathMatches(href: string, pathname: string) {
  if (href === "/app" || href === "/super") {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Best matching href length wins (nested routes). */
export function isLeafActive(href: string, pathname: string, allHrefs: string[]) {
  if (!pathMatches(href, pathname)) return false;
  const moreSpecific = allHrefs.some(
    (other) =>
      other !== href &&
      other.startsWith(href) &&
      pathMatches(other, pathname) &&
      other.length > href.length,
  );
  return !moreSpecific;
}

export function collectHrefs(sections: SidebarSection[]): string[] {
  const hrefs: string[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.href) hrefs.push(item.href);
      for (const child of item.children ?? []) hrefs.push(child.href);
    }
  }
  return hrefs;
}

export function groupContainsActivePath(group: SidebarGroup, pathname: string) {
  if (group.href && pathMatches(group.href, pathname)) return true;
  return (group.children ?? []).some((c) => pathMatches(c.href, pathname));
}

/** Flat href list for legacy access checks / redirects. */
export function flatNavFromSidebar(sections: SidebarSection[]) {
  const items: { href: string; label: string }[] = [];
  for (const section of sections) {
    for (const group of section.items) {
      if (group.children?.length) {
        for (const child of group.children) {
          items.push({ href: child.href, label: child.label });
        }
      } else if (group.href) {
        items.push({ href: group.href, label: group.label });
      }
    }
  }
  return items;
}
