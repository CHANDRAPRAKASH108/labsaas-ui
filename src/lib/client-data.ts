import { cache } from "react";
import { apiFetch } from "@/lib/api-client";

export type ClientBrief = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  invoicePrefix: string;
  invoiceMessage: string | null;
  reportFooter: string | null;
  featureEmail: boolean;
  featureSms: boolean;
  featureWhatsapp: boolean;
  featureEmailEnabledAt: string | null;
  featureEmailEndsAt: string | null;
  featureSmsEnabledAt: string | null;
  featureSmsEndsAt: string | null;
  featureWhatsappEnabledAt: string | null;
  featureWhatsappEndsAt: string | null;
  isActive: boolean;
  channels?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  messagingMeta?: {
    email: { featureOn: boolean; configured: boolean };
    sms: { featureOn: boolean; configured: boolean };
    whatsapp: {
      featureOn: boolean;
      configured: boolean;
      mode: string;
      defaultCountryCode: string;
    };
  };
};

/** Lightweight client lookup, deduped within a request. */
export const getClientName = cache(async (_clientId: string) => {
  const result = await apiFetch<{ client: { name: string } }>("/api/v1/client");
  if (!result.ok) return "Lab";
  return result.data.client.name ?? "Lab";
});

export const getClientBrief = cache(async (_clientId: string) => {
  const result = await apiFetch<{ client: ClientBrief }>("/api/v1/client");
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data.client;
});
