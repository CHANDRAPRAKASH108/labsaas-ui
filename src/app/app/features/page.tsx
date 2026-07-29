import { requireClientContext } from "@/lib/session";
import { getClientBrief } from "@/lib/client-data";
import { Badge, Card, EmptyState } from "@/components/ui";
import { RequestFeatureEnable } from "@/components/request-feature-enable";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpired(enabled: boolean, endsAt: string | null | undefined) {
  if (!enabled || !endsAt) return false;
  const ms = new Date(endsAt).getTime();
  return !Number.isNaN(ms) && ms < Date.now();
}

export default async function FeaturesPage() {
  const { clientId } = await requireClientContext();
  const client = await getClientBrief(clientId);

  const features = [
    {
      name: "Email",
      description: "Send reports and notifications by email",
      enabled: client.featureEmail,
      enabledAt: client.featureEmailEnabledAt,
      endsAt: client.featureEmailEndsAt,
      ready: client.channels?.email ?? false,
      platformConfigured: client.messagingMeta?.email.configured ?? false,
    },
    {
      name: "SMS",
      description: "Send patient notifications by SMS",
      enabled: client.featureSms,
      enabledAt: client.featureSmsEnabledAt,
      endsAt: client.featureSmsEndsAt,
      ready: client.channels?.sms ?? false,
      platformConfigured: client.messagingMeta?.sms.configured ?? false,
    },
    {
      name: "WhatsApp",
      description: "Send patient notifications on WhatsApp",
      enabled: client.featureWhatsapp,
      enabledAt: client.featureWhatsappEnabledAt,
      endsAt: client.featureWhatsappEndsAt,
      ready: client.channels?.whatsapp ?? false,
      platformConfigured: client.messagingMeta?.whatsapp.configured ?? false,
    },
  ];

  const disabledFeatures = features
    .filter((feature) => {
      const expired = isExpired(feature.enabled, feature.endsAt);
      return !feature.enabled || expired;
    })
    .map((feature) => feature.name);

  return (
    <>
      <Card
        title="Messaging channels"
        action={<RequestFeatureEnable disabledFeatures={disabledFeatures} />}
      >
        <p className="mb-4 text-sm text-emerald-900/70">
          These channels are controlled by Super Admin. A channel only works when the lab flag is
          on <strong>and</strong> platform messaging is configured under Super Admin → Messaging.
          Use <strong>Request enable</strong> to ask for a channel to be turned on.
        </p>

        <ul className="divide-y divide-emerald-800/10" aria-label="Feature list">
          {features.map((feature) => {
            const expired = isExpired(feature.enabled, feature.endsAt);

            return (
              <li
                key={feature.name}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-emerald-950">{feature.name}</p>
                    <Badge tone={feature.enabled && !expired ? "green" : "slate"}>
                      {feature.enabled ? (expired ? "Expired" : "Enabled") : "Disabled"}
                    </Badge>
                    {feature.enabled && !expired ? (
                      <Badge tone={feature.ready ? "teal" : "amber"}>
                        {feature.ready
                          ? "Ready to send"
                          : feature.platformConfigured
                            ? "Waiting"
                            : "Messaging not configured"}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-emerald-900/65">{feature.description}</p>
                </div>

                <dl className="grid shrink-0 gap-1 text-sm sm:text-right">
                  <div>
                    <dt className="inline text-emerald-900/55">Enabled on: </dt>
                    <dd className="inline font-medium text-emerald-950">
                      {feature.enabled ? formatDate(feature.enabledAt) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-emerald-900/55">Subscription ends: </dt>
                    <dd className="inline font-medium text-emerald-950">
                      {feature.enabled ? formatDate(feature.endsAt) : "—"}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>

        {!features.some((f) => f.enabled) ? (
          <div className="mt-2">
            <EmptyState>
              No messaging features are enabled for this lab yet. Use Request enable to ask Super
              Admin.
            </EmptyState>
          </div>
        ) : null}
      </Card>
    </>
  );
}
