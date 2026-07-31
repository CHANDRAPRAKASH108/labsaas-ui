"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { setFlash } from "@/lib/flash";
import { parseScreenKeys } from "@/lib/nav";

export async function updateBrandingAction(formData: FormData): Promise<void> {
  const body = new FormData();
  for (const key of [
    "name",
    "address",
    "phone",
    "email",
    "gstin",
    "invoicePrefix",
    "invoiceMessage",
    "reportFooter",
  ]) {
    if (formData.has(key)) body.set(key, String(formData.get(key) ?? ""));
  }
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) body.set("logo", logo);

  const result = await apiFetch("/api/v1/client", {
    method: "PATCH",
    formData: body,
  });
  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }
  revalidatePath("/app/settings");
  const isMessages =
    formData.has("invoiceMessage") ||
    formData.has("reportFooter") ||
    (formData.has("invoicePrefix") && !formData.has("name"));
  await setFlash(isMessages ? "Messages saved successfully." : "Branding saved successfully.");
}

export async function createPatientAction(formData: FormData): Promise<void> {
  const ageRaw = String(formData.get("age") || "").trim();
  const result = await apiFetch("/api/v1/patients", {
    method: "POST",
    body: {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      email: String(formData.get("email") || "") || null,
      age: ageRaw ? Number(ageRaw) : undefined,
      gender: String(formData.get("gender") || "").trim() || undefined,
    },
  });
  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }
  revalidatePath("/app/patients");
  revalidatePath("/app/orders/new");
  await setFlash("Patient saved successfully.");
}

export async function updatePatientAction(formData: FormData): Promise<void> {
  const patientId = String(formData.get("patientId") || "");
  const orderId = String(formData.get("orderId") || "");
  const ageRaw = String(formData.get("age") || "").trim();
  const result = await apiFetch(`/api/v1/patients/${patientId}`, {
    method: "PATCH",
    body: {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      email: String(formData.get("email") || "").trim() || null,
      age: ageRaw ? Number(ageRaw) : undefined,
      gender: String(formData.get("gender") || "").trim() || undefined,
    },
  });
  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }
  revalidatePath("/app/patients");
  revalidatePath(`/app/patients/${patientId}`);
  if (orderId) revalidatePath(`/app/orders/${orderId}`);
  revalidatePath("/app/orders");
  await setFlash("Patient details updated.");
}

export async function createOrderAction(formData: FormData) {
  const ageRaw = String(formData.get("patientAge") || "").trim();
  const paymentMethodRaw = String(formData.get("paymentMethod") || "")
    .trim()
    .toUpperCase();
  const paymentMethod =
    paymentMethodRaw === "CASH" ||
    paymentMethodRaw === "UPI" ||
    paymentMethodRaw === "CARD" ||
    paymentMethodRaw === "OTHER"
      ? paymentMethodRaw
      : undefined;

  const result = await apiFetch<{
    orderId: string;
    invoiceId?: string | null;
    invoiceNumber?: string | null;
  }>("/api/v1/orders", {
    method: "POST",
    body: {
      patientMode: String(formData.get("patientMode") || "existing"),
      patientId: String(formData.get("patientId") || "") || undefined,
      patientName: String(formData.get("patientName") || "").trim() || undefined,
      patientPhone: String(formData.get("patientPhone") || "").trim() || undefined,
      patientAddress: String(formData.get("patientAddress") || "").trim() || undefined,
      patientAge: ageRaw ? Number(ageRaw) : undefined,
      patientGender: String(formData.get("patientGender") || "").trim() || undefined,
      patientEmail: String(formData.get("patientEmail") || "").trim() || undefined,
      testIds: formData.getAll("testIds").map(String),
      notes: String(formData.get("notes") || "") || null,
      paymentMethod: paymentMethod ?? null,
    },
  });
  if (!result.ok) return { error: result.error as string };
  revalidatePath("/app/orders");
  revalidatePath("/app/reports");
  revalidatePath("/app/invoices");
  // Avoid revalidating patients/counter here — it remounts the desk and wipes draft fields.
  const patientId = String(formData.get("patientId") || "");
  if (patientId) revalidatePath(`/app/patients/${patientId}`);
  revalidatePath(`/app/orders/${result.data.orderId}`);
  await setFlash(
    paymentMethod
      ? "Order completed. Invoice ready."
      : "Unpaid order created. Report added to the queue.",
  );
  return {
    ok: true as const,
    orderId: result.data.orderId,
    invoiceId: result.data.invoiceId ?? null,
    invoiceNumber: result.data.invoiceNumber ?? null,
  };
}

export async function startReportAction(reportId: string) {
  const result = await apiFetch<{ orderId: string }>(
    `/api/v1/reports/${reportId}/start`,
    { method: "POST", body: {} },
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/app/reports");
  if (result.data.orderId) {
    revalidatePath(`/app/reports/${result.data.orderId}`);
    revalidatePath(`/app/orders/${result.data.orderId}`);
  }
  await setFlash("Report moved to in progress.");
  return { ok: true as const };
}

export async function saveResultsAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get("reportId") || "");
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("value_")) {
      values[key.slice("value_".length)] = String(value);
    }
  }
  const result = await apiFetch<{ orderId: string }>(
    `/api/v1/reports/${reportId}/results`,
    {
      method: "PUT",
      body: {
        values,
        finalize:
          formData.get("finalize") === "on" || formData.get("complete") === "on",
        signedBy: String(formData.get("signedBy") || "Technician"),
      },
    },
  );
  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }
  const orderId = result.data.orderId;
  revalidatePath(`/app/orders/${orderId}`);
  revalidatePath("/app/reports");
  revalidatePath(`/app/reports/${orderId}`);
  await setFlash(
    formData.get("finalize") === "on" || formData.get("complete") === "on"
      ? "Report marked completed."
      : "Results saved. Report is in progress.",
  );
}

export async function createInvoiceAction(orderId: string) {
  const result = await apiFetch<{
    invoiceId: string;
    invoiceNumber: string;
    alreadyExisted?: boolean;
  }>("/api/v1/invoices", {
    method: "POST",
    body: { orderId },
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/app/invoices");
  revalidatePath(`/app/orders/${orderId}`);
  await setFlash("Invoice generated successfully.");
  return {
    ok: true as const,
    invoiceId: result.data.invoiceId,
    invoiceNumber: result.data.invoiceNumber,
    alreadyExisted: Boolean(result.data.alreadyExisted),
  };
}

export async function recordOrderPaymentAction(formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const result = await apiFetch(`/api/v1/orders/${orderId}/payment`, {
    method: "POST",
    body: {
      paymentMethod: String(formData.get("paymentMethod") || "").toUpperCase(),
    },
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(`/app/orders/${orderId}`);
  revalidatePath("/app/orders");
  await setFlash("Payment recorded.");
  return { ok: true as const };
}

export async function sendInvoiceAction(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId") || "");
  const channel = String(formData.get("channel") || "email");
  const result = await apiFetch<{
    channel: string;
    whatsappUrl?: string;
    note?: string;
  }>(`/api/v1/invoices/${invoiceId}/send`, {
    method: "POST",
    body: {
      channel,
      destination: String(formData.get("destination") || "").trim(),
    },
  });
  if (!result.ok) return { error: result.error };

  if (channel === "email") {
    await setFlash("Invoice PDF emailed successfully.");
  } else if (channel === "whatsapp") {
    await setFlash("Opening WhatsApp…");
  } else {
    await setFlash(result.data.note || "Send requested.");
  }

  return {
    ok: true as const,
    channel,
    whatsappUrl: result.data.whatsappUrl,
  };
}

export async function sendReportPdfAction(formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const destination = String(formData.get("destination") || "").trim();
  const result = await apiFetch(`/api/v1/reports/by-order/${orderId}/email`, {
    method: "POST",
    body: { destination },
  });
  if (!result.ok) return { error: result.error };
  await setFlash(`Report PDF emailed to ${destination}.`);
  return { ok: true as const };
}

export async function markInvoicePaidAction(invoiceId: string): Promise<void> {
  const result = await apiFetch(`/api/v1/invoices/${invoiceId}/paid`, {
    method: "POST",
    body: {},
  });
  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }
  revalidatePath("/app/invoices");
  revalidatePath(`/app/invoices/${invoiceId}`);
  await setFlash("Invoice marked as paid.");
}

export async function updateOrderMetaAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") || "");
  const result = await apiFetch(`/api/v1/orders/${orderId}`, {
    method: "PATCH",
    body: {
      notes: String(formData.get("notes") || "").trim() || null,
      status: String(formData.get("status") || ""),
    },
  });
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/app/orders");
  revalidatePath(`/app/orders/${orderId}`);
  await setFlash("Order updated.");
}

export async function addTestsToOrderAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") || "");
  const result = await apiFetch(`/api/v1/orders/${orderId}/items`, {
    method: "POST",
    body: { testIds: formData.getAll("testIds").map(String).filter(Boolean) },
  });
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/app/orders");
  revalidatePath(`/app/orders/${orderId}`);
  await setFlash("Tests added to order.");
}

export async function removeOrderItemAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") || "");
  const itemId = String(formData.get("itemId") || "");
  const result = await apiFetch(`/api/v1/orders/${orderId}/items/${itemId}`, {
    method: "DELETE",
  });
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/app/orders");
  revalidatePath(`/app/orders/${orderId}`);
  await setFlash("Test removed from order.");
}

export async function createLabUserAction(formData: FormData) {
  const result = await apiFetch("/api/v1/users", {
    method: "POST",
    body: {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim().toLowerCase(),
      password: String(formData.get("password") || "").trim() || "lab123",
      role: String(formData.get("role") || "STAFF"),
      screens: parseScreenKeys(formData.getAll("screens")),
    },
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/app/users");
  await setFlash("User created successfully.");
  return { ok: true as const };
}

export async function updateLabUserScreensAction(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  const result = await apiFetch(`/api/v1/users/${userId}/screens`, {
    method: "PATCH",
    body: { screens: parseScreenKeys(formData.getAll("screens")) },
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/app/users");
  await setFlash("Screen access updated.");
  return { ok: true as const };
}

export async function updateLabUserPasswordAction(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 4) {
    return { error: "Password must be at least 4 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const result = await apiFetch(`/api/v1/users/${userId}/password`, {
    method: "PATCH",
    body: { password },
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/app/users");
  await setFlash("Password updated.");
  return { ok: true as const };
}
