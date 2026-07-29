import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { requireSuperAdmin } from "@/lib/session";
import { Badge, Card, EmptyState, Field, PrimaryButton } from "@/components/ui";
import { MessagingConfigForm, type MessagingConfig } from "@/components/messaging-config-form";
import { updateClientFlagsAction } from "@/app/actions/super";
import { impersonateClientAction } from "@/app/actions/auth";

function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

type SuperClientDetail = {
  id: string;
  name?: string;
  isActive: boolean;
  featureEmail: boolean;
  featureSms: boolean;
  featureWhatsapp: boolean;
  featureEmailEndsAt: string | null;
  featureSmsEndsAt: string | null;
  featureWhatsappEndsAt: string | null;
  users: { id: string; name: string; email: string; role: string }[];
};

export default async function ClientConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const [clientResult, messagingResult] = await Promise.all([
    apiFetch<{ client: SuperClientDetail }>(`/api/v1/super/clients/${id}`),
    apiFetch<{ config: MessagingConfig }>(`/api/v1/super/clients/${id}/messaging`),
  ]);
  if (!clientResult.ok) {
    if (clientResult.status === 404) notFound();
    throw new Error(clientResult.error);
  }
  const client = clientResult.data.client;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone={client.isActive ? "green" : "red"}>
          {client.isActive ? "Active" : "Inactive"}
        </Badge>
        <form action={impersonateClientAction.bind(null, client.id)}>
          <PrimaryButton>Open this client&apos;s app</PrimaryButton>
        </form>
        <Link href="/super" className="text-sm text-emerald-800 underline">
          Back
        </Link>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="Feature flags (Super Admin only)">
          <p className="mb-4 text-sm text-emerald-900/70">
            Turn channels on for this lab and set subscription end dates. Labs also need messaging
            credentials below before Email / WhatsApp can send.
          </p>
          <form action={updateClientFlagsAction} className="space-y-5">
            <input type="hidden" name="clientId" value={client.id} />
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-950">
              <input type="checkbox" name="isActive" defaultChecked={client.isActive} className="size-4" />
              Lab active
            </label>

            <div className="space-y-3 rounded-lg border border-emerald-800/15 bg-emerald-50/40 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-emerald-950">
                <input
                  type="checkbox"
                  name="featureEmail"
                  defaultChecked={client.featureEmail}
                  className="size-4"
                />
                Email reports / notifications
              </label>
              <Field
                label="Email subscription end date"
                name="featureEmailEndsAt"
                type="date"
                defaultValue={toDateInputValue(client.featureEmailEndsAt)}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-emerald-800/15 bg-emerald-50/40 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-emerald-950">
                <input
                  type="checkbox"
                  name="featureSms"
                  defaultChecked={client.featureSms}
                  className="size-4"
                />
                SMS notifications
              </label>
              <Field
                label="SMS subscription end date"
                name="featureSmsEndsAt"
                type="date"
                defaultValue={toDateInputValue(client.featureSmsEndsAt)}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-emerald-800/15 bg-emerald-50/40 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-emerald-950">
                <input
                  type="checkbox"
                  name="featureWhatsapp"
                  defaultChecked={client.featureWhatsapp}
                  className="size-4"
                />
                WhatsApp notifications
              </label>
              <Field
                label="WhatsApp subscription end date"
                name="featureWhatsappEndsAt"
                type="date"
                defaultValue={toDateInputValue(client.featureWhatsappEndsAt)}
              />
            </div>

            <PrimaryButton>Save flags</PrimaryButton>
          </form>
        </Card>

        <Card title="Users">
          <ul className="space-y-2 text-sm">
            {client.users.map((u) => (
              <li
                key={u.id}
                className="flex justify-between border-b border-emerald-800/10 py-2"
              >
                <span>
                  {u.name}
                  <span className="block text-xs text-emerald-900/55">{u.email}</span>
                </span>
                <Badge>{u.role}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Messaging for this lab">
        <p className="mb-4 text-sm text-emerald-900/70">
          Each lab has its own SMTP and WhatsApp settings. Leave them off if this client does not
          need email/WhatsApp. Channels only work when the feature flag is on <strong>and</strong>{" "}
          the matching config below is complete.
        </p>
        {!messagingResult.ok ? (
          <EmptyState>Could not load messaging: {messagingResult.error}</EmptyState>
        ) : (
          <MessagingConfigForm
            clientId={client.id}
            config={messagingResult.data.config}
            variant="client"
          />
        )}
      </Card>
    </>
  );
}
