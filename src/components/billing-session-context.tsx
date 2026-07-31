"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BillingSessionStatus = "idle" | "drafting" | "completed";

type BillingSessionContextValue = {
  status: BillingSessionStatus;
  setStatus: (status: BillingSessionStatus) => void;
  reset: () => void;
};

const BillingSessionContext = createContext<BillingSessionContextValue | null>(
  null,
);

export function BillingSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatusState] = useState<BillingSessionStatus>("idle");

  const setStatus = useCallback((next: BillingSessionStatus) => {
    setStatusState(next);
  }, []);

  const reset = useCallback(() => {
    setStatusState("idle");
  }, []);

  const value = useMemo(
    () => ({ status, setStatus, reset }),
    [status, setStatus, reset],
  );

  return (
    <BillingSessionContext.Provider value={value}>
      {children}
    </BillingSessionContext.Provider>
  );
}

export function useBillingSession() {
  const ctx = useContext(BillingSessionContext);
  if (!ctx) {
    throw new Error("useBillingSession must be used within BillingSessionProvider");
  }
  return ctx;
}

/** Optional access when the provider may be absent (e.g. print routes). */
export function useBillingSessionOptional() {
  return useContext(BillingSessionContext);
}

export function BillingSessionBadge({
  className = "",
}: {
  className?: string;
}) {
  const session = useBillingSessionOptional();
  if (!session || session.status === "idle") return null;

  const drafting = session.status === "drafting";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        drafting
          ? "border-amber-600/35 bg-amber-50 text-amber-950"
          : "border-emerald-700/30 bg-emerald-100 text-emerald-950",
        className,
      ].join(" ")}
      aria-live="polite"
    >
      <span
        className={[
          "size-1.5 shrink-0 rounded-full",
          drafting ? "animate-pulse bg-amber-600" : "bg-emerald-700",
        ].join(" ")}
        aria-hidden
      />
      {drafting ? "Billing in progress" : "Order complete"}
    </span>
  );
}

/** Warn on tab close / refresh, and on in-app link navigation while drafting. */
export function useBillingUnloadGuard() {
  const session = useBillingSessionOptional();
  const drafting = session?.status === "drafting";

  useEffect(() => {
    if (!drafting) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    function onDocumentClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }
      // Leaving billing counter (or any page) with an open draft.
      if (
        !window.confirm("Billing is in progress. Leave and discard this draft?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [drafting]);
}
