"use client";

import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { createOrderAction } from "@/app/actions/client";
import { formatMoney } from "@/lib/billing";
import { useActionPending } from "@/components/action-pending";
import {
  useBillingSessionOptional,
  type BillingSessionStatus,
} from "@/components/billing-session-context";
import {
  CounterInvoiceModal,
  type CounterReceipt,
} from "@/components/counter-receipt-panel";

type PatientOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  age: number | null;
  gender: string | null;
};
type TestOption = { id: string; name: string; code: string; price: number };
type Channels = { email: boolean; sms: boolean; whatsapp: boolean };

type NewPatientDraft = {
  name: string;
  phone: string;
  address: string;
  age: string;
  gender: string;
  email: string;
};

const EMPTY_PATIENT: NewPatientDraft = {
  name: "",
  phone: "",
  address: "",
  age: "",
  gender: "",
  email: "",
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
] as const;

const inputClass =
  "min-h-9 w-full rounded-md border border-emerald-800/20 bg-[#f7fcf9] px-2.5 py-1.5 text-sm text-emerald-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25";

const chipClass = (active: boolean, tone: "emerald" | "amber" = "emerald") =>
  [
    "inline-flex min-h-8 items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition sm:text-sm",
    active
      ? tone === "amber"
        ? "border-amber-600 bg-amber-50 text-amber-950"
        : "border-emerald-700 bg-emerald-100 text-emerald-950"
      : "border-emerald-800/20 bg-[#f7fcf9] text-emerald-900/80 hover:bg-emerald-50",
  ].join(" ");

const panelClass =
  "flex min-h-0 flex-col overflow-hidden rounded-xl border border-emerald-800/12 bg-[var(--surface)]";

export function NewOrderForm({
  patients,
  tests,
  initialPatientId,
  channels,
}: {
  patients: PatientOption[];
  tests: TestOption[];
  initialPatientId?: string;
  channels: Channels;
}) {
  const { pending, setPending } = useActionPending();
  const billingSession = useBillingSessionOptional();
  const hasInitialPatient =
    Boolean(initialPatientId) && patients.some((p) => p.id === initialPatientId);
  const defaultMode: "existing" | "new" =
    hasInitialPatient || patients.length ? "existing" : "new";

  const [mode, setMode] = useState<"existing" | "new">(defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [patientId, setPatientId] = useState(hasInitialPatient ? initialPatientId! : "");
  const [baselinePatientId, setBaselinePatientId] = useState(
    hasInitialPatient ? initialPatientId! : "",
  );
  const [newPatient, setNewPatient] = useState<NewPatientDraft>(EMPTY_PATIENT);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [collectPayment, setCollectPayment] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentCollected, setPaymentCollected] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [receipt, setReceipt] = useState<CounterReceipt | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

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

  const selectedTests = useMemo(
    () =>
      selectedTestIds
        .map((id) => tests.find((t) => t.id === id))
        .filter((t): t is TestOption => Boolean(t)),
    [tests, selectedTestIds],
  );

  const selectedTotal = useMemo(
    () => selectedTests.reduce((sum, t) => sum + t.price, 0),
    [selectedTests],
  );

  const selectedPatient = patients.find((p) => p.id === patientId) ?? null;
  const orderLocked = Boolean(receipt);

  const billingStatus = useMemo((): BillingSessionStatus => {
    if (receipt) return "completed";

    const newPatientDirty =
      mode === "new" &&
      Object.values(newPatient).some((v) => v.trim().length > 0);
    const existingPatientDirty =
      mode === "existing" && patientId !== baselinePatientId;
    const modeDirty = mode !== defaultMode;
    const testsDirty = selectedTestIds.length > 0;
    const notesDirty = notes.trim().length > 0;
    const paymentDirty =
      !collectPayment ||
      paymentMethod !== "CASH" ||
      paymentCollected;

    if (
      newPatientDirty ||
      existingPatientDirty ||
      modeDirty ||
      testsDirty ||
      notesDirty ||
      paymentDirty
    ) {
      return "drafting";
    }
    return "idle";
  }, [
    receipt,
    mode,
    newPatient,
    patientId,
    baselinePatientId,
    defaultMode,
    selectedTestIds,
    notes,
    collectPayment,
    paymentMethod,
    paymentCollected,
  ]);

  const setBillingStatus = billingSession?.setStatus;
  const resetBillingStatus = billingSession?.reset;

  useEffect(() => {
    setBillingStatus?.(billingStatus);
  }, [billingStatus, setBillingStatus]);

  useEffect(() => {
    return () => {
      resetBillingStatus?.();
    };
  }, [resetBillingStatus]);

  function patchNewPatient(patch: Partial<NewPatientDraft>) {
    if (orderLocked) return;
    setNewPatient((prev) => ({ ...prev, ...patch }));
  }

  function addTest(id: string) {
    if (orderLocked) return;
    setSelectedTestIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeTest(id: string) {
    if (orderLocked) return;
    setSelectedTestIds((prev) => prev.filter((x) => x !== id));
  }

  function clearBill() {
    if (orderLocked) return;
    setSelectedTestIds([]);
  }

  function validateBeforeCollectOrComplete(): string | null {
    if (selectedTestIds.length === 0) return "Add at least one test to the bill.";
    if (mode === "existing") {
      if (!patientId) return "Select a patient.";
    } else {
      if (!newPatient.name.trim()) return "Enter patient name.";
      if (!newPatient.phone.trim()) return "Enter phone number.";
      if (!newPatient.address.trim()) return "Enter address.";
      if (!newPatient.age.trim()) return "Enter age.";
      if (!newPatient.gender) return "Select sex.";
    }
    return null;
  }

  function onCollect() {
    const problem = validateBeforeCollectOrComplete();
    if (problem) {
      setError(problem);
      return;
    }
    if (!paymentMethod) {
      setError("Select a payment method.");
      return;
    }
    setError(null);
    setPaymentCollected(true);
  }

  function nextPatient() {
    setReceipt(null);
    setInvoiceOpen(false);
    setSelectedTestIds([]);
    setError(null);
    setPatientQuery("");
    setTestQuery("");
    setPatientId("");
    setBaselinePatientId("");
    setNewPatient(EMPTY_PATIENT);
    setCollectPayment(true);
    setPaymentMethod("CASH");
    setPaymentCollected(false);
    setNotes("");
    setShowNotes(false);
    setMode(patients.length ? "existing" : "new");
    setPending(false);
  }

  async function completeOrder() {
    const problem = validateBeforeCollectOrComplete();
    if (problem) {
      setError(problem);
      return;
    }
    if (collectPayment && !paymentCollected) {
      setError("Collect payment first, then complete the order.");
      return;
    }

    flushSync(() => {
      setPending(true);
      setError(null);
    });

    const formData = new FormData();
    formData.set("patientMode", mode);
    if (mode === "existing") {
      formData.set("patientId", patientId);
    } else {
      formData.set("patientName", newPatient.name.trim());
      formData.set("patientPhone", newPatient.phone.trim());
      formData.set("patientAddress", newPatient.address.trim());
      formData.set("patientAge", newPatient.age.trim());
      formData.set("patientGender", newPatient.gender);
      if (newPatient.email.trim()) formData.set("patientEmail", newPatient.email.trim());
    }
    for (const id of selectedTestIds) formData.append("testIds", id);
    if (notes.trim()) formData.set("notes", notes.trim());
    if (collectPayment) formData.set("paymentMethod", paymentMethod);

    const patientName =
      mode === "new" ? newPatient.name.trim() : selectedPatient?.name || "Patient";
    const patientPhone =
      mode === "new"
        ? newPatient.phone.trim() || null
        : selectedPatient?.phone || null;
    const patientEmail =
      mode === "new"
        ? newPatient.email.trim() || null
        : selectedPatient?.email || null;
    const totalSnapshot = selectedTotal;
    const paidSnapshot = collectPayment;

    try {
      const result = await createOrderAction(formData);
      if (result?.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      if (result?.orderId) {
        setReceipt({
          orderId: result.orderId,
          invoiceId: result.invoiceId ?? null,
          invoiceNumber: result.invoiceNumber ?? null,
          total: totalSnapshot,
          paid: paidSnapshot,
          patientName,
          patientPhone,
          patientEmail,
        });
        setInvoiceOpen(Boolean(result.invoiceId));
        setPending(false);
        return;
      }
      setPending(false);
    } catch (err) {
      setPending(false);
      throw err;
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
    <>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <section className={`${panelClass} shrink-0`}>
            <div className="flex items-center justify-between gap-2 border-b border-emerald-800/10 px-3 py-2">
              <h2 className="text-sm font-semibold text-emerald-950">Patient</h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={orderLocked}
                  onClick={() => setMode("new")}
                  className={`${chipClass(mode === "new")} disabled:opacity-50`}
                >
                  New
                </button>
                <button
                  type="button"
                  disabled={orderLocked || patients.length === 0}
                  onClick={() => setMode("existing")}
                  className={`${chipClass(mode === "existing")} disabled:opacity-50`}
                >
                  Existing
                </button>
              </div>
            </div>
            <div className="max-h-[34vh] overflow-y-auto px-3 py-2.5 sm:max-h-[38vh]">
              {mode === "new" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field
                    label="Name"
                    required
                    value={newPatient.name}
                    onChange={(v) => patchNewPatient({ name: v })}
                    disabled={orderLocked}
                    autoComplete="name"
                  />
                  <Field
                    label="Phone"
                    type="tel"
                    required
                    value={newPatient.phone}
                    onChange={(v) => patchNewPatient({ phone: v })}
                    disabled={orderLocked}
                    autoComplete="tel"
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Address"
                      required
                      value={newPatient.address}
                      onChange={(v) => patchNewPatient({ address: v })}
                      disabled={orderLocked}
                      autoComplete="street-address"
                    />
                  </div>
                  <Field
                    label="Age"
                    type="number"
                    required
                    value={newPatient.age}
                    onChange={(v) => patchNewPatient({ age: v })}
                    disabled={orderLocked}
                  />
                  <div className="text-sm">
                    <label htmlFor="patientGender" className="mb-1 block text-xs font-medium text-emerald-950/80">
                      Sex *
                    </label>
                    <select
                      id="patientGender"
                      required
                      value={newPatient.gender}
                      disabled={orderLocked}
                      onChange={(e) => patchNewPatient({ gender: e.target.value })}
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Email (optional)"
                      type="email"
                      value={newPatient.email}
                      onChange={(v) => patchNewPatient({ email: v })}
                      disabled={orderLocked}
                      autoComplete="email"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <input
                    type="search"
                    value={patientQuery}
                    disabled={orderLocked}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    placeholder="Search name or phone…"
                    className={inputClass}
                    autoComplete="off"
                  />
                  <select
                    required
                    value={patientId}
                    disabled={orderLocked}
                    onChange={(e) => setPatientId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      {filteredPatients.length ? "Select patient" : "No match"}
                    </option>
                    {filteredPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.phone ? ` · ${p.phone}` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedPatient ? (
                    <p className="text-xs text-emerald-900/65">
                      {[
                        selectedPatient.phone,
                        selectedPatient.gender,
                        selectedPatient.age != null ? `${selectedPatient.age}y` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          <section className={`${panelClass} min-h-0 flex-1`}>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-emerald-800/10 px-3 py-2">
              <h2 className="text-sm font-semibold text-emerald-950">Tests *</h2>
              <span className="text-xs text-emerald-900/55">{filteredTests.length}</span>
            </div>
            <div className="shrink-0 px-3 pt-2">
              <input
                type="search"
                value={testQuery}
                disabled={orderLocked}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Search CBC, lipid, code…"
                className={inputClass}
                autoComplete="off"
              />
            </div>
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
              {filteredTests.length === 0 ? (
                <p className="text-sm text-emerald-900/60">No tests match.</p>
              ) : (
                filteredTests.map((t) => {
                  const inBill = selectedTestIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className={[
                        "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2",
                        inBill
                          ? "border-emerald-600/40 bg-emerald-50"
                          : "border-emerald-800/15 bg-[#f7fcf9]",
                      ].join(" ")}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-emerald-950">{t.name}</p>
                        <p className="text-xs text-emerald-900/55">
                          {t.code} · {formatMoney(t.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={orderLocked}
                        onClick={() => (inBill ? removeTest(t.id) : addTest(t.id))}
                        className={[
                          "shrink-0 inline-flex min-h-8 items-center rounded-md px-2.5 text-xs font-semibold disabled:opacity-50",
                          inBill
                            ? "bg-white text-emerald-900 ring-1 ring-emerald-800/20 hover:text-rose-800"
                            : "bg-teal-800 text-white hover:bg-teal-700",
                        ].join(" ")}
                      >
                        {inBill ? "Remove" : "Add"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="shrink-0 border-t border-emerald-800/10 px-3 py-1.5">
              <button
                type="button"
                onClick={() => setShowNotes((v) => !v)}
                className="text-xs font-medium text-emerald-800 hover:underline"
              >
                {showNotes ? "Hide notes" : "Add notes"}
              </button>
              {showNotes ? (
                <textarea
                  rows={2}
                  value={notes}
                  disabled={orderLocked}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Referral, fasting…"
                  className={`mt-1.5 ${inputClass}`}
                />
              ) : null}
            </div>
          </section>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <section className={`${panelClass} min-h-0 flex-[1.1]`}>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-emerald-800/10 px-3 py-2">
              <h2 className="text-sm font-semibold text-emerald-950">Bill</h2>
              {selectedTests.length > 0 && !orderLocked ? (
                <button
                  type="button"
                  onClick={clearBill}
                  className="text-xs font-medium text-emerald-800 hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {selectedTests.length === 0 ? (
                <p className="text-sm text-emerald-900/60">Add tests from the left.</p>
              ) : (
                <ul className="space-y-1.5">
                  {selectedTests.map((t) => (
                    <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-emerald-950">{t.name}</p>
                        <p className="text-xs text-emerald-900/55">{t.code}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums text-sm font-medium">
                          {formatMoney(t.price)}
                        </span>
                        {!orderLocked ? (
                          <button
                            type="button"
                            onClick={() => removeTest(t.id)}
                            className="text-xs font-medium text-emerald-800/70 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="shrink-0 border-t border-emerald-800/10 px-3 py-2">
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-emerald-900/60">
                  {selectedTests.length} test{selectedTests.length === 1 ? "" : "s"}
                </p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-emerald-950">
                  {formatMoney(selectedTotal)}
                </p>
              </div>
            </div>
          </section>

          {!receipt ? (
            <section className={`${panelClass} shrink-0`}>
              <div className="border-b border-emerald-800/10 px-3 py-2">
                <h2 className="text-sm font-semibold text-emerald-950">Payment</h2>
              </div>
              <div className="space-y-2.5 px-3 py-2.5">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCollectPayment(true);
                      setPaymentCollected(false);
                    }}
                    className={chipClass(collectPayment)}
                  >
                    Collect now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCollectPayment(false);
                      setPaymentCollected(false);
                    }}
                    className={chipClass(!collectPayment, "amber")}
                  >
                    Unpaid
                  </button>
                </div>

                {collectPayment ? (
                  <>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          disabled={paymentCollected}
                          onClick={() => {
                            setPaymentMethod(m.value);
                            setPaymentCollected(false);
                          }}
                          className={[
                            "min-h-9 rounded-md border text-xs font-semibold disabled:opacity-60 sm:text-sm",
                            paymentMethod === m.value
                              ? "border-teal-800 bg-teal-800 text-white"
                              : "border-emerald-800/20 bg-[#f7fcf9] text-emerald-950 hover:bg-emerald-50",
                          ].join(" ")}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {!paymentCollected ? (
                      <button
                        type="button"
                        onClick={onCollect}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Collect {formatMoney(selectedTotal)}
                      </button>
                    ) : (
                      <>
                        <p className="rounded-md bg-emerald-50 px-2.5 py-2 text-xs font-medium text-emerald-900">
                          Collected via{" "}
                          {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ??
                            paymentMethod}{" "}
                          · {formatMoney(selectedTotal)}
                        </p>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => void completeOrder()}
                          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-teal-800 px-3 text-base font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                        >
                          {pending ? "Completing…" : "Complete order"}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void completeOrder()}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-teal-800 px-3 text-base font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    {pending ? "Completing…" : `Complete unpaid · ${formatMoney(selectedTotal)}`}
                  </button>
                )}

                {error ? (
                  <p role="alert" className="rounded-md bg-rose-50 px-2 py-1.5 text-xs text-rose-800">
                    {error}
                  </p>
                ) : null}
              </div>
            </section>
          ) : (
            <section className={`${panelClass} shrink-0 border-teal-800/25`}>
              <div className="space-y-3 px-3 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-800/80">
                    {receipt.paid ? "Order completed" : "Unpaid order created"}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-emerald-950">
                    {receipt.patientName}
                    {receipt.invoiceNumber ? ` · ${receipt.invoiceNumber}` : ""}
                  </p>
                  <p className="text-xs text-emerald-900/65">{formatMoney(receipt.total)}</p>
                  <p className="mt-1 text-xs text-emerald-900/55">
                    Details stay on screen until you start a new patient.
                  </p>
                </div>
                {receipt.invoiceId ? (
                  <button
                    type="button"
                    onClick={() => setInvoiceOpen(true)}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
                  >
                    Send / print invoice
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={nextPatient}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-teal-800 px-4 text-base font-semibold text-white hover:bg-teal-700"
                >
                  New patient
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>

      {receipt?.invoiceId ? (
        <CounterInvoiceModal
          receipt={receipt}
          channels={channels}
          open={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
          onNextPatient={nextPatient}
        />
      ) : null}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const id = `cf-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-emerald-950/80">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}
