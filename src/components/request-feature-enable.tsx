"use client";

import { useEffect, useId, useRef, useState } from "react";
import { requestFeatureEnableAction } from "@/app/actions/features";
import { PrimaryButton } from "@/components/ui";

const FEATURE_OPTIONS = ["Email", "SMS", "WhatsApp"] as const;

type Props = {
  disabledFeatures: string[];
};

export function RequestFeatureEnable({ disabledFeatures }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(
    disabledFeatures.length ? disabledFeatures : [...FEATURE_OPTIONS],
  );
  const [message, setMessage] = useState("");
  const titleId = useId();
  const errorId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function openModal() {
    setError(null);
    setSuccess(null);
    setSelected(disabledFeatures.length ? disabledFeatures : [...FEATURE_OPTIONS]);
    setMessage("");
    setOpen(true);
  }

  function toggleFeature(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const result = await requestFeatureEnableAction({
      features: selected,
      message,
    });

    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }

    setSuccess(`Request sent to ${result.to}. We'll follow up soon.`);
    setTimeout(() => setOpen(false), 1400);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800/25 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-100"
      >
        Request enable
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/45 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={error ? errorId : undefined}
            className="w-full max-w-lg rounded-2xl border border-emerald-800/15 bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-emerald-950">
                  Request feature enable
                </h2>
                <p className="mt-1 text-sm text-emerald-900/70">
                  Tell us which channels you need. Your message is emailed to the Super Admin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm font-medium text-emerald-900/70 hover:bg-emerald-100"
                aria-label="Close"
              >
                Esc
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-emerald-950">Features</legend>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_OPTIONS.map((name) => {
                    const checked = selected.includes(name);
                    return (
                      <label
                        key={name}
                        className={[
                          "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                          checked
                            ? "border-emerald-700 bg-emerald-100 text-emerald-950"
                            : "border-emerald-800/20 bg-[#f7fcf9] text-emerald-900/80",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFeature(name)}
                          className="size-4"
                        />
                        {name}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="text-sm">
                <label htmlFor="feature-request-message" className="mb-1.5 block font-medium text-emerald-950/80">
                  Message <span className="text-rose-700" aria-hidden="true">*</span>
                </label>
                <textarea
                  ref={firstFieldRef}
                  id="feature-request-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Why do you need these channels, and when do you need them enabled?"
                  className="w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 text-emerald-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
                />
              </div>

              {error ? (
                <p id={errorId} role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p role="status" className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-950">
                  {success}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800/20 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
                >
                  Cancel
                </button>
                <PrimaryButton disabled={pending || selected.length === 0}>
                  {pending ? "Sending…" : "Send request"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
