"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useComponentLog } from "@/hooks/use-component-log";

export function ListSearch({
  action,
  q = "",
  placeholder,
  hiddenFields,
}: {
  action: string;
  q?: string;
  placeholder: string;
  hiddenFields?: Record<string, string>;
}) {
  useComponentLog("ListSearch");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const clearHref =
    hiddenFields && Object.keys(hiddenFields).length > 0
      ? `${action}?${new URLSearchParams(hiddenFields).toString()}`
      : action;

  return (
    <form
      className="mb-4 flex flex-wrap items-center gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const params = new URLSearchParams();
        for (const [key, value] of data.entries()) {
          const text = String(value).trim();
          if (text) params.set(key, text);
        }
        const qs = params.toString();
        startTransition(() => {
          router.push(qs ? `${action}?${qs}` : action);
        });
      }}
    >
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <label htmlFor="list-search" className="sr-only">
        Search
      </label>
      <input
        id="list-search"
        name="q"
        type="search"
        defaultValue={q}
        placeholder={placeholder}
        className="min-h-10 min-w-[12rem] flex-1 rounded-lg border border-emerald-800/20 bg-white px-3 text-sm text-emerald-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25 sm:max-w-md"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center rounded-lg bg-emerald-900 px-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Searching…" : "Search"}
      </button>
      {q ? (
        <Link
          href={clearHref}
          className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
          onClick={(event) => {
            event.preventDefault();
            startTransition(() => router.push(clearHref));
          }}
        >
          Clear
        </Link>
      ) : null}
    </form>
  );
}
