"use client";

import { Suspense } from "react";
import { ActionPendingProvider } from "@/components/action-pending";
import { AppLockProvider } from "@/components/app-lock";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ActionPendingProvider>
        <AppLockProvider>{children}</AppLockProvider>
      </ActionPendingProvider>
    </Suspense>
  );
}
