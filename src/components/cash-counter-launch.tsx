"use client";

import { useRouter } from "next/navigation";

/** Focused billing counter entry (fullscreen desk flow). Esc returns to dashboard. */
export const BILLING_COUNTER_HREF = "/app/orders/new?focus=1&returnTo=/app";

export async function openBillingCounter(
  push: (href: string) => void,
  href: string = BILLING_COUNTER_HREF,
) {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    // Overlay focus on the counter page still works without browser fullscreen.
  }
  push(href);
}

/** Dashboard launch: enter browser fullscreen (same document), then open the counter. */
export function CashCounterLaunch({
  href = BILLING_COUNTER_HREF,
}: {
  href?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => void openBillingCounter((h) => router.push(h), href)}
      className="group flex w-full flex-col items-start gap-2 rounded-[var(--radius)] border border-teal-800/20 bg-teal-900 p-5 text-left text-white shadow-[var(--shadow)] transition hover:bg-teal-800"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-teal-100/80">
        Front desk
      </span>
      <span className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
        Billing counter
      </span>
      <span className="text-sm text-teal-50/85">
        Patient → tests → payment → share invoice. Opens full screen; press Esc to return here.
      </span>
      <span className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-white/15 px-3 text-sm font-semibold group-hover:bg-white/25">
        Open counter
      </span>
    </button>
  );
}
