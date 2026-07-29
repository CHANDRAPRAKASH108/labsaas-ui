import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/billing";
import { SetDocumentTitle } from "@/components/set-document-title";
import { DocumentPdfActions } from "@/components/document-pdf-actions";

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  client: {
    name: string;
    logoUrl: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    invoiceMessage: string | null;
  };
  order: {
    patient: { name: string; phone: string | null; address: string | null };
    items: {
      id: string;
      price: number;
      sampleKey: string;
      testTemplate: { name: string; code: string };
    }[];
  };
};

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireClientContext();
  const { id } = await params;

  const result = await apiFetch<{ invoice: InvoiceDetail }>(`/api/v1/invoices/${id}`);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return <EmptyState>Could not load invoice: {result.error}</EmptyState>;
  }
  const invoice = result.data.invoice;

  const notes = invoice.notes || invoice.client.invoiceMessage || "";

  return (
    <>
      <SetDocumentTitle title={invoice.invoiceNumber} />

      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 p-4">
        <Link
          href={`/app/invoices/${invoice.id}`}
          className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800/20 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
        >
          Back to invoice
        </Link>
        <DocumentPdfActions kind="invoice" id={invoice.id} />
      </div>

      <article className="print-document mx-auto max-w-3xl bg-white p-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-4">
          <div className="min-w-0">
            {invoice.client.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invoice.client.logoUrl}
                alt={`${invoice.client.name} logo`}
                className="mb-3 block h-16 w-auto max-w-[180px] object-contain"
              />
            ) : null}
            <h1 className="text-xl font-semibold">{invoice.client.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {[invoice.client.address, invoice.client.phone, invoice.client.email]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {invoice.client.gstin ? (
              <p className="text-xs text-slate-500">GSTIN {invoice.client.gstin}</p>
            ) : null}
          </div>
          <div className="text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</p>
            <p className="mt-1 text-lg font-semibold">{invoice.invoiceNumber}</p>
            <p className="text-slate-600">{new Date(invoice.createdAt).toLocaleDateString("en-IN")}</p>
            <p className="text-slate-600">{invoice.status}</p>
          </div>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</p>
            <p className="mt-1 font-medium">{invoice.client.name}</p>
            <p className="text-slate-600">{invoice.client.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill to</p>
            <p className="mt-1 font-medium">{invoice.order.patient.name}</p>
            <p className="text-slate-600">{invoice.order.patient.phone || "—"}</p>
            <p className="text-slate-600">{invoice.order.patient.address || "—"}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-teal-800 text-left text-white">
              <th className="px-3 py-2">Test</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Sample</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.order.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-200">
                <td className="px-3 py-2">{item.testTemplate.name}</td>
                <td className="px-3 py-2">{item.testTemplate.code}</td>
                <td className="px-3 py-2 font-mono">#{item.sampleKey}</td>
                <td className="px-3 py-2 text-right">{formatMoney(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end text-sm">
          <div className="w-56 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatMoney(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(invoice.total)}</span>
            </div>
          </div>
        </div>

        {notes ? (
          <footer className="mt-8 border-t border-slate-200 pt-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
            <p className="mt-1">{notes}</p>
          </footer>
        ) : null}
      </article>
    </>
  );
}
