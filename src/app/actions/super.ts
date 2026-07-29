"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api-client";
import { requireSuperAdmin } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function createClientAction(formData: FormData) {
  await requireSuperAdmin();

  const result = await apiFetch<{ clientId: string }>("/api/v1/super/clients", {
    method: "POST",
    body: {
      name: String(formData.get("name") || "").trim(),
      adminEmail: String(formData.get("adminEmail") || "").trim().toLowerCase(),
      adminName: String(formData.get("adminName") || "").trim() || "Lab Admin",
      adminPassword: String(formData.get("adminPassword") || "lab123"),
    },
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/super");
  await setFlash("Client created successfully.");
  return { ok: true as const, clientId: result.data.clientId };
}

export async function updateClientFlagsAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();
  const clientId = String(formData.get("clientId") || "");

  const result = await apiFetch(`/api/v1/super/clients/${clientId}`, {
    method: "PATCH",
    body: {
      isActive: formData.get("isActive") === "on",
      featureEmail: formData.get("featureEmail") === "on",
      featureSms: formData.get("featureSms") === "on",
      featureWhatsapp: formData.get("featureWhatsapp") === "on",
      featureEmailEndsAt: String(formData.get("featureEmailEndsAt") || "") || null,
      featureSmsEndsAt: String(formData.get("featureSmsEndsAt") || "") || null,
      featureWhatsappEndsAt:
        String(formData.get("featureWhatsappEndsAt") || "") || null,
    },
  });

  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }

  revalidatePath("/super");
  revalidatePath(`/super/clients/${clientId}`);
  revalidatePath("/app/features");
  await setFlash("Feature flags saved successfully.");
}

function messagingBodyFromForm(formData: FormData) {
  const smtpPass = String(formData.get("smtpPass") || "");
  const whatsappApiToken = String(formData.get("whatsappApiToken") || "");

  return {
    emailEnabled: formData.get("emailEnabled") === "on",
    smtpHost: String(formData.get("smtpHost") || "").trim() || null,
    smtpPort: Number(formData.get("smtpPort") || 587),
    smtpUser: String(formData.get("smtpUser") || "").trim() || null,
    ...(smtpPass ? { smtpPass } : { smtpPass: "" }),
    smtpFrom: String(formData.get("smtpFrom") || "").trim() || null,
    whatsappEnabled: formData.get("whatsappEnabled") === "on",
    whatsappMode: String(formData.get("whatsappMode") || "CLICK_TO_CHAT"),
    whatsappDefaultCountryCode: String(
      formData.get("whatsappDefaultCountryCode") || "91",
    ).trim(),
    whatsappApiProvider: String(formData.get("whatsappApiProvider") || "").trim() || null,
    ...(whatsappApiToken ? { whatsappApiToken } : { whatsappApiToken: "" }),
    whatsappPhoneNumberId:
      String(formData.get("whatsappPhoneNumberId") || "").trim() || null,
    whatsappApiBaseUrl: String(formData.get("whatsappApiBaseUrl") || "").trim() || null,
  };
}

/** LabSaaS support inbox SMTP (feature-request mail). */
export async function updateMessagingConfigAction(formData: FormData) {
  await requireSuperAdmin();

  const result = await apiFetch("/api/v1/super/messaging", {
    method: "PATCH",
    body: messagingBodyFromForm(formData),
  });

  if (!result.ok) {
    await setFlash(result.error, "error");
    return { error: result.error };
  }

  revalidatePath("/super/messaging");
  await setFlash("Support messaging settings saved.");
  return { ok: true as const };
}

/** Per-lab SMTP / WhatsApp credentials. */
export async function updateClientMessagingConfigAction(formData: FormData) {
  await requireSuperAdmin();
  const clientId = String(formData.get("clientId") || "").trim();
  if (!clientId) return { error: "Missing client" };

  const result = await apiFetch(`/api/v1/super/clients/${clientId}/messaging`, {
    method: "PATCH",
    body: messagingBodyFromForm(formData),
  });

  if (!result.ok) {
    await setFlash(result.error, "error");
    return { error: result.error };
  }

  revalidatePath(`/super/clients/${clientId}`);
  revalidatePath("/app/features");
  await setFlash("Client messaging settings saved.");
  return { ok: true as const };
}
