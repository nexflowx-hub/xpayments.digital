"use client";

import { ExternalLink, MonitorUp, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DocSection,
  InlineCode,
  Callout,
  MethodBadge,
  CodeBlockMulti,
  buildSnippets,
  SubHeading,
  ParamTable,
  CodeBlock,
  StatusBadge,
} from "./code-block";

const createSessionExample = {
  amount: 2510,
  currency: "EUR",
  reference: "ORDER-PT-2026-0184",
  customerEmail: "joao@example.com",
  returnUrl: "https://merchant.example/payments/result",
  allowedOrigin: "https://merchant.example",
  expiresInMinutes: 30,
  metadata: {
    customerName: "João Martins",
    description: "Pedido #0184",
  },
};

export function CheckoutSection() {
  return (
    <DocSection id="checkout" icon={ExternalLink} title="Checkout XPay — Hosted & Embedded">
      <Card className="border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant="available">Hosted E2E Certified</StatusBadge>
          <StatusBadge variant="available">Embedded Route Active</StatusBadge>
          <span className="text-xs text-muted-foreground">Mesmo core financeiro do S2S</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Crie uma CheckoutSession no backend do Merchant. A resposta devolve <InlineCode>checkoutUrl</InlineCode> para Redirect/Hosted e <InlineCode>embedUrl</InlineCode> para iframe/SDK. Ambos usam a mesma Store, routing, GatewayVault, Transaction, ledger e webhooks.
        </p>
      </Card>

      <SubHeading>Criar CheckoutSession</SubHeading>
      <div className="flex items-center gap-2">
        <MethodBadge method="POST" />
        <InlineCode>/api/v1/checkout/session</InlineCode>
      </div>

      <ParamTable
        rows={[
          { name: "amount", type: "Integer", required: "Obrigatório", desc: "Valor na menor unidade da moeda. 2510 EUR = €25,10" },
          { name: "currency", type: "String", required: "Obrigatório", desc: "ISO 4217, por exemplo EUR" },
          { name: "reference", type: "String", required: "Recomendado", desc: "Referência única do pedido no Merchant" },
          { name: "customerEmail", type: "String", required: "Opcional", desc: "Email do comprador" },
          { name: "returnUrl", type: "HTTPS URL", required: "Opcional", desc: "Destino UX depois do pagamento" },
          { name: "allowedOrigin", type: "HTTPS Origin", required: "Opcional", desc: "Origem autorizada para integração Embedded" },
          { name: "expiresInMinutes", type: "Integer", required: "Opcional", desc: "Entre 5 e 1440 minutos; default 30" },
          { name: "metadata", type: "Object", required: "Opcional", desc: "description, customerName e dados de rastreio" },
        ]}
      />

      <SubHeading>Exemplo</SubHeading>
      <CodeBlockMulti snippets={buildSnippets("/checkout/session", createSessionExample)} />

      <SubHeading>Resposta 201 Created</SubHeading>
      <CodeBlock
        lang="json"
        code={`{
  "success": true,
  "data": {
    "sessionId": "3cb4c392-f084-4778-97cc-a733921c8c6c",
    "checkoutUrl": "https://checkout.xpayments.digital/pay/3cb4c392-f084-4778-97cc-a733921c8c6c",
    "embedUrl": "https://checkout.xpayments.digital/embed/3cb4c392-f084-4778-97cc-a733921c8c6c",
    "expiresAt": "2026-09-08T03:20:27.233Z"
  }
}`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><ExternalLink className="h-4 w-4 text-primary" /> Hosted / Redirect</div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Redirecione o browser para <InlineCode>checkoutUrl</InlineCode>. A XPayments apresenta branding, métodos ativos e acompanha o estado da CheckoutSession.
          </p>
        </Card>
        <Card className="border-border/60 bg-card/60 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><MonitorUp className="h-4 w-4 text-primary" /> Embedded / iframe</div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Use <InlineCode>embedUrl</InlineCode> diretamente ou o SDK público quando disponibilizado para a integração. A origem do Merchant deve corresponder à configuração da sessão/Store.
          </p>
        </Card>
      </div>

      <SubHeading>Consultar estado da sessão</SubHeading>
      <CodeBlock lang="http" code={`GET /api/v1/checkout/session/{sessionId}`} />
      <CodeBlock
        lang="json"
        code={`{
  "success": true,
  "data": {
    "sessionId": "...",
    "storeName": "Merchant Display Name",
    "amount": 25.1,
    "currency": "EUR",
    "status": "succeeded",
    "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "paymentMethods": [
      { "code": "mb_way", "label": "MB WAY" },
      { "code": "card", "label": "Cartão" }
    ]
  }
}`}
      />

      <Callout variant="warning" title="Não confirme pelo browser">
        O retorno ao <InlineCode>returnUrl</InlineCode>, o fecho do modal ou uma página de sucesso são estados de UX. Confirme o pedido no backend pelo webhook Merchant ou por estado XPayments <InlineCode>succeeded</InlineCode>.
      </Callout>

      <Callout variant="info" title="O Merchant normalmente não chama /checkout/initiate">
        O endpoint <InlineCode>POST /api/v1/checkout/initiate</InlineCode> é usado pela própria experiência Checkout para iniciar o método escolhido. Para uma integração normal, o Merchant cria a CheckoutSession e abre <InlineCode>checkoutUrl</InlineCode> ou <InlineCode>embedUrl</InlineCode>.
      </Callout>

      <SubHeading>S2S vs Checkout XPay</SubHeading>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Característica</th>
              <th className="px-4 py-2 font-medium">API S2S</th>
              <th className="px-4 py-2 font-medium">Checkout XPay</th>
            </tr>
          </thead>
          <tbody>
            {[
              { feat: "UI", s2s: "Merchant", hosted: "XPayments / white-label" },
              { feat: "Card/Wallets hoje", s2s: "Não certificado direto", hosted: "Recomendado" },
              { feat: "Métodos locais", s2s: "Apenas matriz S2S ativa", hosted: "Conforme Store" },
              { feat: "Ação do método", s2s: "Merchant implementa", hosted: "Checkout implementa" },
              { feat: "Confirmação final", s2s: "Webhook/Transaction", hosted: "Webhook/Transaction" },
              { feat: "Core financeiro", s2s: "XPayments", hosted: "XPayments" },
            ].map((r) => (
              <tr key={r.feat} className="border-b border-border/30">
                <td className="px-4 py-2.5 text-xs font-medium text-foreground">{r.feat}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.s2s}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.hosted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="inline-flex items-center gap-1.5 text-xs leading-5 text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> Fluxo Hosted validado: CheckoutSession → MB WAY → shared GatewayVault → signed webhook → Transaction succeeded → WalletMovement.
        </p>
      </Card>
    </DocSection>
  );
}
