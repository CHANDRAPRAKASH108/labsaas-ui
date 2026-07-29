"use client";

import { useEffect, useRef, useState } from "react";

const DISPLAY_MS = 4000;

export function FlashToastClient({
  initialMessage,
  initialTone = "success",
}: {
  initialMessage: string | null;
  initialTone?: "success" | "error";
}) {
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    initialMessage ? { message: initialMessage, tone: initialTone } : null,
  );
  const lastShown = useRef<string | null>(initialMessage);

  useEffect(() => {
    if (!initialMessage) return;
    if (initialMessage === lastShown.current && toast) return;
    lastShown.current = initialMessage;
    setToast({ message: initialMessage, tone: initialTone });
  }, [initialMessage, initialTone, toast]);

  useEffect(() => {
    if (!toast) return;

    // Clear cookie via API so we don't trigger a full RSC refresh (server actions do).
    void fetch("/api/flash/clear", { method: "POST" }).catch(() => undefined);

    const timer = window.setTimeout(() => setToast(null), DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const styles =
    toast.tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-emerald-300 bg-emerald-50 text-emerald-950";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl border px-4 py-3 shadow-[var(--shadow)] ${styles}`}
    >
      <div className="flex items-start gap-3">
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="shrink-0 rounded-md px-1.5 text-sm opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
