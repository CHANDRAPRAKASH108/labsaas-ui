import { cache } from "react";
import { apiFetch } from "@/lib/api-client";

/** Per-request lookup of staff screen permissions via API. */
export const getAllowedScreens = cache(async (_userId: string) => {
  const result = await apiFetch<{
    user: { allowedScreens: string[] };
  }>("/api/v1/me");
  if (!result.ok) return [];
  return result.data.user.allowedScreens ?? [];
});
