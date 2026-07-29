import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Badge, Card, EmptyState, Field, PrimaryButton, TextLink } from "@/components/ui";
import { updatePatientAction } from "@/app/actions/client";
import { reportStatusLabel, reportStatusTone } from "@/lib/report-status";
import { formatMoney } from "@/lib/billing";

type PatientOrder = {
  id: string;
  status: string;
  orderedAt: string;
  isPaid: boolean;
  report: { id: string; status: string } | null;
  invoice: { id: string; invoiceNumber: string; total: number; status: string } | null;
  items: {
    id: string;
    sampleKey: string;
    price: number;
    testTemplate: { id: string; name: string; code: string };
  }[];
};

type PatientDetail = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  orders: PatientOrder[];
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireClientContext();
  const { id } = await params;

  const result = await apiFetch<{ patient: PatientDetail }>(`/api/v1/patients/${id}`);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return <EmptyState>Could not load patient: {result.error}</EmptyState>;
  }

  const patient = result.data.patient;
  const orders = patient.orders;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <TextLink href="/app/patients">Patients</TextLink>
        <span className="text-emerald-900/40" aria-hidden="true">
          /
        </span>
        <span className="font-medium text-emerald-950">{patient.name}</span>
        <div className="ml-auto">
          <Link
            href={`/app/orders/new?patientId=${patient.id}`}
            className="inline-flex min-h-10 items-center rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            New order
          </Link>
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card title="Patient details">
          <form
            key={patient.updatedAt}
            action={updatePatientAction}
            className="space-y-3"
          >
            <input type="hidden" name="patientId" value={patient.id} />
            <Field label="Name" name="name" required defaultValue={patient.name} autoComplete="name" />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              required
              defaultValue={patient.phone}
              autoComplete="tel"
            />
            <Field
              label="Address"
              name="address"
              required
              defaultValue={patient.address}
              autoComplete="street-address"
            />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={patient.email}
              autoComplete="email"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Age"
                name="age"
                type="number"
                defaultValue={patient.age}
              />
              <div className="text-sm">
                <label htmlFor="gender" className="mb-1.5 block font-medium text-emerald-950/80">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  defaultValue={patient.gender ?? ""}
                  className="min-h-10 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
                >
                  <option value="">—</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <PrimaryButton>Save details</PrimaryButton>
          </form>
          <p className="mt-3 text-xs text-emerald-900/55">
            Registered {new Date(patient.createdAt).toLocaleDateString("en-IN")}
          </p>
        </Card>

        <Card title={`History (${orders.length})`}>
          {orders.length === 0 ? (
            <EmptyState>
              No orders yet for this patient.{" "}
              <TextLink href={`/app/orders/new?patientId=${patient.id}`}>Create an order</TextLink>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="lab-table">
                <caption className="sr-only">Order and report history</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Tests</th>
                    <th scope="col">Order</th>
                    <th scope="col">Report</th>
                    <th scope="col">Invoice</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap text-sm text-emerald-900/65">
                        {new Date(order.orderedAt).toLocaleString("en-IN")}
                      </td>
                      <td className="text-sm">
                        <ul className="space-y-1">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              <span className="font-medium">{item.testTemplate.name}</span>
                              <span className="ml-1 text-xs text-emerald-900/55">
                                ({item.testTemplate.code})
                              </span>
                              <span className="ml-2 font-mono text-xs text-emerald-800">
                                #{item.sampleKey}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <Badge>{order.status.replaceAll("_", " ")}</Badge>
                          {order.isPaid ? (
                            <Badge tone="green">Paid</Badge>
                          ) : (
                            <Badge tone="amber">Unpaid</Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        {order.report ? (
                          <Badge tone={reportStatusTone(order.report.status)}>
                            {reportStatusLabel(order.report.status)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-emerald-900/45">—</span>
                        )}
                      </td>
                      <td className="text-sm">
                        {order.invoice ? (
                          <div>
                            <TextLink href={`/app/invoices/${order.invoice.id}`}>
                              {order.invoice.invoiceNumber}
                            </TextLink>
                            <p className="text-xs text-emerald-900/55">
                              {formatMoney(order.invoice.total)} · {order.invoice.status}
                            </p>
                          </div>
                        ) : (
                          <span className="text-emerald-900/45">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <TextLink href={`/app/orders/${order.id}`}>Order</TextLink>
                          {order.report ? (
                            <TextLink href={`/app/reports/${order.id}`}>Report</TextLink>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
