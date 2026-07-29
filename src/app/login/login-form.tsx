"use client";

import { useEffect, useId, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { useActionPending } from "@/components/action-pending";
import { useComponentLog, logUiEvent } from "@/hooks/use-component-log";
import type { AuthDebugPayload } from "@/lib/auth-debug";

export function LoginForm({
  initialDebug = null,
}: {
  initialDebug?: AuthDebugPayload | null;
}) {
  useComponentLog("LoginForm");
  const router = useRouter();
  const { pending, setPending } = useActionPending();
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  useEffect(() => {
    if (!initialDebug) return;
    logUiEvent(
      "LoginForm",
      initialDebug.message,
      {
        step: initialDebug.step,
        at: initialDebug.at,
        ...initialDebug.detail,
      },
      "warn",
    );
  }, [initialDebug]);

  function onFormSubmit() {
    flushSync(() => {
      setError(null);
      setPending(true);
    });
    logUiEvent("LoginForm", "form submit");
  }

  async function onAction(formData: FormData) {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    logUiEvent("LoginForm", "calling loginAction", { email });

    try {
      const result = await loginAction(formData);
      if (result?.error) {
        logUiEvent(
          "LoginForm",
          "loginAction returned error",
          { error: result.error, debug: result.debug },
          "error",
        );
        setError(result.error);
        setPending(false);
        return;
      }

      if (!result?.token || !result.redirectTo) {
        logUiEvent("LoginForm", "loginAction missing token/redirectTo", { result }, "error");
        setError("Sign in failed (no session token)");
        setPending(false);
        return;
      }

      logUiEvent("LoginForm", "establishing session cookie", {
        redirectTo: result.redirectTo,
        debug: result.debug,
      });

      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: result.token }),
      });
      const sessionJson = (await sessionRes.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!sessionRes.ok || sessionJson.ok === false) {
        const message = sessionJson.error || `Could not set session (${sessionRes.status})`;
        logUiEvent("LoginForm", "session cookie failed", { message }, "error");
        setError(message);
        setPending(false);
        return;
      }

      logUiEvent("LoginForm", "session cookie set, navigating", {
        redirectTo: result.redirectTo,
      });
      router.replace(result.redirectTo);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logUiEvent("LoginForm", "loginAction threw", { message }, "error");
      setError(message || "Sign in failed");
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <main className="w-full max-w-md rounded-2xl border border-emerald-800/15 bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
        <Logo href="/" size="md" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-emerald-950">Sign in</h1>
        <p className="mt-2 text-sm text-emerald-900/70">
          Access your lab workspace. Super Admins manage clients; lab users manage patients,
          reports, and invoices.
        </p>

        <form
          action={onAction}
          onSubmit={onFormSubmit}
          className="mt-6 space-y-4"
          noValidate
          aria-describedby={error ? errorId : undefined}
        >
          <div className="text-sm">
            <label htmlFor="email" className="mb-1.5 block font-medium text-emerald-950/80">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              defaultValue="super@labsaas.local"
              className="min-h-11 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
            />
          </div>
          <div className="text-sm">
            <label htmlFor="password" className="mb-1.5 block font-medium text-emerald-950/80">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              defaultValue="admin123"
              className="min-h-11 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
            />
          </div>
          {error ? (
            <p id={errorId} role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending || undefined}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? (
              <>
                <span className="lab-spinner lab-spinner--on-dark size-4" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-xs text-emerald-900/55">
          Sample lab admin: admin@sunrise.local / lab123 ·{" "}
          <Link href="/" className="font-medium text-emerald-800 underline">
            Home
          </Link>
        </p>
      </main>
    </div>
  );
}
