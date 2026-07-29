import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Badge, Card, EmptyState, StatCard, TextLink } from "@/components/ui";
import { formatMoney } from "@/lib/billing";
import { reportStatusLabel, reportStatusTone } from "@/lib/report-status";

type DashboardData = {
  showIncome: boolean;
  stats: {
    patients: number;
    orders: number;
    unpaidInvoices: number;
    queuedReports: number;
    todayIncome: number;
  };
  recentOrders: {
    id: string;
    status: string;
    patient: { id: string; name: string };
    report: { status: string } | null;
    invoice: { invoiceNumber: string; total: number } | null;
  }[];
};

export default async function AppDashboardPage() {
  await requireClientContext();

  const result = await apiFetch<DashboardData>("/api/v1/dashboard");
  if (!result.ok) {
    return (
      <EmptyState>Could not load dashboard: {result.error}</EmptyState>
    );
  }

  const { showIncome, stats, recentOrders } = result.data;

  return (
    <>
      <div
        className={[
          "mb-6 grid gap-4 sm:grid-cols-2",
          showIncome ? "lg:grid-cols-5" : "lg:grid-cols-4",
        ].join(" ")}
      >
        {showIncome ? (
          <StatCard
            label="Today's total income"
            value={formatMoney(stats.todayIncome)}
            hint={
              <>
                Paid collections today ·{" "}
                <TextLink href="/app/income">Analytics</TextLink>
              </>
            }
          />
        ) : null}
        <StatCard label="Patients" value={stats.patients} />
        <StatCard label="Orders" value={stats.orders} />
        <StatCard
          label="Reports in queue"
          value={stats.queuedReports}
          hint="Technician workbench"
        />
        <StatCard label="Unpaid invoices" value={stats.unpaidInvoices} />
      </div>

      <p className="mb-4 text-sm text-emerald-900/70">
        Messaging channel details are on the{" "}
        <TextLink href="/app/features">Features</TextLink> page. Lab reporting is under{" "}
        <TextLink href="/app/reports">Reports</TextLink>.
      </p>

      <Card
        title="Recent orders"
        action={<TextLink href="/app/orders/new">New order</TextLink>}
      >
        {recentOrders.length === 0 ? (
          <EmptyState>
            No orders yet. Add a patient, configure tests, then create an order.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="lab-table">
              <caption className="sr-only">Recent lab orders</caption>
              <thead>
                <tr>
                  <th scope="col">Patient</th>
                  <th scope="col">Status</th>
                  <th scope="col">Report</th>
                  <th scope="col">Invoice</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-medium">
                      <TextLink href={`/app/patients/${o.patient.id}`}>{o.patient.name}</TextLink>
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
                      {o.invoice
                        ? `${o.invoice.invoiceNumber} (${formatMoney(o.invoice.total)})`
                        : "—"}
                    </td>
                    <td>
                      <TextLink href={`/app/orders/${o.id}`}>Open</TextLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
