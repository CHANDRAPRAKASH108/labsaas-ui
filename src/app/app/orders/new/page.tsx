import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { getClientBrief } from "@/lib/client-data";
import { getActiveFeatureChannels } from "@/lib/features";
import { EmptyState } from "@/components/ui";
import { NewOrderForm } from "@/components/new-order-form";
import { CounterWorkspace } from "@/components/counter-workspace";

type PatientOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  age: number | null;
  gender: string | null;
};
type TestOption = { id: string; name: string; code: string; price: number };

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; focus?: string; returnTo?: string }>;
}) {
  const { clientId } = await requireClientContext();
  const { patientId, focus, returnTo } = await searchParams;
  const autoFocus = focus === "1" || focus === "true";
  const safeReturnTo =
    returnTo && returnTo.startsWith("/app") && !returnTo.startsWith("//")
      ? returnTo
      : autoFocus
        ? "/app"
        : undefined;

  const [patientsResult, testsResult, client] = await Promise.all([
    apiFetch<{ patients: PatientOption[] }>("/api/v1/patients"),
    apiFetch<{ tests: TestOption[] }>("/api/v1/tests", { searchParams: { active: "true" } }),
    getClientBrief(clientId),
  ]);

  if (!patientsResult.ok || !testsResult.ok) {
    const err = !patientsResult.ok
      ? patientsResult.error
      : !testsResult.ok
        ? testsResult.error
        : "Request failed";
    return (
      <div className="rounded-[var(--radius)] border border-emerald-800/12 bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
        <EmptyState>{err}</EmptyState>
      </div>
    );
  }

  const channels = getActiveFeatureChannels(client);
  const patients = patientsResult.data.patients.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email ?? null,
    age: p.age ?? null,
    gender: p.gender ?? null,
  }));
  const tests = testsResult.data.tests.map((t) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    price: t.price,
  }));

  return (
    <CounterWorkspace autoFocus={autoFocus} returnTo={safeReturnTo}>
      <NewOrderForm
        patients={patients}
        tests={tests}
        initialPatientId={patientId}
        channels={channels}
      />
    </CounterWorkspace>
  );
}
