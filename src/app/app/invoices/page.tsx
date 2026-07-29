import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Badge, Card, EmptyState, TextLink } from "@/components/ui";
import { ListSearch } from "@/components/list-search";
import { searchQuery } from "@/lib/search";
import { formatMoney } from "@/lib/billing";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  order: { patient: { name: string; phone: string | null } };
};

function matchesInvoiceQuery(inv: InvoiceRow, q: string) {
  const lower = q.toLowerCase();
  return (
    inv.invoiceNumber.toLowerCase().includes(lower) ||
    inv.order.patient.name.toLowerCase().includes(lower) ||
    (inv.order.patient.phone || "").includes(q)
  );
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireClientContext();
  const q = searchQuery((await searchParams).q);

  const result = await apiFetch<{ invoices: InvoiceRow[] }>("/api/v1/invoices");
  let invoices = result.ok ? result.data.invoices : [];
  if (result.ok && q) {
    invoices = invoices.filter((inv) => matchesInvoiceQuery(inv, q));
  }

  return (
    <>
      <Card title="Billing">
        {!result.ok ? (
          <EmptyState>Could not load invoices: {result.error}</EmptyState>
        ) : null}
        <ListSearch
          action="/app/invoices"
          q={q}
          placeholder="Search invoice number or patient"
        />
        {result.ok && invoices.length === 0 ? (
          <EmptyState>
            {q
              ? "No invoices match that search."
              : "No invoices yet. Record payment on an order, then generate an invoice."}
          </EmptyState>
        ) : null}
        {result.ok && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="lab-table">
              <caption className="sr-only">Invoice list</caption>
              <thead>
                <tr>
                  <th scope="col">Invoice</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-medium">{inv.invoiceNumber}</td>
                    <td>{inv.order.patient.name}</td>
                    <td>{formatMoney(inv.total)}</td>
                    <td>
                      <Badge tone={inv.status === "PAID" ? "green" : "amber"}>{inv.status}</Badge>
                    </td>
                    <td>
                      <TextLink href={`/app/invoices/${inv.id}`}>Open</TextLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </>
  );
}
