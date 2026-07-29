import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default function InvoicePrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 print:bg-white">
      {children}
    </div>
  );
}
