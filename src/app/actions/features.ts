"use server";

import { z } from "zod";
import { requireClientContext } from "@/lib/session";
import { apiFetch } from "@/lib/api-client";
import { setFlash } from "@/lib/flash";

const schema = z.object({
  features: z.array(z.enum(["Email", "SMS", "WhatsApp"])).min(1),
  message: z.string().trim().min(5, "Please enter a short message (at least 5 characters)"),
});

export async function requestFeatureEnableAction(input: {
  features: string[];
  message: string;
}) {
  await requireClientContext();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid request" };
  }

  const result = await apiFetch<{ to: string; emailed?: boolean; note?: string }>(
    "/api/v1/features/request",
    {
      method: "POST",
      body: parsed.data,
    },
  );

  if (!result.ok) {
    await setFlash(result.error || "Could not submit the request.", "error");
    return { error: result.error };
  }

  await setFlash(
    result.data.note ||
      (result.data.emailed === false
        ? `Request logged. Contact ${result.data.to} or your Super Admin.`
        : "Feature enable request sent successfully."),
  );
  return { ok: true as const, to: result.data.to };
}
