"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { SidebarSection } from "@/lib/sidebar-nav";
import { useComponentLog } from "@/hooks/use-component-log";

export function AppChrome({
  session,
  clientName,
  sections,
  children,
}: {
  session: SessionUser;
  clientName?: string | null;
  sections: SidebarSection[];
  children: ReactNode;
}) {
  useComponentLog("AppChrome");
  const pathname = usePathname();

  if (pathname.includes("/print")) {
    return <>{children}</>;
  }

  return (
    <AppShell
      session={session}
      clientName={clientName}
      sections={sections}
      pathname={pathname}
    >
      {children}
    </AppShell>
  );
}
