import Link from "next/link";

/** Keep PDF links same-origin on the web app; proxies forward auth to the API. */
export function PdfDownloadLink({
  href,
  children = "Download PDF",
  variant = "primary",
}: {
  href: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex min-h-10 items-center rounded-lg bg-emerald-950 px-3 text-sm font-medium text-white hover:bg-emerald-900"
      : "inline-flex min-h-10 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-50";

  return (
    <Link href={href} prefetch={false} className={className}>
      {children}
    </Link>
  );
}
