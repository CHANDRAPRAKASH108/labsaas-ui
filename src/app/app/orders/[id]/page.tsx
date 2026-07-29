import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getClientBrief } from "@/lib/client-data";
import { requireClientContext } from "@/lib/session";
import { Badge, EmptyState } from "@/components/ui";
import { OrderDetailEditor } from "@/components/order-detail-editor";
import { OrderBillingActions } from "@/components/order-billing-actions";
import { DocumentPdfActions } from "@/components/document-pdf-actions";
import { getActiveFeatureChannels } from "@/lib/features";
import { reportStatusLabel, reportStatusTone } from "@/lib/report-status";

type TestOption = { id: string; name: string; code: string; price: number };

type OrderDetail = {
  id: string;
  status: string;
  notes: string | null;
  isPaid: boolean;
  paymentMethod: string | null;
  paidAt: string | null;
  patient: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    email: string | null;
  };
  invoice: { id: string; invoiceNumber: string } | null;
  report: { id: string; status: string } | null;
  items: {
    id: string;
    price: number;
    sampleKey: string;
    testTemplate: { id: string; name: string; code: string };
  }[];
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clientId } = await requireClientContext();
  const { id } = await params;

  const [orderResult, testsResult, client] = await Promise.all([
    apiFetch<{ order: OrderDetail }>(`/api/v1/orders/${id}`),
    apiFetch<{ tests: TestOption[] }>("/api/v1/tests", { searchParams: { active: "true" } }),
    getClientBrief(clientId),
  ]);

  if (!orderResult.ok) {
    if (orderResult.status === 404) notFound();
    return <EmptyState>Could not load order: {orderResult.error}</EmptyState>;
  }

  const order = orderResult.data.order;
  if (!order.report) notFound();

  const availableTests = testsResult.ok
    ? testsResult.data.tests.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        price: t.price,
      }))
    : [];

  const reportDone = order.report.status === "COMPLETED";
  const channels = getActiveFeatureChannels(client);
  const totalAmount = order.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <Badge>{order.status.replaceAll("_", " ")}</Badge>
        <Badge tone={reportStatusTone(order.report.status)}>
          Report {reportStatusLabel(order.report.status)}
        </Badge>
        {order.isPaid ? <Badge tone="green">Paid</Badge> : <Badge tone="amber">Unpaid</Badge>}
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Link
            href={`/app/reports/${order.id}`}
            className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
          >
            {order.report.status === "QUEUED"
              ? "Open in Reports"
              : order.report.status === "COMPLETED"
                ? "View report"
                : "Continue report"}
          </Link>
          {reportDone ? (
            <DocumentPdfActions
              kind="report"
              id={order.id}
              defaultEmail={order.patient.email || ""}
              enableEmail={channels.email}
            />
          ) : null}
        </div>
      </div>

      <OrderBillingActions
        orderId={order.id}
        totalAmount={totalAmount}
        isPaid={order.isPaid}
        paymentMethod={order.paymentMethod}
        paidAt={order.paidAt}
        invoice={
          order.invoice
            ? { id: order.invoice.id, invoiceNumber: order.invoice.invoiceNumber }
            : null
        }
        patientEmail={order.patient.email}
        patientPhone={order.patient.phone}
        channels={channels}
      />

      <OrderDetailEditor
        orderId={order.id}
        patient={{
          id: order.patient.id,
          name: order.patient.name,
          phone: order.patient.phone,
          address: order.patient.address,
        }}
        status={order.status}
        notes={order.notes}
        items={order.items.map((item) => ({
          id: item.id,
          price: item.price,
          sampleKey: item.sampleKey,
          testTemplate: {
            id: item.testTemplate.id,
            name: item.testTemplate.name,
            code: item.testTemplate.code,
          },
        }))}
        availableTests={availableTests}
        locked={reportDone || order.isPaid}
      />
    </>
  );
}
