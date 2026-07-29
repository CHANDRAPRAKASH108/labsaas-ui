"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { setFlash } from "@/lib/flash";

export async function createTestAction(formData: FormData): Promise<void> {
  const result = await apiFetch("/api/v1/tests", {
    method: "POST",
    body: {
      name: String(formData.get("name") || "").trim(),
      code: String(formData.get("code") || "").trim(),
      price: Number(formData.get("price") || 0),
      category: String(formData.get("category") || "") || null,
      defaultReportComment:
        String(formData.get("defaultReportComment") || "").trim() || null,
    },
  });

  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }

  revalidatePath("/app/tests");
  await setFlash("Test created successfully.");
}

export async function updateTestAction(formData: FormData): Promise<void> {
  const testId = String(formData.get("testId") || "");
  const returnTo = String(formData.get("returnTo") || "").trim();

  const result = await apiFetch(`/api/v1/tests/${testId}`, {
    method: "PATCH",
    body: {
      name: String(formData.get("name") || "").trim(),
      code: String(formData.get("code") || "").trim(),
      price: Number(formData.get("price") || 0),
      category: String(formData.get("category") || "") || null,
      defaultReportComment:
        String(formData.get("defaultReportComment") || "").trim() || null,
    },
  });

  if (!result.ok) {
    await setFlash(result.error, "error");
    redirect(returnTo || `/app/tests?edit=${testId}`);
  }

  revalidatePath("/app/tests");
  revalidatePath(`/app/tests/${testId}`);
  await setFlash("Test updated successfully.");
  redirect(returnTo || "/app/tests");
}

export async function deleteTestAction(formData: FormData): Promise<void> {
  const testId = String(formData.get("testId") || "");
  const result = await apiFetch<{
    deleted?: boolean;
    deactivated?: boolean;
    message?: string;
  }>(`/api/v1/tests/${testId}`, { method: "DELETE" });

  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }

  revalidatePath("/app/tests");
  await setFlash(
    result.data.message ||
      (result.data.deactivated
        ? "Test deactivated (still used on orders)."
        : "Test deleted."),
  );
}

/** Add a platform master test as an editable snapshot for this lab. */
export async function addFromCatalogAction(formData: FormData): Promise<void> {
  const masterTestId = String(formData.get("masterTestId") || "").trim();
  const result = await apiFetch("/api/v1/catalog/tests", {
    method: "POST",
    body: { masterTestId },
  });

  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }

  revalidatePath("/app/tests");
  await setFlash("Test added to your lab catalog. You can edit price and fields anytime.");
}

export async function addTestFieldAction(formData: FormData): Promise<void> {
  const testId = String(formData.get("testId") || "");
  const result = await apiFetch(`/api/v1/tests/${testId}/fields`, {
    method: "POST",
    body: {
      label: String(formData.get("label") || "").trim(),
      key: String(formData.get("key") || "").trim(),
      unit: String(formData.get("unit") || "") || null,
      fieldType: String(formData.get("fieldType") || "NUMBER"),
      referenceMin: formData.get("referenceMin")
        ? Number(formData.get("referenceMin"))
        : null,
      referenceMax: formData.get("referenceMax")
        ? Number(formData.get("referenceMax"))
        : null,
      referenceText: String(formData.get("referenceText") || "") || null,
      sortOrder: Number(formData.get("sortOrder") || 0),
      required: formData.get("required") === "on",
    },
  });

  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }

  revalidatePath(`/app/tests/${testId}`);
  await setFlash("Result field added successfully.");
}

export async function deleteTestFieldAction(
  fieldId: string,
  testId: string,
): Promise<void> {
  const result = await apiFetch(
    `/api/v1/tests/${testId}/fields/${fieldId}`,
    { method: "DELETE" },
  );

  if (!result.ok) {
    await setFlash(result.error, "error");
    return;
  }

  revalidatePath(`/app/tests/${testId}`);
  await setFlash("Result field removed.");
}
