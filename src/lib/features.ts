/** Feature-flag helpers for messaging channels. */

export type FeatureChannel = "email" | "sms" | "whatsapp";

type FeatureFlags = {
  featureEmail: boolean;
  featureSms: boolean;
  featureWhatsapp: boolean;
  featureEmailEndsAt: string | Date | null;
  featureSmsEndsAt: string | Date | null;
  featureWhatsappEndsAt: string | Date | null;
};

export type ClientChannels = {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
};

function endsAtMs(endsAt: string | Date | null | undefined): number | null {
  if (endsAt == null) return null;
  const ms = typeof endsAt === "string" ? new Date(endsAt).getTime() : endsAt.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function isActive(
  enabled: boolean,
  endsAt: string | Date | null | undefined,
  now = Date.now(),
) {
  if (!enabled) return false;
  const end = endsAtMs(endsAt);
  if (end != null && end < now) return false;
  return true;
}

export function isFeatureChannelActive(client: FeatureFlags, channel: FeatureChannel) {
  switch (channel) {
    case "email":
      return isActive(client.featureEmail, client.featureEmailEndsAt);
    case "sms":
      return isActive(client.featureSms, client.featureSmsEndsAt);
    case "whatsapp":
      return isActive(client.featureWhatsapp, client.featureWhatsappEndsAt);
  }
}

/** Prefer API-computed `channels` (feature flag AND platform config). */
export function getActiveFeatureChannels(
  client: FeatureFlags & { channels?: ClientChannels | null },
) {
  if (client.channels) {
    return {
      email: client.channels.email,
      sms: client.channels.sms,
      whatsapp: client.channels.whatsapp,
    };
  }

  // Fallback: feature flags only (platform config unknown)
  return {
    email: isFeatureChannelActive(client, "email"),
    sms: isFeatureChannelActive(client, "sms"),
    whatsapp: isFeatureChannelActive(client, "whatsapp"),
  };
}
