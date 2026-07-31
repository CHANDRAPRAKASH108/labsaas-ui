import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { flashCookieName } from "@/lib/flash";

/** Clears the flash cookie without a full RSC refresh. */
export async function POST() {
  const jar = await cookies();
  jar.delete(flashCookieName());
  return new NextResponse(null, { status: 204 });
}
