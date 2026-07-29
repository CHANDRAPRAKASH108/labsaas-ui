import { cookies } from "next/headers";

const FLASH_COOKIE = "lab_flash";

export type FlashPayload = {
  message: string;
  tone?: "success" | "error";
};

export function flashCookieName() {
  return FLASH_COOKIE;
}

export async function setFlash(message: string, tone: FlashPayload["tone"] = "success") {
  const jar = await cookies();
  jar.set(FLASH_COOKIE, JSON.stringify({ message, tone } satisfies FlashPayload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30,
  });
}

export async function peekFlash(): Promise<FlashPayload | null> {
  const jar = await cookies();
  const raw = jar.get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FlashPayload;
  } catch {
    return { message: raw, tone: "success" };
  }
}
