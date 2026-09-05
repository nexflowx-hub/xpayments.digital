"use client";

import { BookOpen, ShieldCheck, CreditCard, Wallet, Zap } from "lucide-react";
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
};

export function S2SCertifiedSection() {
  return (
    <>
      <DocSection id="overview" icon={BookOpen} title="Visão Geral S2S">
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="available">API v1 S2S Stable</StatusBadge>
            <span className="text-xs text-muted-foreground">Produção</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Integração Server-to-Server para criação de pagamentos a partir do backend do Merchant. O endpoint certificado é <InlineCode>POST /api/v1/payments/charge</InlineCode>.
          </p>
        </Card>
        <Callout variant="security" title="Backend apenas">
          A API Key da Store nunca deve ser exposta no browser, aplicações mobile ou código público.
        </Callout>
      </DocSection>

      <DocSection id="auth" icon={ShieldCheck} title="Autenticação">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            O formato recomendado é Bearer Token. O header <InlineCode>x-api-key</InlineCode> permanece disponível para compatibilidade.
          </p>
        </Card>
        <SubHeading>Bearer Token</SubHeading>
        <CodeBlock lang="http" code={`Authorization: Bearer xp_live_********************************`} />
        <SubHeading>Compatibilidade</SubHeading>
        <CodeBlock lang="http" code={`x-api-key: xp_live_********************************`} />
        <Callout variant="info" title="Scope obrigatório">
          A chave utilizada para criar pagamentos deve pertencer à Store correta e incluir <InlineCode>payments_write</InlineCode>.
        </Callout>
      </DocSection>

      <DocSection id="payments" icon={CreditCard} title="Criar Pagamento">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            Envie o valor na menor unidade monetária. Por exemplo, <InlineCode>1500</InlineCode> em EUR representa €15,00.
          </p>
        </Card>
        <CodeBlockMulti snippets={buildSnippets("/payments/charge", chargeExample)} />
        <SubHeading>Resposta base</SubHeading>
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
    "message": "Pedido enviado. Confirme na aplicação."
  }
}`}
        />
        <Callout variant="warning" title="Confirmação definitiva">
          Nunca considere <InlineCode>requires_action</InlineCode>, um redirect ou o regresso ao <InlineCode>return_url</InlineCode> como pagamento concluído. A confirmação financeira definitiva chega pelo webhook <InlineCode>payment_intent.succeeded</InlineCode>.
        </Callout>
      </DocSection>

      <DocSection id="methods" icon={Wallet} title="Métodos S2S">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Método</th>
                <th className="px-4 py-2 font-medium">Moeda</th>
                <th className="px-4 py-2 font-medium">Fluxo</th>
                <th className="px-4 py-2 font-medium">Requisito</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["MB WAY", "EUR", "bank_app", "Telefone válido"],
                ["Bizum", "EUR", "bank_app", "Telefone espanhol"],
                ["Multibanco", "EUR", "multibanco_reference", "Email do cliente"],
                ["Bancontact", "EUR", "redirect", "Nome + return_url HTTPS"],
                ["BLIK", "PLN", "bank_app", "Código de 6 dígitos"],
              ].map(([method, currency, flow, requirement]) => (
                <tr key={method} className="border-b border-border/30">
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">{method}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{currency}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{flow}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{requirement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout variant="info" title="Detalhes e simuladores">
          Os exemplos completos, respostas e dados Sandbox de cada método encontram-se na secção técnica detalhada que está a ser atualizada para esta versão certificada.
        </Callout>
      </DocSection>

      <DocSection id="webhooks" icon={Zap} title="Webhooks Merchant">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            Configure um endpoint HTTPS na Store para receber o estado definitivo das transações.
          </p>
        </Card>
        <SubHeading>Eventos</SubHeading>
        <CodeBlock
          lang="text"
          code={`payment_intent.succeeded
payment_intent.payment_failed
payment_intent.processing
payment_intent.canceled`}
        />
        <SubHeading>Payload</SubHeading>
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
  "timestamp": "2026-09-05T04:30:00.000Z"
}`}
        />
        <Callout variant="info" title="Unidade do amount no webhook">
          No request de criação o valor é enviado na menor unidade monetária; no webhook <InlineCode>amount</InlineCode> é o valor monetário principal. Exemplo: request <InlineCode>1500</InlineCode> EUR → webhook <InlineCode>15</InlineCode> EUR.
        </Callout>
        <Callout variant="security" title="Assinatura">
          Quando a Store possui secret de webhook, valide o header <InlineCode>x-nexflowx-signature</InlineCode> com HMAC-SHA256 sobre o corpo JSON bruto recebido.
        </Callout>
        <Callout variant="warning" title="Entrega e idempotência">
          Responda HTTP 2xx rapidamente e deduplique pelo par <InlineCode>event</InlineCode> + <InlineCode>transaction_id</InlineCode>. Não dependa de redirects para confirmar pagamentos.
        </Callout>
      </DocSection>
    </>
  );
}
