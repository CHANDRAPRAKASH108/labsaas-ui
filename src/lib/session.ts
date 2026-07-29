import { redirect } from "next/navigation";
import { getSession, effectiveClientId, type SessionUser } from "./auth";

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") redirect("/app");
  return session;
}

export async function requireClientContext(): Promise<{
  session: SessionUser;
  clientId: string;
}> {
  const session = await requireSession();
  const clientId = effectiveClientId(session);
  if (!clientId) {
    if (session.role === "SUPER_ADMIN") redirect("/super");
    redirect("/login");
  }
  return { session, clientId };
}
