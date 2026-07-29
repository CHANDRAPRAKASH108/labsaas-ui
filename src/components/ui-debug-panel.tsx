"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  clearUiLogs,
  getUiLogs,
  subscribeUiLogs,
  uiLog,
  type UiLogEntry,
} from "@/lib/ui-log";
import { useComponentLog } from "@/hooks/use-component-log";

function formatEntry(entry: UiLogEntry) {
  const detail = entry.detail ? ` ${JSON.stringify(entry.detail)}` : "";
  return `${entry.at.slice(11, 23)} [${entry.level}] ${entry.scope}: ${entry.message}${detail}`;
}

export function UiDebugPanel() {
  useComponentLog("UiDebugPanel");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [open, setOpen] = useState(true);
  const [entries, setEntries] = useState<UiLogEntry[]>(() => getUiLogs());

  useEffect(() => subscribeUiLogs(setEntries), []);

  useEffect(() => {
    uiLog("router", "route", { pathname, search: search || undefined });
  }, [pathname, search]);

  useEffect(() => {
    function onError(event: ErrorEvent) {
      uiLog(
        "window",
        "error",
        { message: event.message, source: event.filename, line: event.lineno },
        "error",
      );
    }
    function onRejection(event: PromiseRejectionEvent) {
      uiLog(
        "window",
        "unhandledrejection",
        { reason: String(event.reason) },
        "error",
      );
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <div className="fixed bottom-3 left-3 z-[200] max-w-[min(100vw-1.5rem,28rem)] font-mono text-[11px]">
      <div className="overflow-hidden rounded-xl border border-amber-400/70 bg-amber-50/95 shadow-[var(--shadow)] backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-amber-300/70 px-3 py-2">
          <button
            type="button"
            className="font-semibold text-amber-950"
            onClick={() => setOpen((v) => !v)}
          >
            UI debug {open ? "▾" : "▸"} ({entries.length})
          </button>
          <span className="truncate text-amber-900/60">{pathname}</span>
          <button
            type="button"
            className="ml-auto rounded px-1.5 py-0.5 text-amber-900/80 hover:bg-amber-200/80"
            onClick={() => clearUiLogs()}
          >
            Clear
          </button>
        </div>
        {open ? (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words p-3 text-amber-950/90">
            {entries.length
              ? entries.map(formatEntry).join("\n")
              : "Waiting for component / route / API activity…"}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
