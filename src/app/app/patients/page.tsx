import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Card, EmptyState, Field, PrimaryButton, TextLink } from "@/components/ui";
import { ListSearch } from "@/components/list-search";
import { searchQuery } from "@/lib/search";
import { createPatientAction } from "@/app/actions/client";

type PatientRow = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  email: string | null;
  age: number | null;
  gender: string | null;
  _count?: { orders: number };
};

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireClientContext();
  const q = searchQuery((await searchParams).q);

  const result = await apiFetch<{ patients: PatientRow[] }>("/api/v1/patients", {
    searchParams: { q: q || undefined },
  });
  const patients = result.ok ? result.data.patients : [];

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card title="Add patient">
          <p className="mb-3 text-sm text-emerald-900/70">
            Only name, phone, and address are required. Open a patient to edit more details and
            view order history.
          </p>
          <form action={createPatientAction} className="space-y-3">
            <Field label="Name" name="name" required autoComplete="name" />
            <Field label="Phone" name="phone" type="tel" required autoComplete="tel" />
            <Field label="Address" name="address" required autoComplete="street-address" />
            <PrimaryButton>Save patient</PrimaryButton>
          </form>
        </Card>
        <Card title={`Directory (${patients.length})`}>
          {!result.ok ? (
            <EmptyState>Could not load patients: {result.error}</EmptyState>
          ) : null}
          <ListSearch
            action="/app/patients"
            q={q}
            placeholder="Search name, phone, or email"
          />
          {result.ok && patients.length === 0 ? (
            <EmptyState>
              {q
                ? "No patients match that search."
                : "No patients yet. Use the form to register the first one."}
            </EmptyState>
          ) : null}
          {result.ok && patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="lab-table">
                <caption className="sr-only">Patient directory</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Address</th>
                    <th scope="col">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">
                        <TextLink href={`/app/patients/${p.id}`}>{p.name}</TextLink>
                      </td>
                      <td>{p.phone || "—"}</td>
                      <td>{p.address || "—"}</td>
                      <td>
                        <TextLink href={`/app/patients/${p.id}`}>Open</TextLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
