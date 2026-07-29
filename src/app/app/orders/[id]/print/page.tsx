import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getClientBrief } from "@/lib/client-data";
import { requireClientContext } from "@/lib/session";
import { EmptyState } from "@/components/ui";
import { DocumentPdfActions } from "@/components/document-pdf-actions";
import { reportStatusLabel } from "@/lib/report-status";

type ReportValue = {
  id: string;
  orderItemId: string;
  value: string | null;
  testField: {
    label: string;
    unit: string | null;
    sortOrder: number;
    referenceText: string | null;
    referenceMin: number | null;
    referenceMax: number | null;
  };
  orderItem: {
    sampleKey: string;
    testTemplate: { name: string; code: string; defaultReportComment: string | null };
  };
};

type PrintOrder = {
  id: string;
  orderedAt: string;
  patient: {
    name: string;
    age: number | null;
    gender: string | null;
    phone: string | null;
    address: string | null;
  };
  report: {
    status: string;
    signedBy: string | null;
    values: ReportValue[];
  };
};

export default async function PrintReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clientId } = await requireClientContext();
  const { id } = await params;

  const [orderResult, client] = await Promise.all([
    apiFetch<{ order: PrintOrder }>(`/api/v1/orders/${id}`),
    getClientBrief(clientId),
  ]);

  if (!orderResult.ok) {
    if (orderResult.status === 404) notFound();
    return <EmptyState>Could not load report: {orderResult.error}</EmptyState>;
  }

  const order = orderResult.data.order;
  if (!order.report) notFound();

  const grouped = new Map<
    string,
    {
      name: string;
      code: string;
      sampleKey: string;
      comment: string | null;
      rows: ReportValue[];
    }
  >();
  for (const value of order.report.values) {
    const key = value.orderItemId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        name: value.orderItem.testTemplate.name,
        code: value.orderItem.testTemplate.code,
        sampleKey: value.orderItem.sampleKey,
        comment: value.orderItem.testTemplate.defaultReportComment,
        rows: [],
      });
    }
    grouped.get(key)!.rows.push(value);
  }
  for (const g of grouped.values()) {
    g.rows.sort((a, b) => a.testField.sortOrder - b.testField.sortOrder);
  }

  return (
    <div className="bg-white text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 p-4">
        <Link
          href={`/app/reports/${order.id}`}
          className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800/20 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
        >
          Back to report
        </Link>
        <DocumentPdfActions kind="report" id={order.id} />
      </div>
      <article className="mx-auto max-w-3xl bg-white p-8">
        <header className="flex items-center gap-4 border-b-2 border-teal-900 pb-3">
          {client.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={client.logoUrl} alt="" className="max-h-16 max-w-[120px] object-contain" />
          ) : null}
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl">{client.name}</h1>
            <p className="text-sm text-slate-600">
              {[client.address, client.phone, client.email, client.gstin ? `GSTIN ${client.gstin}` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </header>

        <h2 className="my-5 text-center text-sm font-semibold tracking-[0.2em] text-teal-900">
          LABORATORY REPORT
        </h2>

        <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p>
              <strong>Patient:</strong> {order.patient.name}
            </p>
            <p>
              <strong>Age / Sex:</strong> {order.patient.age ?? "—"} / {order.patient.gender ?? "—"}
            </p>
            <p>
              <strong>Phone:</strong> {order.patient.phone ?? "—"}
            </p>
            <p>
              <strong>Address:</strong> {order.patient.address ?? "—"}
            </p>
          </div>
          <div>
            <p>
              <strong>Ordered:</strong> {new Date(order.orderedAt).toLocaleString("en-IN")}
            </p>
            <p>
              <strong>Status:</strong> {reportStatusLabel(order.report.status)}
            </p>
            <p>
              <strong>Signed by:</strong> {order.report.signedBy ?? "—"}
            </p>
          </div>
        </div>

        {[...grouped.values()].map((g) => (
          <section key={g.sampleKey} className="mb-6">
            <h3 className="mb-2 text-base font-semibold text-teal-900">
              {g.name} ({g.code}) · Sample #{g.sampleKey}
            </h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-teal-50">
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Parameter</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Result</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Unit</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Reference</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="border border-slate-300 px-2 py-1.5">{r.testField.label}</td>
                    <td className="border border-slate-300 px-2 py-1.5 font-medium">
                      {r.value ?? "—"}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5">
                      {r.testField.unit ?? "—"}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-600">
                      {r.testField.referenceText ||
                        (r.testField.referenceMin != null || r.testField.referenceMax != null
                          ? `${r.testField.referenceMin ?? "…"} – ${r.testField.referenceMax ?? "…"}`
                          : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {g.comment ? (
              <p className="mt-2 text-sm text-slate-700">
                <strong>Comment:</strong> {g.comment}
              </p>
            ) : null}
          </section>
        ))}

        <footer className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-600">
          {client.reportFooter ||
            "This report is computer generated. Please consult your physician."}
        </footer>
      </article>
    </div>
  );
}
