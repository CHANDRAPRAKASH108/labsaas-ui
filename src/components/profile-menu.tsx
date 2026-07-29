"use client";

import { useEffect, useId, useRef, useState } from "react";
import { logoutAction, stopImpersonationAction } from "@/app/actions/auth";
import { useAppLock } from "@/components/app-lock";
import { useComponentLog } from "@/hooks/use-component-log";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ProfileMenu({
  name,
  email,
  impersonating,
}: {
  name: string;
  email?: string | null;
  impersonating?: boolean;
}) {
  useComponentLog("ProfileMenu");
  const [open, setOpen] = useState(false);
  const { lockApp } = useAppLock();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const buttonId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function onLockApp() {
    setOpen(false);
    lockApp();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-10 max-w-[14rem] items-center gap-2 rounded-lg border border-emerald-800/20 bg-white px-2.5 py-1.5 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
      >
        <span
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-white"
          aria-hidden="true"
        >
          {initialsFromName(name)}
        </span>
        <span className="min-w-0 truncate">
          <span className="sr-only">Profile menu for </span>
          {name}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-emerald-800/15 bg-white py-1 shadow-[var(--shadow)]"
        >
          <div className="border-b border-emerald-800/10 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-emerald-950">{name}</p>
            {email ? (
              <p className="truncate text-xs text-emerald-900/60">{email}</p>
            ) : null}
            {impersonating ? (
              <p className="mt-1 text-xs font-medium text-amber-800">Viewing as client</p>
            ) : null}
          </div>

          {impersonating ? (
            <form action={stopImpersonationAction} role="none">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center px-3 py-2.5 text-left text-sm font-medium text-amber-950 hover:bg-amber-50"
              >
                Exit client view
              </button>
            </form>
          ) : null}

          <button
            type="button"
            role="menuitem"
            onClick={onLockApp}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-emerald-950 hover:bg-emerald-50"
          >
            <LockIcon />
            Lock app
          </button>

          <form action={logoutAction} role="none" data-no-pending>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center px-3 py-2.5 text-left text-sm font-medium text-rose-800 hover:bg-rose-50"
            >
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-emerald-900/55 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.5 7V5.5a3.5 3.5 0 0 1 7 0V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="3"
        y="7"
        width="10"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
