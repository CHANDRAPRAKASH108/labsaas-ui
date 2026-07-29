"use client";

import { useEffect } from "react";
import { uiLog } from "@/lib/ui-log";

/** Logs mount / unmount for a client component. */
export function useComponentLog(name: string, detail?: Record<string, unknown>) {
  useEffect(() => {
    uiLog(name, "mounted", detail);
    return () => {
      uiLog(name, "unmounted");
    };
    // Intentionally only re-log when the component identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
}

export function logUiEvent(
  scope: string,
  message: string,
  detail?: Record<string, unknown>,
  level: "info" | "warn" | "error" = "info",
) {
  uiLog(scope, message, detail, level);
}
