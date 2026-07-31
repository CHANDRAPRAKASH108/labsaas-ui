"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { sendInvoiceAction } from "@/app/actions/client";
import { formatMoney } from "@/lib/billing";
import { useActionPending } from "@/components/action-pending";

type Channels = { email: boolean; sms: boolean; whatsapp: boolean };

export type CounterReceipt = {
  orderId: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  total: number;
  paid: boolean;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
};

/** Pop-up invoice after charge — preview/print + share, without leaving the counter. */
export function CounterInvoiceModal({
  receipt,
  channels,
  open,
  onClose,
  onNextPatient,
}: {
  receipt: CounterReceipt;
  channels: Channels;
  open: boolean;
  onClose: () => void;
  onNextPatient: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const titleId = useId();
  const { setPending: setGlobalPending } = useActionPending();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [sendNote, setSendNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const invoiceId = receipt.invoiceId;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
      setSendNote(null);
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !invoiceId) return;
    let cancelled = false;
    async function load() {
      setPreviewError(null);
      setPreviewLoading(true);
      setGlobalPending(true);
      try {
        // Always use a same-origin blob so Print works (R2 signed URLs are cross-origin).
        const res = await fetch(`/api/pdf/invoices/${invoiceId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Could not load PDF (${res.status})`);
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPdfUrl((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        if (!cancelled) {
          setPreviewError(err instanceof Error ? err.message : "Could not load PDF.");
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
          setGlobalPending(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, invoiceId, setGlobalPending]);

  useEffect(() => {
    return () => {
      if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  function printPreview() {
    const frame = iframeRef.current;
    try {
      if (pdfUrl?.startsWith("blob:") && frame?.contentWindow) {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        return;
      }
    } catch {
      // fall through
    }
    window.open(`/api/pdf/invoices/${invoiceId}`, "_blank", "noopener,noreferrer");
  }

  function handleClose() {
    dialogRef.current?.close();
    onClose();
  }

  if (!invoiceId) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-[140] m-0 h-[min(94vh,920px)] w-[min(100%-1rem,56rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-emerald-800/15 bg-white p-0 text-emerald-950 shadow-xl open:flex backdrop:bg-emerald-950/45"
      onClose={() => onClose()}
      aria-labelledby={titleId}
    >
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-emerald-800/10 px-4 py-3 sm:px-5">
        <div>
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            Invoice {receipt.invoiceNumber}
          </h2>
          <p className="text-sm text-emerald-900/65">
            {receipt.patientName} · Paid {formatMoney(receipt.total)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={printPreview}
            disabled={!pdfUrl || previewLoading}
            className="inline-flex min-h-10 items-center rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Print
          </button>
          <a
            href={`/api/pdf/invoices/${invoiceId}`}
            download={`${receipt.invoiceNumber || "invoice"}.pdf`}
            className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
          >
            Download
          </a>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm text-emerald-900/70 hover:bg-emerald-50"
          >
            Close
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_minmax(240px,280px)]">
        <div className="min-h-0 border-b border-emerald-800/10 bg-emerald-950/5 lg:border-b-0 lg:border-r">
          {previewLoading ? (
            <p className="p-6 text-sm text-emerald-900/60">Loading invoice…</p>
          ) : previewError ? (
            <p className="p-6 text-sm text-rose-700">{previewError}</p>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              title={`Invoice ${receipt.invoiceNumber}`}
              src={pdfUrl}
              className="h-full min-h-[50vh] w-full lg:min-h-0"
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          <p className="text-sm font-medium text-emerald-950">Send invoice</p>
          {sendNote ? <p className="text-sm text-teal-800">{sendNote}</p> : null}

          {channels.email ? (
            <ShareRow
              label="Email"
              channel="email"
              type="email"
              placeholder="patient@email.com"
              defaultValue={receipt.patientEmail ?? ""}
              invoiceId={invoiceId}
              pending={pending}
              startTransition={startTransition}
              onResult={setSendNote}
            />
          ) : null}
          {channels.sms ? (
            <ShareRow
              label="SMS"
              channel="sms"
              type="tel"
              placeholder="Phone number"
              defaultValue={receipt.patientPhone ?? ""}
              invoiceId={invoiceId}
              pending={pending}
              startTransition={startTransition}
              onResult={setSendNote}
            />
          ) : null}
          {channels.whatsapp ? (
            <ShareRow
              label="WhatsApp"
              channel="whatsapp"
              type="tel"
              placeholder="WhatsApp number"
              defaultValue={receipt.patientPhone ?? ""}
              invoiceId={invoiceId}
              pending={pending}
              startTransition={startTransition}
              onResult={setSendNote}
              alsoOpenWa
            />
          ) : null}

          {!channels.email && !channels.sms && !channels.whatsapp ? (
            <p className="text-sm text-emerald-900/60">
              Messaging is off. Print or download the invoice, or enable channels under Features.
            </p>
          ) : null}

          <div className="mt-auto space-y-2 border-t border-emerald-800/10 pt-3">
            <button
              type="button"
              onClick={() => {
                dialogRef.current?.close();
                onNextPatient();
              }}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-teal-800 px-4 text-base font-semibold text-white hover:bg-teal-700"
            >
              New patient
            </button>
            <p className="text-center text-xs text-emerald-900/50">
              Sample barcodes will attach here later.
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function ShareRow({
  label,
  channel,
  type,
  placeholder,
  defaultValue,
  invoiceId,
  pending,
  startTransition,
  onResult,
  alsoOpenWa,
}: {
  label: string;
  channel: "email" | "sms" | "whatsapp";
  type: string;
  placeholder: string;
  defaultValue: string;
  invoiceId: string;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onResult: (msg: string) => void;
  alsoOpenWa?: boolean;
}) {
  return (
    <form
      className="space-y-1.5"
      action={(fd) => {
        startTransition(async () => {
          const result = await sendInvoiceAction(fd);
          if ("error" in result) {
            onResult(result.error ?? "Could not send.");
            return;
          }
          onResult(
            channel === "email"
              ? "Email sent."
              : channel === "sms"
                ? "SMS queued."
                : "WhatsApp ready.",
          );
          if (alsoOpenWa && result.whatsappUrl) {
            window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
          } else if (alsoOpenWa) {
            const dest = String(fd.get("destination") || "").replace(/\D/g, "");
            if (dest) {
              const text = encodeURIComponent(
                "Your lab invoice is ready. Please check with the lab for details.",
              );
              window.open(`https://wa.me/${dest}?text=${text}`, "_blank", "noopener,noreferrer");
            }
          }
        });
      }}
    >
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="channel" value={channel} />
      <label className="block text-xs font-medium text-emerald-900/70" htmlFor={`inv-send-${channel}`}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={`inv-send-${channel}`}
          name="destination"
          type={type}
          required
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-emerald-800/20 bg-emerald-50 px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </form>
  );
}
