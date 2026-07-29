"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex w-full gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
      {items.map((item) => {
        const active =
          item.href === "/app" || item.href === "/super"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={[
              "inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-emerald-800 text-white"
                : "text-emerald-950/80 hover:bg-emerald-800/10 hover:text-emerald-950",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
