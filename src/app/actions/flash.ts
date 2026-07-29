"use server";

import { cookies } from "next/headers";
import { flashCookieName } from "@/lib/flash";

export async function clearFlashAction() {
  const jar = await cookies();
  jar.delete(flashCookieName());
}
