import type { Metadata } from "next";
import S2SDocsV2 from "@/components/public/s2s-docs-v2";

export const metadata: Metadata = {
  title: "XPayments API S2S — Certified Developer Guide",
  description:
    "Integração Server-to-Server XPayments: API Keys, pagamentos, MB WAY, métodos disponíveis, estados, webhooks, segurança e limites atuais do fluxo card.",
  alternates: {
    canonical: "https://xpayments.digital/doc/s2s",
  },
};

export default function Page() {
  return <S2SDocsV2 />;
}
