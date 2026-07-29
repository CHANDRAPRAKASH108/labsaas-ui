import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Card, EmptyState } from "@/components/ui";
import { NewOrderForm } from "@/components/new-order-form";

type PatientOption = { id: string; name: string; phone: string | null };
type TestOption = { id: string; name: string; code: string; price: number };

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  await requireClientContext();
  const { patientId } = await searchParams;

  const [patientsResult, testsResult] = await Promise.all([
    apiFetch<{ patients: PatientOption[] }>("/api/v1/patients"),
    apiFetch<{ tests: TestOption[] }>("/api/v1/tests", { searchParams: { active: "true" } }),
  ]);

  if (!patientsResult.ok || !testsResult.ok) {
    const err = !patientsResult.ok
      ? patientsResult.error
      : !testsResult.ok
        ? testsResult.error
        : "Request failed";
    return (
      <Card title="Create test order">
        <EmptyState>Could not load form data: {err}</EmptyState>
      </Card>
    );
  }

  const patients = patientsResult.data.patients.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
  }));
  const tests = testsResult.data.tests.map((t) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    price: t.price,
  }));

  return (
    <>
      <Card title="Create test order">
        <NewOrderForm
          patients={patients}
          tests={tests}
          initialPatientId={patientId}
        />
      </Card>
    </>
  );
}
