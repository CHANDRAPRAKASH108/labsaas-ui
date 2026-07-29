import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Badge, Card, EmptyState, StatCard, TextLink } from "@/components/ui";
import { formatMoney } from "@/lib/billing";
import { IncomeDateFilter } from "@/components/income-date-filter";

type IncomeReport = {
  dateFrom: string;
  dateTo: string;
  maxMonths: number;
  summary: {
    totalIncome: number;
    paidOrderCount: number;
    byPaymentMethod: Record<string, number>;
  };
  daily: { date: string; income: number; orderCount: number }[];
  orders: {
    id: string;
    paidAt: string | null;
    paymentMethod: string | null;
    total: number;
    itemCount: number;
    patient: { id: string; name: string };
    invoice: { id: string; invoiceNumber: string } | null;
  }[];
  topTests: {
    rank: number;
    testTemplateId: string;
    code: string;
    name: string;
    category: string | null;
    orderCount: number;
    lineCount: number;
    revenue: number;
  }[];
};

function canViewIncome(session: { role: string; impersonatingClientId?: string | null }) {
  if (session.role === "CLIENT_ADMIN") return true;
  if (session.role === "SUPER_ADMIN" && session.impersonatingClientId) return true;
  return false;
}

function formatDayIST(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addCalendarMonths(day: string, months: number) {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function addDays(day: string, days: number) {
  const date = new Date(`${day}T12:00:00+05:30`);
  date.setDate(date.getDate() + days);
  return formatDayIST(date);
}

function isValidDay(value?: string | null) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function presetHref(from: string, to: string) {
  const sp = new URLSearchParams({ dateFrom: from, dateTo: to });
  return `/app/income?${sp.toString()}`;
}

export default async function IncomeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  const { session } = await requireClientContext();
  if (!canViewIncome(session)) redirect("/app");

  const params = await searchParams;
  const today = formatDayIST();
  const dateTo = isValidDay(params.dateTo) ? params.dateTo! : today;
  const dateFrom = isValidDay(params.dateFrom)
    ? params.dateFrom!
    : addCalendarMonths(dateTo, -1);

  const result = await apiFetch<IncomeReport>("/api/v1/income-report", {
    searchParams: { dateFrom, dateTo },
  });

  const presets = [
    { label: "Today", href: presetHref(today, today) },
    { label: "7 days", href: presetHref(addDays(today, -6), today) },
    { label: "30 days", href: presetHref(addDays(today, -29), today) },
    { label: "3 months", href: presetHref(addCalendarMonths(today, -3), today) },
    { label: "15 months", href: presetHref(addCalendarMonths(today, -15), today) },
  ];

  if (!result.ok) {
    return (
      <>
        <IncomeDateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          presets={presets}
          maxMonths={15}
        />
        <EmptyState>Could not load income report: {result.error}</EmptyState>
      </>
    );
  }

  const data = result.data;
  const activeDays = data.daily.filter((d) => d.orderCount > 0);
  const methodEntries = Object.entries(data.summary.byPaymentMethod).filter(
    ([, amount]) => amount > 0,
  );

  return (
    <>
      <IncomeDateFilter
        dateFrom={data.dateFrom}
        dateTo={data.dateTo}
        presets={presets}
        maxMonths={data.maxMonths}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total income"
          value={formatMoney(data.summary.totalIncome)}
          hint={`${data.dateFrom} → ${data.dateTo}`}
        />
        <StatCard
          label="Paid orders"
          value={data.summary.paidOrderCount}
          hint="Collections in range"
        />
        <StatCard
          label="Active days"
          value={activeDays.length}
          hint="Days with at least one paid order"
        />
        <StatCard
          label="Top test"
          value={data.topTests[0]?.code || "—"}
          hint={data.topTests[0] ? data.topTests[0].name : "No paid tests yet"}
        />
      </div>

      {methodEntries.length > 0 ? (
        <div className="mb-5">
          <Card title="By payment method">
            <div className="flex flex-wrap gap-3">
              {methodEntries.map(([method, amount]) => (
                <div
                  key={method}
                  className="rounded-lg border border-emerald-800/15 bg-[#f7fcf9] px-3 py-2 text-sm"
                >
                  <p className="font-medium text-emerald-950">{method}</p>
                  <p className="text-emerald-900/70">{formatMoney(amount)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card title="Daily income">
          {activeDays.length === 0 ? (
            <EmptyState>No paid collections in this date range.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="lab-table">
                <caption className="sr-only">Daily income breakdown</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Orders</th>
                    <th scope="col">Income</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDays.map((day) => (
                    <tr key={day.date}>
                      <td className="whitespace-nowrap font-medium">
                        {new Date(`${day.date}T12:00:00+05:30`).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>{day.orderCount}</td>
                      <td className="font-medium">{formatMoney(day.income)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Most requested tests">
          <p className="mb-3 text-sm text-emerald-900/65">
            Ranked by how many paid orders included each test in this range.
          </p>
          {data.topTests.length === 0 ? (
            <EmptyState>No test demand data yet.</EmptyState>
          ) : (
            <ol className="space-y-2">
              {data.topTests.slice(0, 15).map((test) => (
                <li
                  key={test.testTemplateId}
                  className="flex items-start gap-3 rounded-lg border border-emerald-800/10 bg-[#f7fcf9] px-3 py-2.5"
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-white">
                    {test.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-emerald-950">
                      {test.name}
                      <span className="ml-1 text-xs font-normal text-emerald-900/55">
                        ({test.code})
                      </span>
                    </p>
                    <p className="text-xs text-emerald-900/60">
                      {test.orderCount} order{test.orderCount === 1 ? "" : "s"} ·{" "}
                      {test.lineCount} sample{test.lineCount === 1 ? "" : "s"} ·{" "}
                      {formatMoney(test.revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card title={`Paid order history (${data.orders.length})`}>
        {data.orders.length === 0 ? (
          <EmptyState>No paid orders in this range.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="lab-table">
              <caption className="sr-only">Paid orders in selected range</caption>
              <thead>
                <tr>
                  <th scope="col">Paid at</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Tests</th>
                  <th scope="col">Method</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Invoice</th>
                  <th scope="col">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap text-sm text-emerald-900/65">
                      {order.paidAt
                        ? new Date(order.paidAt).toLocaleString("en-IN")
                        : "—"}
                    </td>
                    <td className="font-medium">
                      <TextLink href={`/app/patients/${order.patient.id}`}>
                        {order.patient.name}
                      </TextLink>
                    </td>
                    <td>{order.itemCount}</td>
                    <td>
                      {order.paymentMethod ? (
                        <Badge>{order.paymentMethod}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="font-medium">{formatMoney(order.total)}</td>
                    <td className="text-sm">
                      {order.invoice ? (
                        <TextLink href={`/app/invoices/${order.invoice.id}`}>
                          {order.invoice.invoiceNumber}
                        </TextLink>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <TextLink href={`/app/orders/${order.id}`}>Open</TextLink>
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
