"use client";

import { useState, useTransition } from "react";
import { updateLabUserPasswordAction } from "@/app/actions/client";

export function ChangeUserPasswordForm({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="text-sm font-medium text-teal-800 underline"
      >
        Change password
      </button>
    );
  }

  return (
    <form
      className="space-y-2 rounded-lg border border-emerald-800/15 bg-white p-3"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateLabUserPasswordAction(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
            return;
          }
          setOpen(false);
        });
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <p className="text-xs text-emerald-900/60">New password for {userName}</p>
      <input
        name="password"
        type="password"
        required
        minLength={4}
        autoComplete="new-password"
        placeholder="New password (min 4 chars)"
        className="min-h-10 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
      />
      <input
        name="confirmPassword"
        type="password"
        required
        minLength={4}
        autoComplete="new-password"
        placeholder="Confirm password"
        className="min-h-10 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
      />
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-9 items-center rounded-lg bg-emerald-950 px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save password"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-9 items-center rounded-lg border border-emerald-800/20 px-3 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
