"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ActionPendingContextValue = {
  pending: boolean;
  setPending: (value: boolean) => void;
  withPending: <T>(fn: () => Promise<T>) => Promise<T>;
  reportFormPending: (active: boolean) => void;
};

const ActionPendingContext = createContext<ActionPendingContextValue | null>(null);

export function useActionPending() {
  const ctx = useContext(ActionPendingContext);
  if (!ctx) {
    return {
      pending: false,
      setPending: () => {},
      withPending: async <T,>(fn: () => Promise<T>) => fn(),
      reportFormPending: () => {},
    };
  }
  return ctx;
}

function Spinner() {
  return <span className="lab-spinner size-8" aria-hidden="true" />;
}

function ActionPendingOverlay({ pending }: { pending: boolean }) {
  if (!pending) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[135] h-1 overflow-hidden bg-emerald-900/10"
        aria-hidden="true"
      >
        <div className="nav-progress-bar h-full w-1/3 bg-emerald-700" />
      </div>
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-emerald-950/25 backdrop-blur-[2px]"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Processing"
      >
        <div className="flex min-w-[220px] flex-col items-center gap-3 rounded-2xl border border-emerald-800/15 bg-[var(--surface)] px-8 py-6 shadow-[var(--shadow)]">
          <Spinner />
          <p className="text-sm font-semibold text-emerald-950">Working…</p>
          <p className="text-xs text-emerald-900/60">Please wait a moment</p>
        </div>
      </div>
    </>
  );
}

function ActionPendingInner({ children }: { children: React.ReactNode }) {
  const [manualPending, setManualPending] = useState(false);
  const [formPendingCount, setFormPendingCount] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const pending = manualPending || formPendingCount > 0;

  const setPending = useCallback((value: boolean) => {
    setManualPending(value);
  }, []);

  const reportFormPending = useCallback((active: boolean) => {
    setFormPendingCount((count) => {
      if (active) return count + 1;
      return Math.max(0, count - 1);
    });
  }, []);

  const withPending = useCallback(async <T,>(fn: () => Promise<T>) => {
    setManualPending(true);
    try {
      return await fn();
    } finally {
      setManualPending(false);
    }
  }, []);

  // Clear after navigations only (use search string — object identity is unstable).
  useEffect(() => {
    setManualPending(false);
    setFormPendingCount(0);
  }, [pathname, search]);

  const value = useMemo(
    () => ({ pending, setPending, withPending, reportFormPending }),
    [pending, setPending, withPending, reportFormPending],
  );

  return (
    <ActionPendingContext.Provider value={value}>
      {children}
      <ActionPendingOverlay pending={pending} />
    </ActionPendingContext.Provider>
  );
}

/** Sync React form `useFormStatus().pending` into the global overlay. */
export function useReportFormPending(formPending: boolean) {
  const ctx = useContext(ActionPendingContext);
  const report = ctx?.reportFormPending;
  const wasPending = useRef(false);

  useEffect(() => {
    if (!report) return;
    if (formPending && !wasPending.current) {
      report(true);
      wasPending.current = true;
    } else if (!formPending && wasPending.current) {
      report(false);
      wasPending.current = false;
    }
  }, [formPending, report]);

  useEffect(() => {
    return () => {
      if (wasPending.current && report) {
        report(false);
        wasPending.current = false;
      }
    };
  }, [report]);
}

export function ActionPendingProvider({ children }: { children: React.ReactNode }) {
  return <ActionPendingInner>{children}</ActionPendingInner>;
}
