"use client";

import { useState, useTransition } from "react";
import { createLabUserAction } from "@/app/actions/client";
import { Field, PrimaryButton } from "@/components/ui";
import { CONFIGURABLE_SCREENS, DEFAULT_STAFF_SCREENS } from "@/lib/nav";
import { useComponentLog } from "@/hooks/use-component-log";

export function CreateLabUserForm() {
  useComponentLog("CreateLabUserForm");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<"STAFF" | "CLIENT_ADMIN">("STAFF");

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createLabUserAction(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
          }
        });
      }}
    >
      <Field label="Full name" name="name" required autoComplete="name" />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field
        label="Temp password"
        name="password"
        type="password"
        placeholder="lab123"
        autoComplete="new-password"
      />
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-emerald-950/80">Role</span>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "STAFF" | "CLIENT_ADMIN")}
          className="min-h-11 w-full rounded-lg border border-emerald-800/20 bg-[#f7fcf9] px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
        >
          <option value="STAFF">Staff</option>
          <option value="CLIENT_ADMIN">Client admin</option>
        </select>
      </label>

      {role === "STAFF" ? (
        <fieldset className="rounded-lg border border-emerald-800/15 bg-emerald-50/40 p-3">
          <legend className="px-1 text-sm font-medium text-emerald-950">Visible screens</legend>
          <p className="mb-2 text-xs text-emerald-900/60">
            Choose which tabs this staff user can open. Users &amp; Settings stay admin-only.
          </p>
          <ul className="space-y-2">
            {CONFIGURABLE_SCREENS.map((screen) => (
              <li key={screen.key}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-950">
                  <input
                    type="checkbox"
                    name="screens"
                    value={screen.key}
                    defaultChecked={DEFAULT_STAFF_SCREENS.includes(screen.key)}
                    className="rounded border-emerald-800/30"
                  />
                  {screen.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : (
        <p className="rounded-lg border border-emerald-800/10 bg-white px-3 py-2 text-sm text-emerald-900/70">
          Client admins can access all screens, including Users and Settings.
        </p>
      )}

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      <PrimaryButton disabled={pending}>{pending ? "Saving…" : "Add user"}</PrimaryButton>
    </form>
  );
}
