"use client";

import { BookOpen, ShieldCheck, CreditCard, Wallet, Zap, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DocSection,
  InlineCode,
  Callout,
  CodeBlock,
  CodeBlockMulti,
  buildSnippets,
  SubHeading,
  StatusBadge,
} from "./code-block";

const chargeExample = {
  amount: 1500,
  currency: "EUR",
  payment_method_types: ["mb_way"],
  reference: "ORDER-2026-0001",
  customer: { name: "Cliente Exemplo", phone: "+351912345678" },
  metadata: { order_id: "ORDER-2026-0001" },
};

export function S2SCertifiedSection() {
  return (
    <>
      <DocSection id="overview" icon={BookOpen} title="Visão Geral S2S">
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="available">API v1 S2S Stable</StatusBadge>
            <StatusBadge variant="available">MB WAY E2E Certified</StatusBadge>
            <span className="text-xs text-muted-foreground">Atualizado em 08/09/2026</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Integração Server-to-Server para Merchants com checkout próprio. O endpoint oficial é <InlineCode>POST /api/v1/payments/charge</InlineCode>. A API Key identifica a Store; a Store define ambiente, routing e GatewayVault.
          </p>
        </Card>
        <Callout variant="security" title="Backend apenas">
          A API Key da Store nunca deve ser exposta no browser, app mobile ou código público. Envie apenas um método por request em <InlineCode>payment_method_types</InlineCode>; o runtime atual utiliza o primeiro item do array.
        </Callout>
      </DocSection>

      <DocSection id="auth" icon={ShieldCheck} title="Autenticação">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            Use Bearer Token. O header <InlineCode>x-api-key</InlineCode> permanece disponível por compatibilidade.
          </p>
        </Card>
        <SubHeading>Bearer Token</SubHeading>
        <CodeBlock lang="http" code={`Authorization: Bearer xp_live_********************************`} />
        <SubHeading>Sandbox</SubHeading>
        <CodeBlock lang="http" code={`Authorization: Bearer xp_test_********************************`} />
        <Callout variant="info" title="Scope e ambiente">
          A chave deve pertencer à Store correta e incluir <InlineCode>payments_write</InlineCode>. XPayments bloqueia API Key Test contra gateway Live e API Key Live contra gateway Test.
        </Callout>
      </DocSection>

      <DocSection id="payments" icon={CreditCard} title="Criar Pagamento">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            Envie o valor na menor unidade monetária. Exemplo: <InlineCode>1500</InlineCode> EUR representa €15,00. Use uma <InlineCode>reference</InlineCode> estável para o mesmo pedido e reutilize-a em retries.
          </p>
        </Card>
        <CodeBlockMulti snippets={buildSnippets("/payments/charge", chargeExample)} />
        <SubHeading>Resposta inicial MB WAY</SubHeading>
        <CodeBlock
          lang="json"
          code={`{
  "success": true,
  "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ORDER-2026-0001",
  "providerId": "pi_...",
  "status": "requires_action",
  "method": "mb_way",
  "action": {
    "type": "bank_app",
    "message": "Pedido MB WAY enviado. Confirme na aplicação."
  }
}`}
        />
        <Callout variant="warning" title="requires_action não significa pago">
          Nunca considere <InlineCode>requires_action</InlineCode>, um redirect ou o retorno ao site como confirmação financeira. O pedido deve ser marcado como pago apenas quando a Transaction/webhook XPayments estiver <InlineCode>succeeded</InlineCode>.
        </Callout>
      </DocSection>

      <DocSection id="methods" icon={Wallet} title="Métodos S2S — estado real">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Método</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Fluxo</th>
                <th className="px-4 py-2 font-medium">Requisito / Nota</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["MB WAY", "CERTIFIED E2E", "bank_app", "EUR · telefone PT válido"],
                ["Bizum", "STORE-DEPENDENT", "bank_app / redirect", "EUR · telefone ES · Store configurada"],
                ["Multibanco", "STORE-DEPENDENT", "reference", "EUR · Store configurada"],
                ["Card", "NOT YET DIRECT", "—", "Use Checkout XPay até existir tokenização/confirmation S2S dedicada"],
                ["Bancontact", "NOT YET DIRECT", "—", "Não publicar no S2S sem certificação dedicada"],
                ["BLIK", "NOT YET DIRECT", "—", "Ainda não publicado como contrato S2S ativo"],
                ["PIX", "PRIVATE ROLLOUT", "provider-specific", "MisticPay em integração multi-tenant; ainda não público"],
              ].map(([method, state, flow, requirement]) => (
                <tr key={method} className="border-b border-border/30">
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">{method}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">{state}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{flow}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{requirement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout variant="warning" title="Provider suporta ≠ S2S XPayments suporta">
          Um método disponível na conta Stripe subjacente só deve ser usado em <InlineCode>/payments/charge</InlineCode> quando existe tratamento completo de criação, confirmação, next_action e webhook no runtime XPayments.
        </Callout>
      </DocSection>

      <DocSection id="card" icon={AlertTriangle} title="Card em S2S">
        <Card className="border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-xl">
          <p className="text-sm leading-relaxed text-muted-foreground">
            O runtime atual aceita a string <InlineCode>card</InlineCode>, mas ainda não recebe um <InlineCode>payment_method</InlineCode> tokenizado, não confirma o PaymentIntent e não devolve um <InlineCode>client_secret</InlineCode> para o frontend do Merchant. Por isso <strong className="text-foreground">card não está certificado para uso S2S direto</strong>.
          </p>
        </Card>
        <SubHeading>Não utilizar como integração de produção</SubHeading>
        <CodeBlock
          lang="json"
          code={`{
  "amount": 500,
  "currency": "EUR",
  "payment_method_types": ["card"]
}`}
        />
        <Callout variant="info" title="Como aceitar cartões hoje">
          Utilize Checkout XPay Hosted/Embedded. A próxima versão S2S Card deverá trabalhar com PaymentMethod tokenizado + confirmação/SCA, sem exigir PAN/CVV bruto no endpoint Merchant API.
        </Callout>
      </DocSection>

      <DocSection id="webhooks" icon={Zap} title="Webhooks Merchant">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            Configure um endpoint HTTPS na Store para receber o estado definitivo. Responda HTTP 2xx rapidamente e trate retries de forma idempotente.
          </p>
        </Card>
        <SubHeading>Eventos principais</SubHeading>
        <CodeBlock
          lang="text"
          code={`payment_intent.succeeded
payment_intent.payment_failed
payment_intent.processing
payment_intent.canceled`}
        />
        <SubHeading>Payload normalizado</SubHeading>
        <CodeBlock
          lang="json"
          code={`{
  "event": "payment_intent.succeeded",
  "transaction_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ORDER-2026-0001",
  "amount": 15,
  "currency": "EUR",
  "status": "succeeded",
  "method": "mb_way",
  "timestamp": "2026-09-08T05:00:00.000Z"
}`}
        />
        <Callout variant="security" title="Assinatura Merchant">
          Quando a Store possui secret de webhook, valide o header <InlineCode>x-nexflowx-signature</InlineCode> com HMAC-SHA256 sobre o corpo bruto configurado para Merchant Delivery.
        </Callout>
        <Callout variant="warning" title="Idempotência">
          Deduplique por <InlineCode>event</InlineCode> + <InlineCode>transaction_id</InlineCode>. Não dependa de redirects, páginas de sucesso ou polling do browser para creditar pedidos.
        </Callout>
      </DocSection>
    </>
  );
}
