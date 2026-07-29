import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { getClientBrief } from "@/lib/client-data";
import { getActiveFeatureChannels } from "@/lib/features";
import { Badge, EmptyState, PrimaryButton, TextLink } from "@/components/ui";
import { markInvoicePaidAction } from "@/app/actions/client";
import { formatMoney } from "@/lib/billing";
import { DocumentPdfActions } from "@/components/document-pdf-actions";

type InvoiceDetail = {
  id: string;
  orderId: string;
  invoiceNumber: string;
  status: string;
  paymentMethod: string | null;
  paidAt: string | null;
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
    patient: { name: string; phone: string | null; email?: string | null; address: string | null };
    items: {
      id: string;
      price: number;
      sampleKey: string;
      testTemplate: { name: string; code: string };
    }[];
  };
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clientId } = await requireClientContext();
  const { id } = await params;

  const [result, client] = await Promise.all([
    apiFetch<{ invoice: InvoiceDetail }>(`/api/v1/invoices/${id}`),
    getClientBrief(clientId),
  ]);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return <EmptyState>Could not load invoice: {result.error}</EmptyState>;
  }
  const invoice = result.data.invoice;
  const channels = getActiveFeatureChannels(client);

  async function markPaid() {
    "use server";
    await markInvoicePaidAction(id);
  }

  const paid = invoice.status === "PAID";

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={paid ? "green" : "amber"}>{invoice.status}</Badge>
          {invoice.paymentMethod ? (
            <span className="text-sm text-emerald-900/60">via {invoice.paymentMethod}</span>
          ) : null}
          {invoice.paidAt ? (
            <span className="text-sm text-emerald-900/60">
              Paid on {new Date(invoice.paidAt).toLocaleDateString("en-IN")}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TextLink href={`/app/orders/${invoice.orderId}`}>View order</TextLink>
          <DocumentPdfActions
            kind="invoice"
            id={invoice.id}
            defaultEmail={invoice.order.patient.email || invoice.client.email || ""}
            enableEmail={channels.email}
          />
          {!paid ? (
            <form action={markPaid}>
              <PrimaryButton>Mark paid</PrimaryButton>
            </form>
          ) : null}
        </div>
      </div>

      <article className="print-document overflow-hidden rounded-2xl border border-emerald-800/15 bg-white shadow-[var(--shadow)] print:border-0 print:shadow-none">
        <div className="border-b border-emerald-800/10 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              {invoice.client.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={invoice.client.logoUrl}
                  alt=""
                  className="mb-3 max-h-14 max-w-[160px] object-contain"
                />
              ) : (
                <p className="mb-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-emerald-950">
                  {invoice.client.name}
                </p>
              )}
              {invoice.client.logoUrl ? (
                <h2 className="text-lg font-semibold text-emerald-950">{invoice.client.name}</h2>
              ) : null}
              <p className="mt-1 max-w-md text-sm text-emerald-900/70">
                {[invoice.client.address, invoice.client.phone, invoice.client.email]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {invoice.client.gstin ? (
                <p className="mt-1 text-xs font-medium text-emerald-900/55">
                  GSTIN {invoice.client.gstin}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-emerald-800/10 bg-white/80 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/50">
                Invoice
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-emerald-950">
                {invoice.invoiceNumber}
              </p>
              <dl className="mt-3 space-y-1 text-emerald-900/75">
                <div className="flex justify-between gap-6">
                  <dt>Date</dt>
                  <dd className="font-medium text-emerald-950">
                    {new Date(invoice.createdAt).toLocaleDateString("en-IN")}
                  </dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt>Status</dt>
                  <dd className="font-medium text-emerald-950">{invoice.status}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-emerald-800/10 bg-[#f7fcf9] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-900/50">
                From
              </h3>
              <p className="mt-2 font-semibold text-emerald-950">{invoice.client.name}</p>
              <p className="mt-1 text-sm text-emerald-900/70">{invoice.client.address || "—"}</p>
              <p className="text-sm text-emerald-900/70">{invoice.client.phone || "—"}</p>
            </section>
            <section className="rounded-xl border border-emerald-800/10 bg-[#f7fcf9] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-900/50">
                Bill to
              </h3>
              <p className="mt-2 font-semibold text-emerald-950">{invoice.order.patient.name}</p>
              <p className="mt-1 text-sm text-emerald-900/70">
                {invoice.order.patient.phone || "—"}
              </p>
              <p className="text-sm text-emerald-900/70">
                {invoice.order.patient.address || "—"}
              </p>
            </section>
          </div>

          <div className="overflow-x-auto rounded-xl border border-emerald-800/12">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <caption className="sr-only">Invoice line items</caption>
              <thead>
                <tr className="bg-emerald-800 text-left text-white">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Test
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Sample
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.order.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-emerald-50/50"}
                  >
                    <td className="px-4 py-3 font-medium text-emerald-950">
                      {item.testTemplate.name}
                    </td>
                    <td className="px-4 py-3 text-emerald-900/75">{item.testTemplate.code}</td>
                    <td className="px-4 py-3 font-mono text-emerald-900/80">#{item.sampleKey}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-950">
                      {formatMoney(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs rounded-xl border border-emerald-800/12 bg-[#f7fcf9] p-4 text-sm">
              <div className="flex items-center justify-between gap-6 text-emerald-900/75">
                <span>Subtotal</span>
                <span className="font-medium text-emerald-950">{formatMoney(invoice.subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-6 text-emerald-900/75">
                <span>Tax</span>
                <span className="font-medium text-emerald-950">{formatMoney(invoice.taxAmount)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-6 border-t border-emerald-800/15 pt-3">
                <span className="font-semibold text-emerald-950">Total</span>
                <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-emerald-950">
                  {formatMoney(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {invoice.notes || invoice.client.invoiceMessage ? (
            <footer className="mt-8 border-t border-emerald-800/10 pt-4 text-sm text-emerald-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/45">
                Notes
              </p>
              <p className="mt-2">{invoice.notes || invoice.client.invoiceMessage}</p>
            </footer>
          ) : null}
        </div>
      </article>
    </>
  );
}
