"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BillingSessionBadge,
  useBillingSessionOptional,
} from "@/components/billing-session-context";

/**
 * Counter shell: fills the viewport in focus mode with no page scroll.
 * Panel scrolling stays inside child components.
 */
export function CounterWorkspace({
  children,
  autoFocus = false,
  returnTo,
}: {
  children: ReactNode;
  autoFocus?: boolean;
  returnTo?: string;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(autoFocus);
  const leaveOnExit = Boolean(returnTo);
  const billingSession = useBillingSessionOptional();
  const drafting = billingSession?.status === "drafting";
  const draftingRef = useRef(drafting);
  draftingRef.current = drafting;

  function confirmLeaveDraft() {
    if (!draftingRef.current) return true;
    return window.confirm(
      "Billing is in progress. Leave and discard this draft?",
    );
  }

  useEffect(() => {
    if (!autoFocus) return;
    setFocused(true);
    requestAnimationFrame(async () => {
      try {
        const el = panelRef.current;
        if (el && !document.fullscreenElement) {
          await el.requestFullscreen();
        }
      } catch {
        // Fixed overlay is enough.
      }
    });
  }, [autoFocus]);

  useEffect(() => {
    function leave() {
      if (!confirmLeaveDraft()) {
        // Re-enter fullscreen if the user cancelled after Esc exited it.
        void panelRef.current?.requestFullscreen?.().catch(() => undefined);
        return;
      }
      setFocused(false);
      if (returnTo) router.push(returnTo);
    }

    function onFullscreenChange() {
      if (!document.fullscreenElement && focused) {
        if (leaveOnExit) leave();
        else {
          if (!confirmLeaveDraft()) {
            void panelRef.current?.requestFullscreen?.().catch(() => undefined);
            return;
          }
          setFocused(false);
        }
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || !focused) return;
      if (document.fullscreenElement) return;
      e.preventDefault();
      if (leaveOnExit) leave();
      else {
        if (!confirmLeaveDraft()) return;
        setFocused(false);
      }
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [focused, leaveOnExit, returnTo, router]);

  useEffect(() => {
    if (!focused) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [focused]);

  async function enterFocus() {
    setFocused(true);
    requestAnimationFrame(async () => {
      try {
        const el = panelRef.current;
        if (el && !document.fullscreenElement) {
          await el.requestFullscreen();
        }
      } catch {
        // ignore
      }
    });
  }

  async function exitFocus() {
    if (!confirmLeaveDraft()) return;
    setFocused(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ignore
    }
    if (returnTo) router.push(returnTo);
  }

  return (
    <div
      className={
        focused
          ? undefined
          : "flex h-[calc(100dvh-5.5rem)] min-h-0 flex-col gap-3 overflow-hidden"
      }
    >
      {!focused ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="truncate font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-emerald-950 sm:text-2xl">
                Billing counter
              </h1>
              <BillingSessionBadge />
            </div>
            <p className="truncate text-xs text-emerald-900/60 sm:text-sm">
              Desk flow — scroll stays inside each panel.
            </p>
          </div>
          <button
            type="button"
            onClick={enterFocus}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-emerald-800/20 bg-white px-3 py-1.5 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
          >
            <ExpandIcon />
            Focus
          </button>
        </div>
      ) : null}

      <div
        ref={panelRef}
        className={
          focused
            ? "fixed inset-0 z-[120] flex min-h-0 flex-col overflow-hidden bg-[#e8f6ef] p-3 sm:p-4"
            : "flex min-h-0 flex-1 flex-col overflow-hidden"
        }
      >
        {focused ? (
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-emerald-800/15 pb-2">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-emerald-950 sm:text-base">
                  Billing counter
                </p>
                <BillingSessionBadge />
              </div>
              <p className="text-xs text-emerald-900/60">
                {returnTo ? "Esc → dashboard" : "Esc → exit focus"}
              </p>
            </div>
            <button
              type="button"
              onClick={exitFocus}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-800/20 bg-white px-3 py-1.5 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
            >
              <CollapseIcon />
              {returnTo ? "Dashboard" : "Exit"}
            </button>
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 2v4H2M10 2v4h4M10 14v-4h4M6 14v-4H2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
