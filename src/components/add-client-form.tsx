"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/app/actions/super";
import { Field, PrimaryButton } from "@/components/ui";

export function AddClientForm() {
  const router = useRouter();
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createClientAction(formData);
    setPending(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setFormKey((k) => k + 1);
    router.refresh();
  }

  return (
    <form
      key={formKey}
      action={onSubmit}
      className="space-y-3"
      aria-describedby={error ? errorId : undefined}
    >
      <Field label="Lab name" name="name" required placeholder="City Care Diagnostics" />
      <Field label="Admin name" name="adminName" placeholder="Lab Admin" />
      <Field
        label="Admin email"
        name="adminEmail"
        type="email"
        required
        placeholder="admin@lab.local"
        autoComplete="off"
      />
      <Field
        label="Temp password"
        name="adminPassword"
        type="text"
        defaultValue="lab123"
        required
        hint="Share this with the lab admin for first login."
      />
      {error ? (
        <p id={errorId} role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      <PrimaryButton disabled={pending}>
        {pending ? "Creating…" : "Add new client"}
      </PrimaryButton>
    </form>
  );
}
