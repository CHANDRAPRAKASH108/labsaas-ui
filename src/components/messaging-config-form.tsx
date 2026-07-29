"use client";

import { useState, useTransition } from "react";
import {
  updateClientMessagingConfigAction,
  updateMessagingConfigAction,
} from "@/app/actions/super";
import { Field, PrimaryButton } from "@/components/ui";

export type MessagingConfig = {
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassSet: boolean;
  smtpFrom: string;
  whatsappEnabled: boolean;
  whatsappMode: string;
  whatsappDefaultCountryCode: string;
  whatsappApiProvider: string;
  whatsappApiTokenSet: boolean;
  whatsappPhoneNumberId: string;
  whatsappApiBaseUrl: string;
  emailConfigured: boolean;
  whatsappConfigured: boolean;
};

type Props = {
  config: MessagingConfig;
  /** When set, saves to this lab's messaging config. Otherwise platform support SMTP. */
  clientId?: string;
  variant?: "client" | "platform";
};

export function MessagingConfigForm({
  config,
  clientId,
  variant = clientId ? "client" : "platform",
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(config.whatsappMode || "CLICK_TO_CHAT");
  const isClient = variant === "client";

  return (
    <form
      className="space-y-8"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = isClient
            ? await updateClientMessagingConfigAction(formData)
            : await updateMessagingConfigAction(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
          }
        });
      }}
    >
      {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}

      <section className="space-y-3 rounded-xl border border-emerald-800/12 bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-emerald-950">Email (SMTP)</h3>
            <p className="text-xs text-emerald-900/60">
              {isClient
                ? "Used for this lab’s invoice/report PDF email when Email is enabled above."
                : "Used for LabSaaS support / feature-request mail only."}
              {config.emailConfigured ? " Status: ready." : " Status: incomplete."}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="emailEnabled"
              defaultChecked={config.emailEnabled}
              className="size-4 rounded border-emerald-800/30"
            />
            Enable email
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="SMTP host"
            name="smtpHost"
            defaultValue={config.smtpHost}
            placeholder="smtp.gmail.com"
          />
          <Field
            label="SMTP port"
            name="smtpPort"
            type="number"
            defaultValue={config.smtpPort}
          />
          <Field
            label="SMTP user"
            name="smtpUser"
            defaultValue={config.smtpUser}
            placeholder={isClient ? "reports@yourlab.com" : "support@labsaas.store"}
          />
          <Field
            label={config.smtpPassSet ? "SMTP password (leave blank to keep)" : "SMTP password"}
            name="smtpPass"
            type="password"
            autoComplete="new-password"
            placeholder={config.smtpPassSet ? "••••••••" : ""}
          />
          <div className="sm:col-span-2">
            <Field
              label="From"
              name="smtpFrom"
              defaultValue={config.smtpFrom}
              placeholder={
                isClient
                  ? "Sunrise Lab <reports@yourlab.com>"
                  : "Labsaas Support <support@labsaas.store>"
              }
            />
          </div>
        </div>
      </section>

      {isClient ? (
        <section className="space-y-3 rounded-xl border border-emerald-800/12 bg-white/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-emerald-950">WhatsApp</h3>
              <p className="text-xs text-emerald-900/60">
                Used when WhatsApp is enabled for this lab.
                {config.whatsappConfigured ? " Status: ready." : " Status: incomplete."}
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="whatsappEnabled"
                defaultChecked={config.whatsappEnabled}
                className="size-4 rounded border-emerald-800/30"
              />
              Enable WhatsApp
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="text-sm">
              <label
                htmlFor="whatsappMode"
                className="mb-1.5 block font-medium text-emerald-950/80"
              >
                Mode
              </label>
              <select
                id="whatsappMode"
                name="whatsappMode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="min-h-10 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
              >
                <option value="CLICK_TO_CHAT">Click-to-chat (wa.me)</option>
                <option value="API">Business API / BSP (coming soon)</option>
              </select>
            </div>
            <Field
              label="Default country code"
              name="whatsappDefaultCountryCode"
              defaultValue={config.whatsappDefaultCountryCode || "91"}
              placeholder="91"
            />
          </div>

          {mode === "API" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Provider"
                name="whatsappApiProvider"
                defaultValue={config.whatsappApiProvider}
                placeholder="meta / gupshup / interakt"
              />
              <Field
                label="Phone number ID"
                name="whatsappPhoneNumberId"
                defaultValue={config.whatsappPhoneNumberId}
              />
              <Field
                label={
                  config.whatsappApiTokenSet
                    ? "API token (leave blank to keep)"
                    : "API token"
                }
                name="whatsappApiToken"
                type="password"
                autoComplete="new-password"
                placeholder={config.whatsappApiTokenSet ? "••••••••" : ""}
              />
              <Field
                label="API base URL (optional)"
                name="whatsappApiBaseUrl"
                defaultValue={config.whatsappApiBaseUrl}
                placeholder="https://graph.facebook.com/v19.0"
              />
              <p className="sm:col-span-2 text-xs text-amber-800">
                API credentials can be saved now. Live BSP sending will be wired later;
                Click-to-chat works today when WhatsApp is enabled.
              </p>
            </div>
          ) : (
            <p className="text-xs text-emerald-900/60">
              Click-to-chat opens WhatsApp with a prefilled message. Staff confirms Send in
              WhatsApp. No PDF attachment via this mode.
            </p>
          )}
        </section>
      ) : (
        <>
          <input type="hidden" name="whatsappEnabled" value="" />
          <input type="hidden" name="whatsappMode" value="CLICK_TO_CHAT" />
          <input type="hidden" name="whatsappDefaultCountryCode" value="91" />
        </>
      )}

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <PrimaryButton disabled={pending}>
        {pending ? "Saving…" : "Save messaging settings"}
      </PrimaryButton>
    </form>
  );
}
