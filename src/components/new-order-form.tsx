"use client";

import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/app/actions/client";
import { Field, PrimaryButton } from "@/components/ui";
import { formatMoney } from "@/lib/billing";
import { useActionPending } from "@/components/action-pending";

type PatientOption = { id: string; name: string; phone: string | null };
type TestOption = { id: string; name: string; code: string; price: number };

export function NewOrderForm({
  patients,
  tests,
  initialPatientId,
}: {
  patients: PatientOption[];
  tests: TestOption[];
  initialPatientId?: string;
}) {
  const router = useRouter();
  const { pending, setPending } = useActionPending();
  const hasInitialPatient =
    Boolean(initialPatientId) && patients.some((p) => p.id === initialPatientId);
  const [mode, setMode] = useState<"existing" | "new">(
    hasInitialPatient || patients.length ? "existing" : "new",
  );
  const [error, setError] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [testQuery, setTestQuery] = useState("");

  const filteredPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q)),
    );
  }, [patients, patientQuery]);

  const filteredTests = useMemo(() => {
    const q = testQuery.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q),
    );
  }, [tests, testQuery]);

  async function onSubmit(formData: FormData) {
    flushSync(() => {
      setPending(true);
      setError(null);
    });
    formData.set("patientMode", mode);
    try {
      const result = await createOrderAction(formData);
      if (result?.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      if (result?.orderId) {
        // Keep overlay until navigation completes.
        router.push("/app/orders");
        return;
      }
      setPending(false);
    } catch (error) {
      setPending(false);
      throw error;
    }
  }

  if (tests.length === 0) {
    return (
      <p className="text-sm text-amber-900">
        Add at least one active test in the Tests catalog before creating an order.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-emerald-950">Patient</legend>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("new")}
            className={[
              "inline-flex min-h-10 items-center rounded-lg border px-3 py-2 text-sm font-medium",
              mode === "new"
                ? "border-emerald-700 bg-emerald-100 text-emerald-950"
                : "border-emerald-800/20 bg-[#f7fcf9] text-emerald-900/80",
            ].join(" ")}
          >
            Create new patient
          </button>
          <button
            type="button"
            onClick={() => setMode("existing")}
            disabled={patients.length === 0}
            className={[
              "inline-flex min-h-10 items-center rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50",
              mode === "existing"
                ? "border-emerald-700 bg-emerald-100 text-emerald-950"
                : "border-emerald-800/20 bg-[#f7fcf9] text-emerald-900/80",
            ].join(" ")}
          >
            Select existing
          </button>
        </div>

        {mode === "new" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Patient name" name="patientName" required autoComplete="name" />
            <Field label="Phone" name="patientPhone" type="tel" required autoComplete="tel" />
            <div className="sm:col-span-2">
              <Field
                label="Address"
                name="patientAddress"
                required
                autoComplete="street-address"
              />
            </div>
            <Field label="Age" name="patientAge" type="number" required />
            <div className="text-sm">
              <label htmlFor="patientGender" className="mb-1.5 block font-medium text-emerald-950/80">
                Sex <span className="text-rose-700" aria-hidden="true">*</span>
              </label>
              <select
                id="patientGender"
                name="patientGender"
                required
                defaultValue=""
                className="min-h-11 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <label htmlFor="patientSearch" className="mb-1.5 block font-medium text-emerald-950/80">
              Find patient
            </label>
            <input
              id="patientSearch"
              type="search"
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
              placeholder="Search name or phone"
              className="mb-2 min-h-10 w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
            />
            <label htmlFor="patientId" className="mb-1.5 block font-medium text-emerald-950/80">
              Patient <span className="text-rose-700" aria-hidden="true">*</span>
            </label>
            <select
              id="patientId"
              name="patientId"
              required={mode === "existing"}
              className="min-h-11 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
              defaultValue={hasInitialPatient ? initialPatientId : ""}
            >
              <option value="" disabled>
                {filteredPatients.length ? "Select patient" : "No patients match"}
              </option>
              {filteredPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.phone ? ` · ${p.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-emerald-950">
          Tests <span className="text-rose-700" aria-hidden="true">*</span>
        </legend>
        <p className="mb-2 text-xs text-emerald-900/60">
          Each selected test gets its own unique 7-digit sample key for specimen tracking.
        </p>
        <label htmlFor="testSearch" className="sr-only">
          Search tests
        </label>
        <input
          id="testSearch"
          type="search"
          value={testQuery}
          onChange={(e) => setTestQuery(e.target.value)}
          placeholder="Search tests by name or code"
          className="mb-3 min-h-10 w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25 sm:max-w-md"
        />
        <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
          {filteredTests.length === 0 ? (
            <p className="text-sm text-emerald-900/60 sm:col-span-2">No tests match that search.</p>
          ) : (
            filteredTests.map((t) => (
              <label
                key={t.id}
                className="flex min-h-11 items-start gap-2 rounded-lg border border-emerald-800/15 bg-[#f7fcf9] px-3 py-2.5 text-sm hover:bg-emerald-50"
              >
                <input type="checkbox" name="testIds" value={t.id} className="mt-1 size-4" />
                <span>
                  <span className="font-medium text-emerald-950">{t.name}</span>
                  <span className="block text-xs text-emerald-900/55">
                    {t.code} · {formatMoney(t.price)}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
      </fieldset>

      <div className="text-sm">
        <label htmlFor="notes" className="mb-1.5 block font-medium text-emerald-950/80">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <PrimaryButton disabled={pending}>
        {pending ? "Creating…" : "Create order"}
      </PrimaryButton>
    </form>
  );
}
