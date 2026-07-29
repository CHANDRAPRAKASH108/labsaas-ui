import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Badge, Card, EmptyState, PrimaryButton, TextLink } from "@/components/ui";
import { startReportAction, saveResultsAction } from "@/app/actions/client";
import { DocumentPdfActions } from "@/components/document-pdf-actions";
import { reportStatusLabel, reportStatusTone } from "@/lib/report-status";
import { getClientBrief } from "@/lib/client-data";
import { getActiveFeatureChannels } from "@/lib/features";

type ReportValue = {
  id: string;
  orderItemId: string;
  value: string | null;
  testField: {
    label: string;
    unit: string | null;
    fieldType: string;
    sortOrder: number;
    referenceText: string | null;
    referenceMin: number | null;
    referenceMax: number | null;
  };
  orderItem: {
    sampleKey: string;
    testTemplate: { name: string; defaultReportComment: string | null };
  };
};

type ReportDetailPayload = {
  order: {
    id: string;
    patient: {
      id: string;
      name: string;
      phone: string | null;
      email?: string | null;
      address: string | null;
    };
    items: {
      id: string;
      sampleKey: string;
      testTemplate: { name: string; code: string };
    }[];
  };
  report: {
    id: string;
    status: string;
    signedBy: string | null;
    values: ReportValue[];
  };
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { session, clientId } = await requireClientContext();
  const { orderId } = await params;

  const [result, client] = await Promise.all([
    apiFetch<ReportDetailPayload>(`/api/v1/reports/by-order/${orderId}`),
    getClientBrief(clientId),
  ]);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return <EmptyState>Could not load report: {result.error}</EmptyState>;
  }

  const { order, report } = result.data;
  const completed = report.status === "COMPLETED";
  const queued = report.status === "QUEUED";
  const channels = getActiveFeatureChannels(client);

  const grouped = new Map<
    string,
    {
      testName: string;
      sampleKey: string;
      comment: string | null;
      values: ReportValue[];
    }
  >();

  for (const value of report.values) {
    const key = value.orderItemId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        testName: value.orderItem.testTemplate.name,
        sampleKey: value.orderItem.sampleKey,
        comment: value.orderItem.testTemplate.defaultReportComment,
        values: [],
      });
    }
    grouped.get(key)!.values.push(value);
  }

  for (const g of grouped.values()) {
    g.values.sort((a, b) => a.testField.sortOrder - b.testField.sortOrder);
  }

  async function startWork() {
    "use server";
    await startReportAction(report.id);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <Badge tone={reportStatusTone(report.status)}>{reportStatusLabel(report.status)}</Badge>
        <span className="text-sm text-emerald-900/70">
          <TextLink href={`/app/patients/${order.patient.id}`}>{order.patient.name}</TextLink>
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Link
            href={`/app/orders/${order.id}`}
            className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
          >
            View order
          </Link>
          {completed ? (
            <DocumentPdfActions
              kind="report"
              id={order.id}
              defaultEmail={order.patient.email || ""}
              enableEmail={channels.email}
            />
          ) : null}
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card title="Patient">
          <p className="font-medium text-emerald-950">
            <TextLink href={`/app/patients/${order.patient.id}`}>{order.patient.name}</TextLink>
          </p>
          <p className="text-sm text-emerald-900/70">{order.patient.phone || "—"}</p>
          <p className="text-sm text-emerald-900/70">{order.patient.address || "—"}</p>
        </Card>
        <Card title="Ordered tests & sample keys">
          <ul className="space-y-2 text-sm">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-800/10 bg-emerald-50/40 px-3 py-2"
              >
                <span>
                  {item.testTemplate.name}{" "}
                  <span className="text-emerald-900/55">({item.testTemplate.code})</span>
                </span>
                <span className="font-mono text-sm font-semibold tracking-wider text-emerald-950">
                  Sample #{item.sampleKey}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {queued ? (
        <Card title="Ready to start">
          <p className="mb-4 text-sm text-emerald-900/70">
            This report is in the queue. Start it when you begin laboratory work — status will move to
            in progress.
          </p>
          <form action={startWork}>
            <PrimaryButton>Start report</PrimaryButton>
          </form>
        </Card>
      ) : (
        <Card title={completed ? "Results" : "Enter results"}>
          <form action={saveResultsAction} className="space-y-6">
            <input type="hidden" name="reportId" value={report.id} />
            {[...grouped.entries()].map(([itemId, group]) => (
              <div key={itemId}>
                <h3 className="mb-3 font-semibold text-emerald-950">
                  {group.testName}{" "}
                  <span className="font-mono text-sm font-medium text-emerald-800">
                    · Sample #{group.sampleKey}
                  </span>
                </h3>
                <div className="space-y-3">
                  {group.values.map((v) => (
                    <div
                      key={v.id}
                      className="grid items-center gap-2 text-sm sm:grid-cols-[minmax(140px,220px)_minmax(0,1fr)_minmax(100px,140px)] sm:gap-3"
                    >
                      <label htmlFor={`value_${v.id}`} className="font-medium text-emerald-950/80">
                        {v.testField.label}
                        {v.testField.unit ? (
                          <span className="font-normal text-emerald-900/50"> ({v.testField.unit})</span>
                        ) : null}
                      </label>
                      {v.testField.fieldType === "LONG_TEXT" ? (
                        <textarea
                          id={`value_${v.id}`}
                          name={`value_${v.id}`}
                          rows={2}
                          defaultValue={v.value ?? ""}
                          disabled={completed}
                          className="w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2 disabled:bg-emerald-50/50"
                        />
                      ) : (
                        <input
                          id={`value_${v.id}`}
                          name={`value_${v.id}`}
                          type={v.testField.fieldType === "NUMBER" ? "number" : "text"}
                          step="any"
                          defaultValue={v.value ?? ""}
                          disabled={completed}
                          className="w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2 disabled:bg-emerald-50/50"
                        />
                      )}
                      <p className="text-xs leading-snug text-emerald-900/55 sm:text-right">
                        Ref:{" "}
                        {v.testField.referenceText ||
                          (v.testField.referenceMin != null || v.testField.referenceMax != null
                            ? `${v.testField.referenceMin ?? "…"}–${v.testField.referenceMax ?? "…"}`
                            : "—")}
                      </p>
                    </div>
                  ))}
                  {group.comment ? (
                    <p className="rounded-lg border border-emerald-800/10 bg-emerald-50/50 px-3 py-2 text-sm text-emerald-900/75">
                      <span className="font-medium text-emerald-950">Report comment: </span>
                      {group.comment}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {!completed ? (
              <div className="flex flex-wrap items-end gap-3 border-t border-emerald-800/10 pt-4">
                <label className="text-sm">
                  <span className="mb-1.5 block font-medium text-emerald-950/80">Signed by</span>
                  <input
                    name="signedBy"
                    defaultValue={report.signedBy || session.name}
                    className="min-h-10 rounded-lg border border-emerald-800/20 bg-white px-3 py-2"
                  />
                </label>
                <label className="flex min-h-10 items-center gap-2 text-sm text-emerald-950">
                  <input type="checkbox" name="complete" className="rounded border-emerald-800/30" />
                  Mark report completed
                </label>
                <PrimaryButton>Save results</PrimaryButton>
              </div>
            ) : (
              <p className="border-t border-emerald-800/10 pt-4 text-sm text-emerald-900/70">
                Report completed
                {report.signedBy ? ` · signed by ${report.signedBy}` : ""}.
              </p>
            )}
          </form>
        </Card>
      )}
    </>
  );
}
