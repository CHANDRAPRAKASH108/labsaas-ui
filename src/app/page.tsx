import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/logo";

export default async function HomePage() {
  const session = await getSession();
  if (session?.role === "SUPER_ADMIN" && !session.impersonatingClientId) {
    redirect("/super");
  }
  if (session) redirect("/app");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06261f] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(45,212,191,0.28), transparent 42%), radial-gradient(circle at 85% 10%, rgba(56,189,248,0.18), transparent 36%), linear-gradient(165deg,#06261f,#0d3d34 52%,#06261f)",
        }}
      />
      <a href="#hero" className="skip-link">
        Skip to content
      </a>
      <main
        id="hero"
        className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16"
      >
        <Logo href={null} size="lg" tone="dark" className="mb-5" />
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Clear reports and invoices for busy pathology labs.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-teal-50/80">
          Configurable tests, accessible workflows, branded PDFs, and multi-tenant control —
          built for technicians, pathologists, and front-desk staff.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-lg bg-sky-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-200"
          >
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
