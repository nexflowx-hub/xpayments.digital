"use client";

import { Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DocSection,
  InlineCode,
  Callout,
  SubHeading,
  CodeBlock,
} from "./code-block";

const WEBHOOK_PAYLOAD = `{
  "event": "payment_intent.succeeded",
  "transaction_id": "tx_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reference": "ORDER-PT-2026-0184",
  "amount": 15.00,
  "currency": "EUR",
  "status": "succeeded",
  "method": "mb_way",
  "timestamp": "2026-07-15T09:05:54.835Z"
}`;

const VERIFY_NODE = `const crypto = require("crypto");

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// No seu handler:
const signature = req.headers["x-nexflowx-signature"];
const rawBody = req.rawBody; // string bruta do request
const isValid = verifyWebhookSignature(rawBody, signature, process.env.XPAYMENTS_WEBHOOK_SECRET);

if (!isValid) {
  return res.status(401).json({ error: "Invalid signature" });
}

// Processar payload...`;

export function WebhooksSection() {
  return (
    <DocSection id="webhooks" icon={Zap} title="Webhooks">
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          Como os pagamentos podem ser assíncronos, a XPayments API envia notificações via
          POST para o webhook URL configurado na sua Store. Utilize webhooks para confirmar
          definitivamente o estado de uma transação.
        </p>
      </Card>

      <SubHeading>Eventos</SubHeading>
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="space-y-2">
          {[
            { event: "payment_intent.succeeded", desc: "Pagamento processado com sucesso.", color: "text-emerald-400 border-emerald-500/25 bg-emerald-500/8" },
            { event: "payment_intent.payment_failed", desc: "Pagamento falhou, expirou ou foi recusado.", color: "text-rose-400 border-rose-500/25 bg-rose-500/8" },
            { event: "payment_intent.processing", desc: "Pagamento em processamento.", color: "text-amber-400 border-amber-500/25 bg-amber-500/8" },
            { event: "payment_intent.canceled", desc: "Pagamento cancelado.", color: "text-muted-foreground border-border/40 bg-muted/30" },
          ].map((e) => (
            <div key={e.event} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${e.color}`}>
              <code className="text-xs font-medium text-foreground">{e.event}</code>
              <span className="text-xs text-muted-foreground">— {e.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      <SubHeading>Exemplo de Payload</SubHeading>
      <CodeBlock code={WEBHOOK_PAYLOAD} lang="json" />

      <Callout variant="warning" title="Nota sobre o campo amount">
        No webhook, o campo <InlineCode>amount</InlineCode> contém o valor monetário da transação
        (ex: <InlineCode>15.00</InlineCode> para €15,00). Isto difere do request de criação, onde
        o valor é enviado na menor unidade monetária (ex: <InlineCode>1500</InlineCode>).
      </Callout>

      <SubHeading>Verificação de Assinatura</SubHeading>
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="mb-3 text-sm text-muted-foreground">
          Cada webhook inclui o cabeçalho <InlineCode>x-nexflowx-signature</InlineCode> contendo
          uma assinatura HMAC-SHA256. Verifique esta assinatura para garantir a autenticidade do payload.
        </p>
        <CodeBlock code={VERIFY_NODE} lang="javascript" />
      </Card>

      <Callout variant="security" title="Sempre verifique a assinatura">
        Nunca processe um webhook sem verificar <InlineCode>x-nexflowx-signature</InlineCode>.
        Sem a verificação, qualquer pessoa pode enviar payloads falsos para o seu endpoint.
      </Callout>

      <SubHeading>Idempotência de Webhooks</SubHeading>
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          A XPayments pode reenviar webhooks se não receber uma resposta 2xx. Para evitar
          processamento duplicado, dedupe eventos usando a combinação{" "}
          <InlineCode>event</InlineCode> + <InlineCode>transaction_id</InlineCode>.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Campo</th>
                <th className="px-4 py-2 font-medium">Uso</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">event</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">Tipo de evento (ex: payment_intent.succeeded)</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">transaction_id</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">ID único da transação</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs text-primary">timestamp</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">Data/hora do evento (ISO 8601)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <SubHeading>Retries</SubHeading>
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          Se o seu endpoint não retornar um status HTTP 2xx, a XPayments tentará reenviar o webhook
          com backoff exponencial. Certifique-se de que o endpoint responde rapidamente e que
          o processamento pesado é feito de forma assíncrona.
        </p>
      </Card>

      <Callout variant="security" title="Não confirme pagamentos via redirect">
        Nunca considere o redirecionamento do cliente como confirmação financeira. Um redirect
        indica apenas que o cliente completou um passo no fluxo — a confirmação definitiva vem
        sempre através do webhook <InlineCode>payment_intent.succeeded</InlineCode>.
      </Callout>
    </DocSection>
  );
}
