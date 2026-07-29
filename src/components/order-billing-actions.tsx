"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  createInvoiceAction,
  recordOrderPaymentAction,
  sendInvoiceAction,
} from "@/app/actions/client";
import { formatMoney } from "@/lib/billing";
import { useActionPending } from "@/components/action-pending";
import { DocumentPdfActions } from "@/components/document-pdf-actions";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
] as const;

type Channels = { email: boolean; sms: boolean; whatsapp: boolean };

export function OrderBillingActions({
  orderId,
  totalAmount,
  isPaid,
  paymentMethod,
  paidAt,
  invoice,
  patientEmail,
  patientPhone,
  channels,
}: {
  orderId: string;
  totalAmount: number;
  isPaid: boolean;
  paymentMethod: string | null;
  paidAt: string | null;
  invoice: { id: string; invoiceNumber: string } | null;
  patientEmail: string | null;
  patientPhone: string | null;
  channels: Channels;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { setPending: setGlobalPending } = useActionPending();
  const [modal, setModal] = useState<{
    invoiceId: string;
    invoiceNumber: string;
  } | null>(null);
  const [sendNote, setSendNote] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    setGlobalPending(pending);
  }, [pending, setGlobalPending]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (modal) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [modal]);

  function openInvoiceModal(invoiceId: string, invoiceNumber: string) {
    setSendNote(null);
    setError(null);
    setModal({ invoiceId, invoiceNumber });
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-emerald-800/12 bg-white/70 p-4 shadow-[var(--shadow)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-emerald-950">
            Bill total{" "}
            <span className="font-[family-name:var(--font-display)] text-lg tabular-nums">
              {formatMoney(totalAmount)}
            </span>
          </p>
          {isPaid ? (
            <p className="text-sm text-emerald-900/70">
              Paid
              {paymentMethod ? ` via ${paymentMethod}` : ""}
              {paidAt
                ? ` · ${new Date(paidAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}`
                : ""}
            </p>
          ) : (
            <p className="text-sm text-amber-800">Unpaid — record payment before generating an invoice.</p>
          )}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isPaid ? (
            <form
              className="flex flex-wrap items-center gap-2"
              action={(fd) => {
                setError(null);
                startTransition(async () => {
                  const result = await recordOrderPaymentAction(fd);
                  if (result && "error" in result && result.error) setError(result.error);
                });
              }}
            >
              <input type="hidden" name="orderId" value={orderId} />
              <label className="sr-only" htmlFor="paymentMethod">
                Payment method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                required
                defaultValue=""
                className="min-h-10 rounded-lg border border-emerald-800/20 bg-white px-3 text-sm text-emerald-950"
              >
                <option value="" disabled>
                  Paid via…
                </option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-10 items-center rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {pending ? "Saving…" : "Mark paid"}
              </button>
            </form>
          ) : null}

          {invoice ? (
            <button
              type="button"
              onClick={() => openInvoiceModal(invoice.id, invoice.invoiceNumber)}
              className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-teal-900 hover:bg-emerald-50"
            >
              Invoice {invoice.invoiceNumber}
            </button>
          ) : (
            <button
              type="button"
              disabled={!isPaid || pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await createInvoiceAction(orderId);
                  if ("error" in result) {
                    setError(result.error ?? "Could not create invoice.");
                    return;
                  }
                  openInvoiceModal(result.invoiceId, result.invoiceNumber);
                });
              }}
              className="inline-flex min-h-10 items-center rounded-lg bg-emerald-950 px-3 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Creating…" : "Generate invoice"}
            </button>
          )}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-[140] m-0 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-800/15 bg-white p-0 text-emerald-950 shadow-xl open:flex open:flex-col backdrop:bg-emerald-950/40"
        onClose={() => setModal(null)}
        aria-labelledby={titleId}
      >
        {modal ? (
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  Invoice {modal.invoiceNumber}
                </h2>
                <p className="mt-1 text-sm text-emerald-900/65">
                  Print or send this invoice. Messaging options depend on enabled features.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg px-2 py-1 text-sm text-emerald-900/70 hover:bg-emerald-50"
              >
                Close
              </button>
            </div>

            <div className="mb-4">
              <DocumentPdfActions
                kind="invoice"
                id={modal.invoiceId}
                defaultEmail={patientEmail ?? ""}
                enableEmail={channels.email}
              />
              <div className="mt-2">
                <Link
                  href={`/app/invoices/${modal.invoiceId}`}
                  className="text-sm font-medium text-emerald-800 underline decoration-emerald-800/30 underline-offset-2 hover:decoration-emerald-800"
                >
                  Open invoice page
                </Link>
              </div>
            </div>

            {(channels.email || channels.sms || channels.whatsapp) && (
              <div className="space-y-3 border-t border-emerald-800/10 pt-4">
                <p className="text-sm font-medium text-emerald-950">Send invoice</p>
                {sendNote ? <p className="text-sm text-teal-800">{sendNote}</p> : null}

                {channels.email ? (
                  <SendRow
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="patient@email.com"
                    defaultValue={patientEmail ?? ""}
                    invoiceId={modal.invoiceId}
                    pending={pending}
                    onResult={(msg) => setSendNote(msg)}
                    onError={(msg) => setSendNote(msg)}
                    startTransition={startTransition}
                  />
                ) : null}

                {channels.sms ? (
                  <SendRow
                    label="SMS"
                    name="sms"
                    type="tel"
                    placeholder="Phone number"
                    defaultValue={patientPhone ?? ""}
                    invoiceId={modal.invoiceId}
                    pending={pending}
                    onResult={(msg) => setSendNote(msg)}
                    onError={(msg) => setSendNote(msg)}
                    startTransition={startTransition}
                  />
                ) : null}

                {channels.whatsapp ? (
                  <SendRow
                    label="WhatsApp"
                    name="whatsapp"
                    type="tel"
                    placeholder="WhatsApp number"
                    defaultValue={patientPhone ?? ""}
                    invoiceId={modal.invoiceId}
                    pending={pending}
                    onResult={(msg) => setSendNote(msg)}
                    onError={(msg) => setSendNote(msg)}
                    startTransition={startTransition}
                    alsoOpenWa
                  />
                ) : null}
              </div>
            )}

            {!channels.email && !channels.sms && !channels.whatsapp ? (
              <p className="border-t border-emerald-800/10 pt-4 text-sm text-emerald-900/60">
                Email, SMS, and WhatsApp are not enabled. Ask Super Admin from Features.
              </p>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}

function SendRow({
  label,
  name,
  type,
  placeholder,
  defaultValue,
  invoiceId,
  pending,
  onResult,
  onError,
  startTransition,
  alsoOpenWa,
}: {
  label: string;
  name: "email" | "sms" | "whatsapp";
  type: string;
  placeholder: string;
  defaultValue: string;
  invoiceId: string;
  pending: boolean;
  onResult: (msg: string) => void;
  onError: (msg: string) => void;
  startTransition: (fn: () => void) => void;
  alsoOpenWa?: boolean;
}) {
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      action={(fd) => {
        startTransition(async () => {
          const result = await sendInvoiceAction(fd);
          if ("error" in result) {
            onError(result.error ?? "Could not send invoice.");
            return;
          }
          onResult(
            name === "email"
              ? "Email sent."
              : name === "sms"
                ? "SMS queued."
                : "WhatsApp ready.",
          );
          if (alsoOpenWa && result.whatsappUrl) {
            window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
          } else if (alsoOpenWa) {
            const dest = String(fd.get("destination") || "").replace(/\D/g, "");
            if (dest) {
              const text = encodeURIComponent(
                `Your invoice is ready. Please check with the lab for details.`,
              );
              window.open(`https://wa.me/${dest}?text=${text}`, "_blank", "noopener,noreferrer");
            }
          }
        });
      }}
    >
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="channel" value={name} />
      <label className="sr-only" htmlFor={`send-${name}`}>
        {label} destination
      </label>
      <input
        id={`send-${name}`}
        name="destination"
        type={type}
        required
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="min-h-10 min-w-0 flex-1 rounded-lg border border-emerald-800/20 bg-white px-3 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-emerald-50 px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-60"
      >
        Send {label}
      </button>
    </form>
  );
}
