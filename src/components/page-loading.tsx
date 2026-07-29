export function PageLoadingSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <div className="mb-4 h-10 max-w-md animate-pulse rounded-lg bg-emerald-900/10" />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-emerald-900/10" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-emerald-900/10" />
      <span className="sr-only">{label}…</span>
    </div>
  );
}
