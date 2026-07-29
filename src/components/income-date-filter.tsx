"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Card } from "@/components/ui";
import { useComponentLog } from "@/hooks/use-component-log";

export function IncomeDateFilter({
  dateFrom,
  dateTo,
  presets,
  maxMonths,
}: {
  dateFrom: string;
  dateTo: string;
  presets: { label: string; href: string }[];
  maxMonths: number;
}) {
  useComponentLog("IncomeDateFilter");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function applyRange(from: string, to: string) {
    const params = new URLSearchParams({ dateFrom: from, dateTo: to });
    startTransition(() => {
      router.push(`/app/income?${params.toString()}`);
    });
  }

  return (
    <div className="mb-5">
      <Card title="Filter financial summary">
        <p className="mb-3 text-sm text-emerald-900/65">
          Paid collections only (IST). Maximum range is {maxMonths} months.
        </p>
        <form
          key={`${dateFrom}-${dateTo}`}
          className="mb-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const from = String(data.get("dateFrom") || "").trim();
            const to = String(data.get("dateTo") || "").trim();
            if (!from || !to) return;
            applyRange(from, to);
          }}
        >
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-emerald-950/80">From</span>
            <input
              type="date"
              name="dateFrom"
              required
              defaultValue={dateFrom}
              disabled={pending}
              className="min-h-10 rounded-lg border border-emerald-800/20 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25 disabled:opacity-60"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-emerald-950/80">To</span>
            <input
              type="date"
              name="dateTo"
              required
              defaultValue={dateTo}
              disabled={pending}
              className="min-h-10 rounded-lg border border-emerald-800/20 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25 disabled:opacity-60"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 items-center rounded-lg bg-emerald-900 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Updating…" : "Apply"}
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Link
              key={preset.label}
              href={preset.href}
              className="inline-flex min-h-9 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
              onClick={(event) => {
                event.preventDefault();
                const url = new URL(preset.href, window.location.origin);
                applyRange(
                  url.searchParams.get("dateFrom") || dateFrom,
                  url.searchParams.get("dateTo") || dateTo,
                );
              }}
            >
              {preset.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
