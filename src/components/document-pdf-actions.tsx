"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useActionPending } from "@/components/action-pending";
import { sendInvoiceAction, sendReportPdfAction } from "@/app/actions/client";
import { useComponentLog } from "@/hooks/use-component-log";

type Kind = "invoice" | "report";
type ModalMode = "preview" | "email" | null;

export function DocumentPdfActions({
  kind,
  id,
  defaultEmail = "",
  className = "",
  enableEmail = false,
}: {
  /** invoice id, or order id for reports */
  kind: Kind;
  id: string;
  defaultEmail?: string;
  className?: string;
  /** Outbound SMTP is off by default — keep Print / Download only. */
  enableEmail?: boolean;
}) {
  useComponentLog("DocumentPdfActions");
  const [mode, setMode] = useState<ModalMode>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { setPending: setGlobalPending } = useActionPending();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const titleId = useId();

  const pdfHref =
    kind === "invoice" ? `/api/pdf/invoices/${id}` : `/api/pdf/reports/${id}`;
  const signedHref = `${pdfHref}/url`;
  const label = kind === "invoice" ? "Invoice" : "Report";

  useEffect(() => {
    return () => {
      if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  async function loadPreview() {
    setPreviewError(null);
    setPreviewLoading(true);
    setGlobalPending(true);
    try {
      // Prefer a short-lived R2 URL so the browser downloads from Cloudflare
      // instead of pumping the whole file through web → API → R2.
      const signedRes = await fetch(signedHref, { cache: "no-store" });
      if (signedRes.ok) {
        const data = (await signedRes.json()) as {
          url?: string | null;
          filename?: string;
        };
        if (data.url) {
          setPdfUrl((prev) => {
            if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
            return data.url!;
          });
          return;
        }
      }

      const res = await fetch(pdfHref, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Could not load PDF (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Could not load PDF.");
    } finally {
      setPreviewLoading(false);
      setGlobalPending(false);
    }
  }

  function openPreview() {
    setMode("preview");
    setMessage(null);
    setError(null);
    queueMicrotask(() => dialogRef.current?.showModal());
    void loadPreview();
  }

  function openEmail() {
    setMode("email");
    setMessage(null);
    setError(null);
    queueMicrotask(() => dialogRef.current?.showModal());
  }

  function closeModal() {
    setMode(null);
    dialogRef.current?.close();
    setPdfUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function printPreview() {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }

  function onEmailSubmit(formData: FormData) {
    const destination = String(formData.get("destination") || "").trim();
    setError(null);
    setMessage(null);
    setGlobalPending(true);
    startTransition(async () => {
      try {
        if (kind === "invoice") {
          const fd = new FormData();
          fd.set("invoiceId", id);
          fd.set("channel", "email");
          fd.set("destination", destination);
          const result = await sendInvoiceAction(fd);
          if ("error" in result) {
            setError(result.error ?? "Could not email PDF.");
            return;
          }
        } else {
          const fd = new FormData();
          fd.set("orderId", id);
          fd.set("destination", destination);
          const result = await sendReportPdfAction(fd);
          if ("error" in result) {
            setError(result.error ?? "Could not email PDF.");
            return;
          }
        }
        setMessage(`PDF emailed to ${destination}.`);
      } finally {
        setGlobalPending(false);
      }
    });
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={openPreview}
        className="inline-flex min-h-10 items-center rounded-lg bg-emerald-950 px-3 text-sm font-medium text-white hover:bg-emerald-900"
      >
        Print PDF
      </button>
      {enableEmail ? (
        <button
          type="button"
          onClick={openEmail}
          className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
        >
          Email PDF
        </button>
      ) : null}

      <dialog
        ref={dialogRef}
        className={[
          "fixed left-1/2 top-1/2 z-[140] m-0 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-800/15 bg-white p-0 text-emerald-950 shadow-xl open:flex open:flex-col backdrop:bg-emerald-950/40",
          mode === "preview"
            ? "h-[min(92vh,900px)] w-[min(100%-1.5rem,56rem)]"
            : "w-[min(100%-2rem,26rem)]",
        ].join(" ")}
        onClose={closeModal}
        aria-labelledby={titleId}
      >
        {mode === "preview" ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/10 px-4 py-3 sm:px-5">
              <div>
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  {label} PDF preview
                </h2>
                <p className="text-sm text-emerald-900/65">Review, then print from this window.</p>
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
                {pdfUrl ? (
                  <a
                    href={pdfUrl}
                    download={`${kind}.pdf`}
                    className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium hover:bg-emerald-50"
                  >
                    Download
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm text-emerald-900/70 hover:bg-emerald-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-emerald-50/40 p-3 sm:p-4">
              {previewLoading ? (
                <div className="flex h-full min-h-[50vh] items-center justify-center gap-3 text-sm text-emerald-900/70">
                  <span className="lab-spinner size-5" />
                  Loading PDF…
                </div>
              ) : previewError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800">
                  {previewError}
                </div>
              ) : pdfUrl ? (
                <iframe
                  ref={iframeRef}
                  title={`${label} PDF preview`}
                  src={pdfUrl}
                  className="h-full min-h-[50vh] w-full rounded-xl border border-emerald-800/15 bg-white"
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {mode === "email" ? (
          <form action={onEmailSubmit} className="p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  Email PDF
                </h2>
                <p className="mt-1 text-sm text-emerald-900/65">
                  Sends the PDF attachment with a LabSaaS email template.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-sm text-emerald-900/70 hover:bg-emerald-50"
              >
                Close
              </button>
            </div>

            <label htmlFor="pdf-email-to" className="mb-1.5 block text-sm font-medium">
              Recipient email
            </label>
            <input
              id="pdf-email-to"
              name="destination"
              type="email"
              required
              defaultValue={defaultEmail}
              placeholder="patient@email.com"
              className="mb-3 min-h-11 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
            />

            {error ? (
              <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send PDF"}
            </button>
          </form>
        ) : null}
      </dialog>
    </div>
  );
}
