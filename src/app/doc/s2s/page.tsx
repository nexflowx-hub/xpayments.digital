import type { Metadata } from "next";
import S2SDocsPage from "@/components/public/s2s-docs-page";

export const metadata: Metadata = {
  title: "XPayments API S2S — Developer Guide",
  description:
    "Integração Server-to-Server XPayments: API Keys, pagamentos, MB WAY, Bizum, Multibanco, BLIK, Bancontact, Sandbox e Webhooks.",
  alternates: {
    canonical: "https://xpayments.digital/doc/s2s",
  },
};

export default function Page() {
  return <S2SDocsPage />;
}
