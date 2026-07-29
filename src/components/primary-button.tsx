"use client";

import { useFormStatus } from "react-dom";
import { useReportFormPending } from "@/components/action-pending";

function Spinner({ className = "size-4" }: { className?: string }) {
  return <span className={`lab-spinner lab-spinner--on-dark ${className}`} aria-hidden="true" />;
}

export function PrimaryButton({
  children,
  type = "submit",
  disabled,
}: {
  children: React.ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  useReportFormPending(pending);
  const busy = pending || Boolean(disabled);

  return (
    <button
      type={type}
      disabled={busy}
      aria-busy={pending || undefined}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? <Spinner /> : null}
      <span>{pending ? "Working…" : children}</span>
    </button>
  );
}
