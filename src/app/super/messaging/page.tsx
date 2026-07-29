import { apiFetch } from "@/lib/api-client";
import { requireSuperAdmin } from "@/lib/session";
import { Card, EmptyState } from "@/components/ui";
import { MessagingConfigForm, type MessagingConfig } from "@/components/messaging-config-form";

export default async function SuperMessagingPage() {
  await requireSuperAdmin();

  const result = await apiFetch<{ config: MessagingConfig }>("/api/v1/super/messaging");

  return (
    <>
      <Card title="LabSaaS support mail">
        <p className="mb-4 text-sm text-emerald-900/70">
          SMTP for LabSaaS feature-request / support mail only. Lab invoice and report email is
          configured per client under <strong>Clients → open lab → Messaging for this lab</strong>.
        </p>
        {!result.ok ? (
          <EmptyState>Could not load settings: {result.error}</EmptyState>
        ) : (
          <MessagingConfigForm config={result.data.config} variant="platform" />
        )}
      </Card>
    </>
  );
}
