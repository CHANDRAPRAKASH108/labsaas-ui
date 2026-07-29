import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

/** JWT session role — string union (no @prisma/client in web). */
export type Role = "SUPER_ADMIN" | "CLIENT_ADMIN" | "STAFF";

export const SESSION_COOKIE = "lab_session";
const COOKIE = SESSION_COOKIE;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId: string | null;
  /** When super admin is viewing a client */
  impersonatingClientId?: string | null;
};

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  await setSessionTokenCookie(token);
}

/** Store an API-issued JWT as the session cookie (preferred). */
export async function setSessionTokenCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Deduped per request — safe to call from layout + page. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
});

export function effectiveClientId(session: SessionUser): string | null {
  if (session.role === "SUPER_ADMIN") {
    return session.impersonatingClientId ?? null;
  }
  return session.clientId;
}

export function isSuperAdmin(session: SessionUser) {
  return session.role === "SUPER_ADMIN";
}
