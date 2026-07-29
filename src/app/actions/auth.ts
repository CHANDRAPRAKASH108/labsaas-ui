"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import {
  clearSessionCookie,
  setSessionTokenCookie,
  verifySessionToken,
  type Role,
} from "@/lib/auth";
import { authLog, setAuthDebugCookie } from "@/lib/auth-debug";
import { apiUrl } from "@/lib/api-url";
import { navForSession } from "@/lib/nav";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const apiBase = apiUrl("/").replace(/\/$/, "");

  authLog("loginAction", "start", {
    email,
    apiBase,
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
  });

  const result = await apiFetch<{
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      clientId: string | null;
      allowedScreens: string[];
    };
  }>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });

  if (!result.ok) {
    await setAuthDebugCookie("loginAction", "API login failed", {
      email,
      apiBase,
      status: result.status,
      error: result.error,
    });
    return {
      error: result.error,
      debug: {
        apiBase,
        status: result.status,
        hasAuthSecret: Boolean(process.env.AUTH_SECRET),
      },
    };
  }

  const verified = await verifySessionToken(result.data.token);
  if (!verified) {
    await setAuthDebugCookie(
      "loginAction",
      "API returned token but web JWT verify failed — AUTH_SECRET likely differs from API",
      {
        apiBase,
        role: result.data.user.role,
        tokenLength: result.data.token.length,
        hasAuthSecret: Boolean(process.env.AUTH_SECRET),
      },
    );
    return {
      error:
        "Signed in on API, but this UI could not verify the session token. Check AUTH_SECRET matches the API.",
      debug: {
        apiBase,
        role: result.data.user.role,
        hasAuthSecret: Boolean(process.env.AUTH_SECRET),
        verifyFailed: true,
      },
    };
  }

  const { user } = result.data;
  const redirectTo =
    user.role === "SUPER_ADMIN"
      ? "/super"
      : user.role === "STAFF"
        ? navForSession({
            role: user.role,
            allowedScreens: user.allowedScreens,
          })[0]?.href || "/app"
        : "/app";

  authLog("loginAction", "ok — client will set cookie then navigate", {
    email: user.email,
    role: user.role,
    redirectTo,
    apiBase,
  });

  // Do not cookies().set() + redirect() here: Vercel drops Set-Cookie on the
  // action 303 (see HAR). Client establishes the cookie via /api/auth/session.
  return {
    token: result.data.token,
    redirectTo,
    debug: { apiBase, role: user.role },
  };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function verifyPasswordAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!password) return { error: "Enter your password" };

  const result = await apiFetch<{ verified: boolean }>(
    "/api/v1/auth/verify-password",
    { method: "POST", body: { password } },
  );

  if (!result.ok) {
    return { error: result.error || "Incorrect password" };
  }

  return { ok: true as const };
}

export async function impersonateClientAction(clientId: string): Promise<void> {
  const result = await apiFetch<{ token: string; clientId: string }>(
    "/api/v1/auth/impersonate",
    { method: "POST", body: { clientId } },
  );

  if (!result.ok) {
    redirect("/super");
  }

  await setSessionTokenCookie(result.data.token);
  redirect("/app");
}

export async function stopImpersonationAction() {
  const result = await apiFetch<{ token: string }>(
    "/api/v1/auth/stop-impersonation",
    { method: "POST", body: {} },
  );

  if (!result.ok) {
    redirect("/login");
  }

  await setSessionTokenCookie(result.data.token);
  redirect("/super");
}
