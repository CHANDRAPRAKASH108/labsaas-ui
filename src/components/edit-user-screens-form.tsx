"use client";

import { useState, useTransition } from "react";
import { updateLabUserScreensAction } from "@/app/actions/client";
import { CONFIGURABLE_SCREENS, DEFAULT_STAFF_SCREENS } from "@/lib/nav";
import { useComponentLog } from "@/hooks/use-component-log";

export function EditUserScreensForm({
  userId,
  role,
  allowedScreens,
}: {
  userId: string;
  role: string;
  allowedScreens: string[];
}) {
  useComponentLog("EditUserScreensForm");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (role === "CLIENT_ADMIN") {
    return <span className="text-sm text-emerald-900/55">All screens</span>;
  }

  const selected =
    allowedScreens.length > 0 ? allowedScreens : DEFAULT_STAFF_SCREENS;

  if (!open) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-emerald-900/75">
          {selected
            .map((key) => CONFIGURABLE_SCREENS.find((s) => s.key === key)?.label || key)
            .join(", ")}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-teal-800 underline"
        >
          Edit access
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-2 rounded-lg border border-emerald-800/15 bg-white p-3"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateLabUserScreensAction(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
            return;
          }
          setOpen(false);
        });
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <ul className="space-y-1.5">
        {CONFIGURABLE_SCREENS.map((screen) => (
          <li key={screen.key}>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="screens"
                value={screen.key}
                defaultChecked={selected.includes(screen.key)}
                className="rounded border-emerald-800/30"
              />
              {screen.label}
            </label>
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-9 items-center rounded-lg bg-emerald-950 px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
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
