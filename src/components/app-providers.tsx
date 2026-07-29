"use client";

import { Suspense } from "react";
import { ActionPendingProvider } from "@/components/action-pending";
import { AppLockProvider } from "@/components/app-lock";
import { UiDebugPanel } from "@/components/ui-debug-panel";
import { useComponentLog } from "@/hooks/use-component-log";

function ProvidersInner({ children }: { children: React.ReactNode }) {
  useComponentLog("AppProviders");
  return (
    <ActionPendingProvider>
      <AppLockProvider>
        {children}
        <Suspense fallback={null}>
          <UiDebugPanel />
        </Suspense>
      </AppLockProvider>
    </ActionPendingProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProvidersInner>{children}</ProvidersInner>
    </Suspense>
  );
}
