"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import {
  clearSessionCookie,
  setSessionTokenCookie,
  type Role,
} from "@/lib/auth";
import { navForSession } from "@/lib/nav";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

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
    return { error: result.error };
  }

  await setSessionTokenCookie(result.data.token);

  const { user } = result.data;
  if (user.role === "SUPER_ADMIN") {
    redirect("/super");
  }

  if (user.role === "STAFF") {
    const nav = navForSession({
      role: user.role,
      allowedScreens: user.allowedScreens,
    });
    redirect(nav[0]?.href || "/app");
  }

  redirect("/app");
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
