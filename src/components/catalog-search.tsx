"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Field, PrimaryButton } from "@/components/ui";

type Category = { id: string; name: string };

export function CatalogSearch({
  catalogQ = "",
  category = "",
  categories,
  preserveQ = "",
}: {
  catalogQ?: string;
  category?: string;
  categories: Category[];
  /** Keep the lab tests list search when filtering the catalog. */
  preserveQ?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mb-3 flex flex-wrap items-end gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const params = new URLSearchParams();
        const catalog = String(data.get("catalog") || "").trim();
        const cat = String(data.get("category") || "").trim();
        if (catalog) params.set("catalog", catalog);
        if (cat) params.set("category", cat);
        if (preserveQ) params.set("q", preserveQ);
        const qs = params.toString();
        startTransition(() => {
          router.push(qs ? `/app/tests?${qs}` : "/app/tests");
        });
      }}
    >
      <div className="min-w-[200px] flex-1">
        <Field
          label="Search catalog"
          name="catalog"
          defaultValue={catalogQ}
          placeholder="CBC, LFT, TSH, Vitamin D…"
        />
      </div>
      <div className="min-w-[160px]">
        <label
          className="mb-1.5 block text-sm font-medium text-emerald-950/80"
          htmlFor="catalog-category"
        >
          Category
        </label>
        <select
          id="catalog-category"
          name="category"
          defaultValue={category}
          disabled={pending}
          className="min-h-10 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25 disabled:opacity-60"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? "Searching…" : "Search"}
      </PrimaryButton>
    </form>
  );
}
