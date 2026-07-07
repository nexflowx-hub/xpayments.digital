import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://xpayments.digital";
const APP_NAME = "XPayments";
const APP_DESCRIPTION =
  "XPayments is the enterprise fintech platform for global payments, FX, treasury and risk. Accept cards, Pix, MBWay and crypto with one unified API. PCI DSS Level 1, SOC 2 Type II, 99.99% uptime.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "XPayments — Enterprise Payments Infrastructure",
    template: "%s · XPayments",
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  generator: "Next.js",
  keywords: [
    "XPayments",
    "payments",
    "payment API",
    "fintech",
    "payment gateway",
    "Pix",
    "MBWay",
    "crypto payments",
    "treasury",
    "FX",
    "foreign exchange",
    "risk management",
    "payment processing",
    "merchant account",
    "payment orchestration",
    "Stripe alternative",
    "Adyen alternative",
    "open banking",
    "chargeback protection",
    "PCI DSS",
    "SOC 2",
  ],
  authors: [{ name: "XPayments, Inc.", url: SITE_URL }],
  creator: "XPayments, Inc.",
  publisher: "XPayments, Inc.",
  category: "Finance",
  classification: "Financial Services / Payments Infrastructure",

  alternates: {
    canonical: SITE_URL,
    languages: {
      "en": SITE_URL,
      "pt-BR": `${SITE_URL}/?lang=pt-BR`,
      "fr": `${SITE_URL}/?lang=fr`,
      "es": `${SITE_URL}/?lang=es`,
      "x-default": SITE_URL,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["pt_BR", "fr_FR", "es_ES"],
    url: SITE_URL,
    siteName: APP_NAME,
    title: "XPayments — Enterprise Payments Infrastructure",
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "XPayments — Enterprise Payments Infrastructure",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@xpayments",
    creator: "@xpayments",
    title: "XPayments — Enterprise Payments Infrastructure",
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.svg"],
  },

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
    startupImage: ["/apple-touch-icon.png"],
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  verification: {
    // Replace with real codes when available
    google: "verify-google-xpayments",
  },

  other: {
    // JSON-LD structured data
    "application-name": APP_NAME,
    "theme-color": "#0B1220",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  colorScheme: "dark light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "XPayments, Inc.",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description: APP_DESCRIPTION,
      sameAs: [
        "https://twitter.com/xpayments",
        "https://github.com/nexflowx-hub/xpayments.digital",
        "https://www.linkedin.com/company/xpayments",
      ],
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: APP_NAME,
      url: SITE_URL,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, iOS, Android",
      description: APP_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
      },
      featureList: [
        "Accept cards, Pix, MBWay, Apple Pay, Google Pay and crypto",
        "Multi-currency wallets (EUR, USD, BRL, GBP, USDT, BTC)",
        "FX & treasury management",
        "Real-time risk engine with chargeback protection",
        "Developer portal with API keys, webhooks and SDKs",
        "Commerce: stores, products, payment links, invoices, subscriptions",
        "Admin platform: merchant management, KYC, system health",
        "PCI DSS Level 1, SOC 2 Type II compliant",
      ],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: APP_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
