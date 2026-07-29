"use client";

import { useEffect, useTransition } from "react";
import { addFromCatalogAction } from "@/app/actions/tests";
import { useActionPending } from "@/components/action-pending";

export function AddFromCatalogButton({ masterTestId }: { masterTestId: string }) {
  const [pending, startTransition] = useTransition();
  const { setPending } = useActionPending();

  useEffect(() => {
    setPending(pending);
    return () => setPending(false);
  }, [pending, setPending]);

  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm font-medium text-emerald-800 hover:underline disabled:cursor-wait disabled:opacity-60 disabled:no-underline"
      onClick={() => {
        startTransition(async () => {
          const formData = new FormData();
          formData.set("masterTestId", masterTestId);
          await addFromCatalogAction(formData);
        });
      }}
    >
      {pending ? "Adding…" : "Add to lab"}
    </button>
  );
}
