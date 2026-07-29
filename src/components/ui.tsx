import Link from "next/link";
import { PrimaryButton } from "@/components/primary-button";

export { PrimaryButton };
export { AppShell } from "@/components/app-shell";


export function Card({
  title,
  children,
  action,
  as: Tag = "section",
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  as?: "section" | "article" | "div";
}) {
  const headingId = title ? `card-${title.toLowerCase().replace(/\s+/g, "-")}` : undefined;

  return (
    <Tag
      className="rounded-[var(--radius)] border border-emerald-800/12 bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      aria-labelledby={headingId}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <h2 id={headingId} className="text-base font-semibold tracking-tight text-emerald-950">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children}
    </Tag>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-emerald-900/70">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-emerald-950">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-emerald-900/55">{hint}</p> : null}
    </Card>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  step,
  hint,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  step?: string;
  hint?: string;
  autoComplete?: string;
}) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="block text-sm">
      <label htmlFor={id} className="mb-1.5 block font-medium text-emerald-950/80">
        {label}
        {required ? (
          <span className="text-rose-700" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        step={step}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        autoComplete={autoComplete}
        aria-required={required || undefined}
        aria-describedby={hintId}
        className="min-h-11 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 text-emerald-950 shadow-sm outline-none transition placeholder:text-emerald-900/40 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
      />
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-emerald-900/55">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="block text-sm">
      <label htmlFor={id} className="mb-1.5 block font-medium text-emerald-950/80">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        aria-describedby={hintId}
        className="w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 text-emerald-950 shadow-sm outline-none transition placeholder:text-emerald-900/40 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
      />
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-emerald-900/55">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100/70"
    >
      {children}
    </Link>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-emerald-800 underline decoration-emerald-800/30 underline-offset-2 hover:decoration-emerald-800"
    >
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "teal";
}) {
  const tones = {
    slate: "bg-emerald-100 text-emerald-950 ring-emerald-200",
    green: "bg-emerald-100 text-emerald-950 ring-emerald-300",
    amber: "bg-amber-50 text-amber-950 ring-amber-200",
    red: "bg-rose-50 text-rose-900 ring-rose-200",
    teal: "bg-teal-100 text-teal-950 ring-teal-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-emerald-800/25 bg-emerald-100/50 px-4 py-8 text-center text-sm text-emerald-900/75">
      {children}
    </p>
  );
}
