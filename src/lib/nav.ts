export const CONFIGURABLE_SCREENS = [
  { key: "dashboard", href: "/app", label: "Dashboard" },
  { key: "patients", href: "/app/patients", label: "Patients" },
  { key: "orders", href: "/app/orders", label: "Orders" },
  { key: "reports", href: "/app/reports", label: "Reports" },
  { key: "tests", href: "/app/tests", label: "Tests" },
  { key: "invoices", href: "/app/invoices", label: "Invoices" },
  { key: "features", href: "/app/features", label: "Features" },
] as const;

export type ScreenKey = (typeof CONFIGURABLE_SCREENS)[number]["key"];

/** Admin-only screens — always available to client admins, never assigned to staff. */
export const ADMIN_ONLY_SCREENS = [
  { key: "income", href: "/app/income", label: "Analytics" },
  { key: "users", href: "/app/users", label: "Users" },
  { key: "settings", href: "/app/settings", label: "Settings" },
] as const;

export const DEFAULT_STAFF_SCREENS: ScreenKey[] = [
  "dashboard",
  "patients",
  "orders",
  "reports",
];

export const clientNav = [
  ...CONFIGURABLE_SCREENS.map((s) => ({ href: s.href, label: s.label })),
  ...ADMIN_ONLY_SCREENS.map((s) => ({ href: s.href, label: s.label })),
] as const;

export function screenKeyFromPath(pathname: string): string | null {
  if (pathname === "/app" || pathname === "/app/") return "dashboard";
  if (pathname.startsWith("/app/patients")) return "patients";
  if (pathname.startsWith("/app/orders")) return "orders";
  if (pathname.startsWith("/app/reports")) return "reports";
  if (pathname.startsWith("/app/tests")) return "tests";
  if (pathname.startsWith("/app/invoices")) return "invoices";
  if (pathname.startsWith("/app/features")) return "features";
  if (pathname.startsWith("/app/income")) return "income";
  if (pathname.startsWith("/app/users")) return "users";
  if (pathname.startsWith("/app/settings")) return "settings";
  // Future modules — treat as open for admins; staff blocked via soon filter
  if (pathname.startsWith("/app/inventory")) return "inventory";
  if (pathname.startsWith("/app/doctors")) return "doctors";
  if (pathname.startsWith("/app/prescriptions")) return "prescriptions";
  if (pathname.startsWith("/app/appointments")) return "appointments";
  return null;
}

export function parseScreenKeys(values: FormDataEntryValue[]): ScreenKey[] {
  const allowed = new Set(CONFIGURABLE_SCREENS.map((s) => s.key));
  const keys = values
    .map(String)
    .filter((key): key is ScreenKey => allowed.has(key as ScreenKey));
  return [...new Set(keys)];
}

export function navForSession(input: {
  role: string;
  impersonating?: boolean;
  allowedScreens?: string[] | null;
}) {
  const { role, impersonating = false, allowedScreens } = input;
  const isAdmin =
    role === "CLIENT_ADMIN" || (role === "SUPER_ADMIN" && impersonating);

  if (isAdmin) {
    return [...clientNav];
  }

  // Staff: only configured screens (fallback to defaults if empty for legacy users)
  const keys =
    allowedScreens && allowedScreens.length > 0
      ? allowedScreens
      : DEFAULT_STAFF_SCREENS;

  const keySet = new Set(keys);
  return CONFIGURABLE_SCREENS.filter((s) => keySet.has(s.key)).map((s) => ({
    href: s.href,
    label: s.label,
  }));
}

export function canAccessScreen(input: {
  role: string;
  impersonating?: boolean;
  allowedScreens?: string[] | null;
  pathname: string;
}) {
  const key = screenKeyFromPath(input.pathname);
  if (!key) return true;

  const isAdmin =
    input.role === "CLIENT_ADMIN" ||
    (input.role === "SUPER_ADMIN" && input.impersonating);

  if (isAdmin) return true;

  if (key === "users" || key === "settings" || key === "income") return false;

  // Future / module screens — staff need an explicit allow (not in defaults)
  if (
    key === "inventory" ||
    key === "doctors" ||
    key === "prescriptions" ||
    key === "appointments"
  ) {
    return false;
  }

  const keys =
    input.allowedScreens && input.allowedScreens.length > 0
      ? input.allowedScreens
      : DEFAULT_STAFF_SCREENS;

  return keys.includes(key);
}

export const superNav = [
  { href: "/super", label: "Clients" },
  { href: "/super/messaging", label: "Support mail" },
] as const;
