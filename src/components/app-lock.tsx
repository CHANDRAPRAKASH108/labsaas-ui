"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";
import { logoutAction, verifyPasswordAction } from "@/app/actions/auth";

const STORAGE_KEY = "labsaas_app_locked";

type AppLockContextValue = {
  locked: boolean;
  lockApp: () => void;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) {
    return {
      locked: false,
      lockApp: () => {},
    };
  }
  return ctx;
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setLocked(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setLocked(false);
    }
    setReady(true);
  }, []);

  const lockApp = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage failures
    }
    setLocked(true);
  }, []);

  const unlockApp = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setLocked(false);
  }, []);

  return (
    <AppLockContext.Provider value={{ locked, lockApp }}>
      {children}
      {ready && locked ? <AppLockOverlay onUnlocked={unlockApp} /> : null}
    </AppLockContext.Provider>
  );
}

function AppLockOverlay({ onUnlocked }: { onUnlocked: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titleId = useId();
  const errorId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Keep Esc from bubbling into other UI (menus, fullscreen, etc.)
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  async function onUnlock(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await verifyPasswordAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onUnlocked();
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-emerald-950/45 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={error ? errorId : undefined}
    >
      <div className="w-full max-w-sm rounded-2xl border border-emerald-800/15 bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-800 text-white">
            <LockIcon />
          </span>
          <div>
            <h2 id={titleId} className="text-base font-semibold text-emerald-950">
              App locked
            </h2>
            <p className="text-sm text-emerald-900/65">Enter your password to continue</p>
          </div>
        </div>

        <form action={onUnlock} className="space-y-3" data-no-pending>
          <label htmlFor="app-lock-password" className="block text-sm font-medium text-emerald-950">
            Password
          </label>
          <input
            id="app-lock-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            disabled={pending}
            className="min-h-11 w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25 disabled:opacity-60"
          />
          {error ? (
            <p id={errorId} role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Unlocking…" : "Unlock"}
          </button>
        </form>

        <form action={logoutAction} className="mt-3" data-no-pending>
          <button
            type="submit"
            className="inline-flex min-h-10 w-full items-center justify-center rounded-lg px-3 text-sm font-medium text-emerald-900/70 hover:bg-emerald-50"
          >
            Sign out instead
          </button>
        </form>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
