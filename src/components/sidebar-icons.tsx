import type { ReactNode } from "react";
import type { SidebarIcon } from "@/lib/sidebar-nav";

const paths: Record<SidebarIcon, ReactNode> = {
  dashboard: (
    <>
      <path d="M3 3h7v7H3V3Zm11 0h7v5h-7V3ZM3 13h7v8H3v-8Zm11 8v-11h7v11h-7Z" />
    </>
  ),
  orders: (
    <path d="M8 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 0v6h6M8 13h8M8 17h5" />
  ),
  reports: (
    <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm9 0v5h5M8 13h8M8 17h5M8 9h3" />
  ),
  patients: (
    <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 20a8 8 0 0 1 16 0" />
  ),
  tests: (
    <path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3" />
  ),
  packages: (
    <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 0v20M3 7l9 5 9-5" />
  ),
  inventory: (
    <path d="M3 7h18v13H3V7Zm3-4h12l2 4H4l2-4Zm6 8v6M9 14h6" />
  ),
  stock: <path d="M4 19V9l8-5 8 5v10H4Zm4-6h8" />,
  suppliers: (
    <path d="M3 20V9l9-5 9 5v11M8 20v-6h8v6" />
  ),
  categories: (
    <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
  ),
  stockIn: <path d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14" />,
  stockOut: <path d="M12 20V8m0 0 4 4m-4-4-4 4M5 4h14" />,
  doctors: (
    <path d="M12 2v6m-3 3h6M8 8a4 4 0 1 1 8 0v1H8V8Zm-4 12a8 8 0 0 1 16 0" />
  ),
  prescriptions: (
    <path d="M8 3h5l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm5 0v5h5M9 14h6M9 17h4" />
  ),
  appointments: (
    <path d="M7 3v3M17 3v3M4 9h16M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm3 7h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
  ),
  invoices: (
    <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v4h4M9 13h6M9 17h4M9 9h2" />
  ),
  analytics: (
    <path d="M4 19V9M10 19V5M16 19v-8M22 19H2" />
  ),
  users: (
    <path d="M14 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 19a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 19a5 5 0 0 0-4-4.9" />
  ),
  features: (
    <path d="M12 2l2.2 6.8H21l-5.4 3.9 2.1 6.8L12 16.6 6.3 19.5l2.1-6.8L3 8.8h6.8L12 2Z" />
  ),
  settings: (
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 13a7.8 7.8 0 0 0 .1-2l2-1.2-2-3.4-2.3.7a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.5 2.1a7.6 7.6 0 0 0-1.7 1L6.5 5.4l-2 3.4L6.4 11a7.8 7.8 0 0 0 0 2l-2 1.2 2 3.4 2.3-.7a7.6 7.6 0 0 0 1.7 1L11 21h4l.5-2.1a7.6 7.6 0 0 0 1.7-1l2.3.7 2-3.4-1.9-1.2Z" />
  ),
};

export function SidebarNavIcon({
  name,
  className = "size-5",
}: {
  name: SidebarIcon;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
