import type { MetadataRoute } from "next";

const APP_NAME = "XPayments";
const APP_SHORT_NAME = "XPayments";
const APP_DESCRIPTION =
  "XPayments is the enterprise fintech platform for global payments, FX, treasury and risk. Accept cards, Pix, MBWay and crypto with one API.";
const THEME_COLOR = "#0B1220";
const BACKGROUND_COLOR = "#0B1220";
const START_URL = "/";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — Enterprise Payments Infrastructure`,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    id: START_URL,
    start_url: START_URL,
    scope: START_URL,
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    categories: ["finance", "business", "productivity", "developer"],
    lang: "en",
    dir: "ltr",
    prefer_related_applications: false,
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Open the merchant dashboard overview",
        url: "/?view=dashboard",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Payments",
        short_name: "Payments",
        description: "View transactions",
        url: "/?view=payments",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Wallets",
        short_name: "Wallets",
        description: "View wallet balances",
        url: "/?view=wallets",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
