import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Badge, Card, EmptyState, TextLink } from "@/components/ui";
import { ListSearch } from "@/components/list-search";
import { searchQuery } from "@/lib/search";
import { reportStatusLabel, reportStatusTone } from "@/lib/report-status";

type OrderListRow = {
  id: string;
  status: string;
  orderedAt: string;
  isPaid: boolean;
  patient: { id: string; name: string };
  report: { status: string } | null;
  items: {
    id: string;
    sampleKey: string;
    testTemplate: { code: string };
  }[];
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireClientContext();
  const q = searchQuery((await searchParams).q);

  const result = await apiFetch<{ orders: OrderListRow[] }>("/api/v1/orders", {
    searchParams: { q: q || undefined },
  });
  const orders = result.ok ? result.data.orders : [];

  return (
    <>
      <Card
        title="All orders"
        action={
          <Link
            href="/app/orders/new"
            className="inline-flex min-h-10 items-center rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            New order
          </Link>
        }
      >
        {!result.ok ? (
          <EmptyState>Could not load orders: {result.error}</EmptyState>
        ) : null}
        <ListSearch
          action="/app/orders"
          q={q}
          placeholder="Search patient, phone, test, or sample #"
        />
        {result.ok && orders.length === 0 ? (
          <EmptyState>
            {q
              ? "No orders match that search."
              : "No orders yet. Create one to register samples and billing."}
          </EmptyState>
        ) : null}
        {result.ok && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="lab-table">
              <caption className="sr-only">All lab orders</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Tests / sample keys</th>
                  <th scope="col">Status</th>
                  <th scope="col">Report</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="whitespace-nowrap text-sm text-slate-600">
                      {new Date(o.orderedAt).toLocaleString("en-IN")}
                    </td>
                    <td className="font-medium">
                      <TextLink href={`/app/patients/${o.patient.id}`}>{o.patient.name}</TextLink>
                    </td>
                    <td className="text-sm">
                      <ul className="space-y-1">
                        {o.items.slice(0, 3).map((i) => (
                          <li key={i.id}>
                            <span className="font-medium">{i.testTemplate.code}</span>
                            <span className="ml-2 font-mono text-xs text-emerald-800">
                              #{i.sampleKey}
                            </span>
                          </li>
                        ))}
                        {o.items.length > 3 ? (
                          <li className="text-xs text-slate-500">
                            … +{o.items.length - 3} more
                          </li>
                        ) : null}
                      </ul>
                    </td>
                    <td>
                      <Badge>{o.status.replaceAll("_", " ")}</Badge>
                    </td>
                    <td>
                      <Badge tone={reportStatusTone(o.report?.status ?? "QUEUED")}>
                        {reportStatusLabel(o.report?.status ?? "QUEUED")}
                      </Badge>
                    </td>
                    <td>
                      <TextLink href={`/app/orders/${o.id}`}>Open</TextLink>
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
