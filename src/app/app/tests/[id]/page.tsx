import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Badge, Card, EmptyState, Field, PrimaryButton, TextArea, TextLink } from "@/components/ui";
import {
  addTestFieldAction,
  deleteTestFieldAction,
  deleteTestAction,
  updateTestAction,
} from "@/app/actions/tests";
import { formatMoney } from "@/lib/billing";

type TestField = {
  id: string;
  label: string;
  key: string;
  unit: string | null;
  fieldType: string;
  referenceMin: number | null;
  referenceMax: number | null;
  referenceText: string | null;
  required: boolean;
};

type TestDetail = {
  id: string;
  name: string;
  code: string;
  price: number;
  category: string | null;
  defaultReportComment: string | null;
  updatedAt: string;
  fields: TestField[];
};

function referenceLabel(field: TestField) {
  if (field.referenceText) return field.referenceText;
  if (field.referenceMin != null || field.referenceMax != null) {
    return `${field.referenceMin ?? "…"} – ${field.referenceMax ?? "…"}`;
  }
  return null;
}

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireClientContext();
  const { id } = await params;

  const result = await apiFetch<{ test: TestDetail }>(`/api/v1/tests/${id}`);
  if (!result.ok) notFound();
  const test = result.data.test;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <TextLink href="/app/tests">Tests</TextLink>
        <span className="text-emerald-900/40" aria-hidden="true">
          /
        </span>
        <Badge tone="teal">{test.code}</Badge>
        <span className="text-emerald-900/55">
          {formatMoney(test.price)}
          {test.category ? ` · ${test.category}` : ""}
        </span>
        <form action={deleteTestAction} className="ml-auto">
          <input type="hidden" name="testId" value={test.id} />
          <button
            type="submit"
            className="inline-flex min-h-10 items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
          >
            Delete test
          </button>
        </form>
      </div>

      <div className="mb-5">
        <Card title="Test details">
          <form
            key={test.updatedAt}
            action={updateTestAction}
            className="grid gap-3 sm:grid-cols-2"
          >
            <input type="hidden" name="testId" value={test.id} />
            <input type="hidden" name="returnTo" value={`/app/tests/${test.id}`} />
            <Field label="Name" name="name" required defaultValue={test.name} />
            <Field label="Code" name="code" required defaultValue={test.code} />
            <Field
              label="Price (INR)"
              name="price"
              type="number"
              step="0.01"
              defaultValue={test.price}
            />
            <Field
              label="Category"
              name="category"
              defaultValue={test.category}
              placeholder="Haematology"
            />
            <div className="sm:col-span-2">
              <TextArea
                label="Default report comment"
                name="defaultReportComment"
                rows={3}
                defaultValue={test.defaultReportComment}
                placeholder="e.g. Method: Automated hematology analyzer. Correlate with clinical findings."
                hint="Printed under this test on the lab report."
              />
            </div>
            <div className="sm:col-span-2">
              <PrimaryButton>Save test details</PrimaryButton>
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card title="Add result field">
          <p className="mb-4 text-sm text-emerald-900/65">
            These fields appear on the report for this test. Use a short key like{" "}
            <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs">hb</code>.
          </p>
          <form action={addTestFieldAction} className="space-y-3">
            <input type="hidden" name="testId" value={test.id} />
            <Field label="Label" name="label" required placeholder="Hemoglobin" />
            <Field label="Key" name="key" required placeholder="hb" hint="Letters, numbers, underscore" />
            <Field label="Unit" name="unit" placeholder="g/dL" />
            <div className="text-sm">
              <label htmlFor="fieldType" className="mb-1.5 block font-medium text-emerald-950/80">
                Type
              </label>
              <select
                id="fieldType"
                name="fieldType"
                className="min-h-11 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
                defaultValue="NUMBER"
              >
                <option value="NUMBER">Number</option>
                <option value="TEXT">Text</option>
                <option value="LONG_TEXT">Long text</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ref min" name="referenceMin" type="number" step="0.01" />
              <Field label="Ref max" name="referenceMax" type="number" step="0.01" />
            </div>
            <Field label="Ref text (optional)" name="referenceText" placeholder="Negative" />
            <Field
              label="Sort order"
              name="sortOrder"
              type="number"
              defaultValue={test.fields.length + 1}
            />
            <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-emerald-950">
              <input type="checkbox" name="required" defaultChecked className="size-4" />
              Required on report
            </label>
            <PrimaryButton>Add field</PrimaryButton>
          </form>
        </Card>

        <Card title={`Fields on this test (${test.fields.length})`}>
          {test.fields.length === 0 ? (
            <EmptyState>
              No fields yet. Add the parameters that should appear on the CBC report.
            </EmptyState>
          ) : (
            <ul className="space-y-3" aria-label="Configured result fields">
              {test.fields.map((field, index) => {
                const reference = referenceLabel(field);
                return (
                  <li
                    key={field.id}
                    className="rounded-xl border border-emerald-800/12 bg-[#f7fcf9] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-white">
                            {index + 1}
                          </span>
                          <h3 className="text-base font-semibold text-emerald-950">{field.label}</h3>
                          {field.required ? <Badge tone="green">Required</Badge> : <Badge>Optional</Badge>}
                        </div>

                        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-emerald-900/50">
                              Key
                            </dt>
                            <dd className="mt-0.5 font-mono text-emerald-950">{field.key}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-emerald-900/50">
                              Unit
                            </dt>
                            <dd className="mt-0.5 text-emerald-950">{field.unit || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-emerald-900/50">
                              Type
                            </dt>
                            <dd className="mt-0.5 text-emerald-950">
                              {field.fieldType.replaceAll("_", " ")}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-emerald-900/50">
                              Reference
                            </dt>
                            <dd className="mt-0.5 text-emerald-950">{reference || "—"}</dd>
                          </div>
                        </dl>
                      </div>

                      <form action={deleteTestFieldAction.bind(null, field.id, test.id)}>
                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
