import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Badge, Card, EmptyState, TextLink } from "@/components/ui";
import { ListSearch } from "@/components/list-search";
import { searchQuery } from "@/lib/search";
import { reportStatusLabel, reportStatusTone } from "@/lib/report-status";

type ReportListRow = {
  id: string;
  status: string;
  createdAt: string;
  signedBy: string | null;
  order: {
    id: string;
    orderedAt: string;
    patient: { id: string; name: string };
    items: {
      id: string;
      sampleKey: string;
      testTemplate: { code: string; name: string };
    }[];
  };
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireClientContext();
  const params = await searchParams;
  const q = searchQuery(params.q);
  const allowed = ["QUEUED", "IN_PROGRESS", "COMPLETED"] as const;
  const filter =
    params.status && (allowed as readonly string[]).includes(params.status)
      ? (params.status as (typeof allowed)[number])
      : undefined;

  const result = await apiFetch<{ reports: ReportListRow[] }>("/api/v1/reports", {
    searchParams: { q: q || undefined, status: filter },
  });
  const reports = result.ok ? result.data.reports : [];

  function filterHref(status?: string) {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return qs ? `/app/reports?${qs}` : "/app/reports";
  }

  const filters = [
    { href: filterHref(), label: "All", active: !filter },
    { href: filterHref("QUEUED"), label: "In queue", active: filter === "QUEUED" },
    { href: filterHref("IN_PROGRESS"), label: "In progress", active: filter === "IN_PROGRESS" },
    { href: filterHref("COMPLETED"), label: "Completed", active: filter === "COMPLETED" },
  ];

  return (
    <>
      <Card title="Lab reports">
        <p className="mb-4 text-sm text-emerald-900/70">
          New orders land in the queue. Technicians pick them up, enter results, then mark completed.
        </p>

        {!result.ok ? (
          <EmptyState>Could not load reports: {result.error}</EmptyState>
        ) : null}

        <ListSearch
          action="/app/reports"
          q={q}
          placeholder="Search patient, phone, test, or sample #"
          hiddenFields={filter ? { status: filter } : undefined}
        />

        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={[
                "inline-flex min-h-9 items-center rounded-lg border px-3 text-sm font-medium",
                f.active
                  ? "border-emerald-700 bg-emerald-100 text-emerald-950"
                  : "border-emerald-800/20 bg-white text-emerald-900/80 hover:bg-emerald-50",
              ].join(" ")}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {result.ok && reports.length === 0 ? (
          <EmptyState>
            {q ? "No reports match that search." : "No reports in this view yet."}
          </EmptyState>
        ) : null}
        {result.ok && reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="lab-table">
              <caption className="sr-only">Lab reports queue</caption>
              <thead>
                <tr>
                  <th scope="col">Ordered</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Tests / samples</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="whitespace-nowrap text-sm text-emerald-900/65">
                      {new Date(report.order.orderedAt).toLocaleString("en-IN")}
                    </td>
                    <td className="font-medium">
                      <TextLink href={`/app/patients/${report.order.patient.id}`}>
                        {report.order.patient.name}
                      </TextLink>
                    </td>
                    <td className="text-sm">
                      <ul className="space-y-1">
                        {report.order.items.slice(0, 3).map((item) => (
                          <li key={item.id}>
                            <span className="font-medium">{item.testTemplate.code}</span>
                            <span className="ml-2 font-mono text-xs text-emerald-800">
                              #{item.sampleKey}
                            </span>
                          </li>
                        ))}
                        {report.order.items.length > 3 ? (
                          <li className="text-xs text-slate-500">
                            … +{report.order.items.length - 3} more
                          </li>
                        ) : null}
                      </ul>
                    </td>
                    <td>
                      <Badge tone={reportStatusTone(report.status)}>
                        {reportStatusLabel(report.status)}
                      </Badge>
                    </td>
                    <td>
                      <TextLink href={`/app/reports/${report.order.id}`}>
                        {report.status === "QUEUED"
                          ? "Open"
                          : report.status === "COMPLETED"
                            ? "View"
                            : "Continue"}
                      </TextLink>
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
