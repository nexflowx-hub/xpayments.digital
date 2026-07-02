import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XPayments — Enterprise Payments Infrastructure",
  description:
    "XPayments is the enterprise fintech platform for global payments, FX, treasury and risk. Accept cards, Pix, MBWay and crypto with one API.",
  keywords: [
    "XPayments",
    "payments",
    "fintech",
    "payment API",
    "Pix",
    "MBWay",
    "treasury",
    "FX",
  ],
  authors: [{ name: "XPayments" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "XPayments — Enterprise Payments Infrastructure",
    description:
      "Global payments, FX, treasury and risk in one enterprise platform.",
    siteName: "XPayments",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppProviders>{children}</AppProviders>
        <Toaster />
        <SonnerToaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
