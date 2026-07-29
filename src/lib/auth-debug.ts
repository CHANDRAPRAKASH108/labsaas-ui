import { cookies } from "next/headers";
import { uiLog } from "@/lib/ui-log";

export const AUTH_DEBUG_COOKIE = "lab_auth_debug";

export type AuthDebugPayload = {
  at: string;
  step: string;
  message: string;
  detail?: Record<string, unknown>;
};

export function authLog(step: string, message: string, detail?: Record<string, unknown>) {
  return uiLog(step, message, detail);
}

/** Short-lived cookie the login UI can read after a bounce-back. */
export async function setAuthDebugCookie(
  step: string,
  message: string,
  detail?: Record<string, unknown>,
) {
  const jar = await cookies();
  const payload: AuthDebugPayload = {
    at: new Date().toISOString(),
    step,
    message,
    detail,
  };
  jar.set(AUTH_DEBUG_COOKIE, JSON.stringify(payload), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 120,
  });
  authLog(step, message, detail);
}

export async function peekAuthDebugCookie(): Promise<AuthDebugPayload | null> {
  const jar = await cookies();
  const raw = jar.get(AUTH_DEBUG_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthDebugPayload;
  } catch {
    return { at: new Date().toISOString(), step: "parse", message: raw };
  }
}

export async function clearAuthDebugCookie() {
  const jar = await cookies();
  jar.delete(AUTH_DEBUG_COOKIE);
}
