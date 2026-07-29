import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Card, EmptyState, Field, PrimaryButton, Badge, TextLink, TextArea } from "@/components/ui";
import { ListSearch } from "@/components/list-search";
import { CatalogSearch } from "@/components/catalog-search";
import { searchQuery } from "@/lib/search";
import {
  createTestAction,
  updateTestAction,
  deleteTestAction,
} from "@/app/actions/tests";
import { formatMoney } from "@/lib/billing";
import { AddFromCatalogButton } from "@/components/add-from-catalog-button";

type TestRow = {
  id: string;
  name: string;
  code: string;
  price: number;
  category: string | null;
  defaultReportComment: string | null;
  isActive: boolean;
  _count: { fields: number };
};

type CatalogTest = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  sampleType: string | null;
  defaultPrice: number;
  parameterCount: number;
  alreadyAdded: boolean;
  labTestId: string | null;
};

type CatalogCategory = { id: string; name: string };

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string; catalog?: string; category?: string }>;
}) {
  await requireClientContext();
  const params = await searchParams;
  const q = searchQuery(params.q);
  const catalogQ = searchQuery(params.catalog);
  const categoryFilter = String(params.category || "").trim();
  const editId = String(params.edit || "").trim();

  const [listResult, catalogResult] = await Promise.all([
    apiFetch<{ tests: TestRow[] }>("/api/v1/tests", {
      searchParams: { q: q || undefined },
    }),
    apiFetch<{ tests: CatalogTest[]; categories: CatalogCategory[] }>("/api/v1/catalog/tests", {
      searchParams: {
        q: catalogQ || undefined,
        category: categoryFilter || undefined,
        limit: "40",
      },
    }),
  ]);

  const tests = listResult.ok ? listResult.data.tests : [];
  const catalogTests = catalogResult.ok ? catalogResult.data.tests : [];
  const catalogCategories = catalogResult.ok ? catalogResult.data.categories : [];

  const editing = editId
    ? tests.find((t) => t.id === editId) ??
      (await (async () => {
        const one = await apiFetch<{ test: TestRow }>(`/api/v1/tests/${editId}`);
        return one.ok ? one.data.test : null;
      })())
    : null;

  const isEditing = Boolean(editing);

  return (
    <>
      <Card title="Add from master catalog">
        <p className="mb-3 text-sm text-emerald-900/70">
          Search the platform pathology catalog and add a test to <strong>this lab</strong>. A
          separate copy is created so you can change price, ranges, and fields without affecting
          other labs. Cannot find it? Create a custom test below.
        </p>
        <CatalogSearch
          catalogQ={catalogQ}
          category={categoryFilter}
          categories={catalogCategories}
          preserveQ={q}
        />

        {!catalogResult.ok ? (
          <EmptyState>Could not load catalog: {catalogResult.error}</EmptyState>
        ) : catalogTests.length === 0 ? (
          <EmptyState>
            {catalogQ || categoryFilter
              ? "No master tests match. Try another search, or create a custom test."
              : "Master catalog is empty."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="lab-table">
              <caption className="sr-only">Platform master tests</caption>
              <thead>
                <tr>
                  <th scope="col">Test</th>
                  <th scope="col">Code</th>
                  <th scope="col">Params</th>
                  <th scope="col">Default price</th>
                  <th scope="col">
                    <span className="sr-only">Add</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {catalogTests.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-slate-500">
                        {t.category || "Uncategorized"}
                        {t.sampleType ? ` · ${t.sampleType}` : ""}
                      </div>
                    </td>
                    <td>
                      <Badge tone="teal">{t.code}</Badge>
                    </td>
                    <td>{t.parameterCount}</td>
                    <td>{formatMoney(t.defaultPrice)}</td>
                    <td>
                      {t.alreadyAdded ? (
                        <TextLink href={`/app/tests?edit=${t.labTestId}`}>Added · Edit</TextLink>
                      ) : (
                        <AddFromCatalogButton masterTestId={t.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card title={isEditing ? "Edit test" : "Create custom test"}>
          {isEditing && editing ? (
            <form key={editing.id} action={updateTestAction} className="space-y-3">
              <input type="hidden" name="testId" value={editing.id} />
              <input type="hidden" name="returnTo" value="/app/tests" />
              <Field label="Name" name="name" required defaultValue={editing.name} />
              <Field label="Code" name="code" required defaultValue={editing.code} />
              <Field
                label="Price (INR)"
                name="price"
                type="number"
                step="0.01"
                defaultValue={editing.price}
              />
              <Field
                label="Category"
                name="category"
                defaultValue={editing.category}
                placeholder="Haematology"
              />
              <TextArea
                label="Default report comment"
                name="defaultReportComment"
                rows={3}
                defaultValue={editing.defaultReportComment}
                placeholder="e.g. Method: Automated hematology analyzer. Correlate with clinical findings."
                hint="Printed under this test on the lab report. Leave blank if none."
              />
              <div className="flex flex-wrap items-center gap-2">
                <PrimaryButton>Save changes</PrimaryButton>
                <TextLink href={q ? `/app/tests?q=${encodeURIComponent(q)}` : "/app/tests"}>
                  Cancel
                </TextLink>
              </div>
              <p className="text-xs text-emerald-900/55">
                Result parameters are configured separately —{" "}
                <TextLink href={`/app/tests/${editing.id}`}>open fields</TextLink>.
              </p>
            </form>
          ) : (
            <form action={createTestAction} className="space-y-3">
              <Field label="Name" name="name" required placeholder="Complete Blood Count" />
              <Field label="Code" name="code" required placeholder="CBC" />
              <Field label="Price (INR)" name="price" type="number" step="0.01" defaultValue={0} />
              <Field label="Category" name="category" placeholder="Haematology" />
              <TextArea
                label="Default report comment"
                name="defaultReportComment"
                rows={3}
                placeholder="e.g. Method: Automated hematology analyzer. Correlate with clinical findings."
                hint="Printed under this test on the lab report. Leave blank if none."
              />
              <PrimaryButton>Create custom test</PrimaryButton>
              <p className="text-xs text-emerald-900/55">
                Prefer searching the master catalog above when the test already exists.
              </p>
            </form>
          )}
        </Card>
        <Card title="Configured for this lab">
          <ListSearch
            action="/app/tests"
            q={q}
            placeholder="Search name, code, or category"
            hiddenFields={{
              ...(catalogQ ? { catalog: catalogQ } : {}),
              ...(categoryFilter ? { category: categoryFilter } : {}),
            }}
          />
          {tests.length === 0 ? (
            <EmptyState>
              {q
                ? "No tests match that search."
                : "No tests in this lab yet. Add from the master catalog or create a custom test."}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="lab-table">
                <caption className="sr-only">Configured laboratory tests</caption>
                <thead>
                  <tr>
                    <th scope="col">Test</th>
                    <th scope="col">Code</th>
                    <th scope="col">Price</th>
                    <th scope="col">Fields</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => {
                    const editHref = q
                      ? `/app/tests?edit=${t.id}&q=${encodeURIComponent(q)}`
                      : `/app/tests?edit=${t.id}`;
                    const selected = editing?.id === t.id;
                    return (
                      <tr key={t.id} className={selected ? "bg-emerald-50/80" : undefined}>
                        <td>
                          <div className="font-medium">
                            {t.name}
                            {!t.isActive ? (
                              <span className="ml-2 text-xs font-normal text-rose-700">
                                (inactive)
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-500">
                            {t.category || "Uncategorized"}
                            {t.defaultReportComment ? " · has comment" : ""}
                          </div>
                        </td>
                        <td>
                          <Badge tone="teal">{t.code}</Badge>
                        </td>
                        <td>{formatMoney(t.price)}</td>
                        <td>{t._count.fields}</td>
                        <td>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <TextLink href={editHref}>Edit</TextLink>
                            <TextLink href={`/app/tests/${t.id}`}>Fields</TextLink>
                            <form action={deleteTestAction} className="inline">
                              <input type="hidden" name="testId" value={t.id} />
                              <button
                                type="submit"
                                className="text-sm font-medium text-rose-700 hover:underline"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
