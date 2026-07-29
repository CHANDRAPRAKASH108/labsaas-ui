import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/auth";
import { uiLog } from "@/lib/ui-log";

/**
 * Sets the httpOnly session cookie via a normal Route Handler response.
 * Server-action `cookies().set()` + `redirect()` was dropping Set-Cookie
 * on Vercel (HAR showed 303 to /super with no Set-Cookie).
 */
export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    uiLog("api/auth/session", "reject token (verify failed)", undefined, "error");
    return NextResponse.json(
      { ok: false, error: "Invalid session token (check AUTH_SECRET matches API)" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({
    ok: true,
    data: { role: session.role, email: session.email },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  uiLog("api/auth/session", "cookie set", { role: session.role, email: session.email });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  uiLog("api/auth/session", "cookie cleared");
  return res;
}
