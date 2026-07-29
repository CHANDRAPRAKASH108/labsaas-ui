"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useComponentLog } from "@/hooks/use-component-log";

function NavProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname && url.search === window.location.search) return;
        setActive(true);
      } catch {
        // ignore
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  if (!active) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-1 overflow-hidden bg-emerald-900/10"
        aria-hidden="true"
      >
        <div className="nav-progress-bar h-full w-1/3 bg-emerald-700" />
      </div>
      <div
        className="fixed inset-0 z-[115] flex items-center justify-center bg-emerald-950/20 backdrop-blur-[1px]"
        role="status"
        aria-live="polite"
        aria-label="Loading page"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-800/15 bg-[var(--surface)] px-5 py-3 shadow-[var(--shadow)]">
          <span className="lab-spinner size-5" />
          <span className="text-sm font-medium text-emerald-950">Loading…</span>
        </div>
      </div>
    </>
  );
}

export function NavProgress() {
  useComponentLog("NavProgress");
  return (
    <Suspense fallback={null}>
      <NavProgressInner />
    </Suspense>
  );
}
