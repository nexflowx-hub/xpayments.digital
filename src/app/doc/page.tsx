import type { Metadata } from "next";
import S2SDocsPage from "@/components/public/s2s-docs-page";

export const metadata: Metadata = {
  title: "XPayments Developer Docs — API S2S",
  description:
    "Guia público de integração da API XPayments S2S: autenticação, API Keys, MB WAY, Bizum, Multibanco, Bancontact, BLIK, Sandbox e Webhooks.",
  alternates: {
    canonical: "https://xpayments.digital/doc",
  },
  openGraph: {
    title: "XPayments Developer Docs — API S2S",
    description:
      "Integre pagamentos Server-to-Server com XPayments. Exemplos, Sandbox, API Keys e Webhooks.",
    url: "https://xpayments.digital/doc",
    siteName: "XPayments",
    type: "website",
  },
};

export default function Page() {
  return <S2SDocsPage />;
}
