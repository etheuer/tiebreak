import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/AppShell";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const instrument = localFont({
  src: [
    { path: "./fonts/instrument-sans-400.ttf", weight: "400" },
    { path: "./fonts/instrument-sans-500.ttf", weight: "500" },
    { path: "./fonts/instrument-sans-600.ttf", weight: "600" },
    { path: "./fonts/instrument-sans-700.ttf", weight: "700" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - head to head product comparisons`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones, headphones, vacuums, air purifiers and credit cards.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} - head to head product comparisons`,
    description:
      "Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones, headphones, vacuums, air purifiers and credit cards.",
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={instrument.variable}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <AppShell market="us">{children}</AppShell>
      </body>
    </html>
  );
}
