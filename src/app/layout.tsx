import type { Metadata } from "next";
import { IBM_Plex_Sans, Fraunces } from "next/font/google";
import { NavProgress } from "@/components/nav-progress";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans-app",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LabSaaS — Pathology reports & invoicing",
  description: "Accessible multi-tenant lab reporting, PDF export, and invoicing",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full font-[family-name:var(--font-sans-app)] antialiased">
        <NavProgress />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
