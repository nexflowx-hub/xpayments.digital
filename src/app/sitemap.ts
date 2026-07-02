import type { MetadataRoute } from "next";

const SITE = "https://xpayments.digital";
const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
