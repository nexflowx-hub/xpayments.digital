"use client";

import * as React from "react";
import { CreditCard, ArrowRight } from "lucide-react";
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

export function PaymentsSection() {
  return (
    <DocSection id="payments" icon={CreditCard} title="Pagamentos">
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          O endpoint principal para criar pagamentos. A arquitetura segue o padrão PaymentIntent:
          o seu backend cria o pagamento, executa a ação necessária (se aplicável) e recebe a
          confirmação via webhook.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <MethodBadge method="POST" />
          <InlineCode>/payments/charge</InlineCode>
        </div>
      </Card>

      <SubHeading>Parâmetros</SubHeading>
      <ParamTable
        rows={[
          {
            name: "amount",
            type: "Integer",
            required: "Obrigatório",
            desc: "Valor na menor unidade da moeda (ex: 1500 = €15.00, 500 = R$5.00, 2500 = 25.00 PLN)",
          },
          {
            name: "currency",
            type: "String",
            required: "Obrigatório",
            desc: 'Código ISO 4217 (ex: "EUR", "BRL", "PLN")',
          },
          {
            name: "payment_method_types",
            type: "Array<String>",
            required: "Obrigatório",
            desc: 'Métodos aceites (ex: ["mb_way"], ["pix"], ["card"])',
          },
          {
            name: "reference",
            type: "String",
            required: "Recomendado",
            desc: "Referência única do pedido no seu sistema. Usada para idempotência.",
          },
          {
            name: "metadata",
            type: "Object",
            required: "Opcional",
            desc: "Dados customizados (return_url, order_id, etc.)",
          },
          {
            name: "customer",
            type: "Object",
            required: "Conforme método",
            desc: "Dados do cliente: name, phone, email, document (conforme método)",
          },
          {
            name: "payment_method_options",
            type: "Object",
            required: "Conforme método",
            desc: "Opções específicas do método (ex: blik.code)",
          },
        ]}
      />

      <Callout variant="info" title="Valores monetários">
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <InlineCode>1500</InlineCode> EUR = €15,00
          </li>
          <li>
            <InlineCode>500</InlineCode> BRL = R$5,00
          </li>
          <li>
            <InlineCode>2500</InlineCode> PLN = 25,00 PLN
          </li>
        </ul>
      </Callout>

      <SubHeading>Exemplo — MB WAY</SubHeading>
      <CodeBlockMulti
        snippets={buildSnippets("/payments/charge", {
          amount: 1500,
          currency: "EUR",
          payment_method_types: ["mb_way"],
          reference: "ORDER-PT-2026-0184",
          customer: { name: "João Martins", phone: "912345678" },
        })}
      />

      <SubHeading>Resposta</SubHeading>
      <CodeBlock
        lang="json"
        code={`{
  "success": true,
  "transactionId": "tx_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reference": "ORDER-PT-2026-0184",
  "status": "requires_action",
  "method": "mb_way",
  "action": {
    "type": "bank_app",
    "message": "Confirme o pagamento na sua aplicação bancária."
  }
}`}
      />

      <SubHeading>Modelo de Resposta</SubHeading>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Campo</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {[
              { field: "success", type: "Boolean", desc: "true se a requisição foi processada" },
              { field: "transactionId", type: "String", desc: "ID único da transação na XPayments" },
              { field: "reference", type: "String", desc: "Referência enviada no request" },
              { field: "status", type: "String", desc: "Estado atual da transação" },
              { field: "method", type: "String", desc: "Método de pagamento utilizado" },
              { field: "action", type: "Object", desc: "Ação a executar (se status = requires_action)" },
            ].map((r) => (
              <tr key={r.field} className="border-b border-border/30">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.field}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.type}</td>
                <td className="px-4 py-2.5 text-xs text-foreground">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading>Ciclo de Vida</SubHeading>
      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="mb-4 text-xs font-medium text-muted-foreground">
          Fluxo de estado de um pagamento:
        </p>
        <div className="flex flex-col items-center gap-3 text-xs min-w-[480px]">
          <div className="flex items-center gap-1">
            <StatusPill label="Create Payment" color="bg-primary/10 text-primary border-primary/25" />
            <FlowArrow />
            <StatusPill label="requires_action" color="bg-sky-500/10 text-sky-400 border-sky-500/25" />
            <FlowArrow />
            <StatusPill label="processing" color="bg-violet-500/10 text-violet-400 border-violet-500/25" />
            <FlowArrow />
            <StatusPill label="succeeded" color="bg-emerald-500/10 text-emerald-400 border-emerald-500/25" />
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-1">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-muted-foreground">requires_action</span>
              <span className="text-muted-foreground/40">→</span>
              <StatusPill label="requires_payment_method" color="bg-amber-500/8 text-amber-400 border-amber-500/25" />
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-muted-foreground">processing</span>
              <span className="text-muted-foreground/40">→</span>
              <StatusPill label="failed" color="bg-rose-500/8 text-rose-400 border-rose-500/25" />
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-muted-foreground">qualquer</span>
              <span className="text-muted-foreground/40">→</span>
              <StatusPill label="canceled" color="bg-muted/30 text-muted-foreground border-border/40" />
            </div>
          </div>
        </div>
      </div>

      <SubHeading>Estados</SubHeading>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { status: "requires_payment_method", desc: "Aguarda dados de pagamento.", color: "text-amber-400 border-amber-500/25 bg-amber-500/8" },
          { status: "requires_confirmation", desc: "Aguarda confirmação do merchant.", color: "text-amber-400 border-amber-500/25 bg-amber-500/8" },
          { status: "requires_action", desc: "Aguarda ação do cliente (ex: confirmar na app bancária).", color: "text-sky-400 border-sky-500/25 bg-sky-500/8" },
          { status: "processing", desc: "Pagamento em processamento pelo provedor.", color: "text-violet-400 border-violet-500/25 bg-violet-500/8" },
          { status: "requires_capture", desc: "Aguarda captura manual (reservado).", color: "text-amber-400 border-amber-500/25 bg-amber-500/8" },
          { status: "succeeded", desc: "Pagamento concluído com sucesso.", color: "text-emerald-400 border-emerald-500/25 bg-emerald-500/8" },
          { status: "canceled", desc: "Pagamento cancelado.", color: "text-muted-foreground border-border/40 bg-muted/30" },
          { status: "pending", desc: "Pagamento pendente (ex: aguardando pagamento Multibanco).", color: "text-amber-400 border-amber-500/25 bg-amber-500/8" },
          { status: "failed", desc: "Pagamento falhou permanentemente.", color: "text-rose-400 border-rose-500/25 bg-rose-500/8" },
        ].map((s) => (
          <div key={s.status} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${s.color}`}>
            <code className="text-[11px] font-mono font-medium shrink-0">{s.status}</code>
            <span className="text-[11px] text-muted-foreground">{s.desc}</span>
          </div>
        ))}
      </div>

      <SubHeading>Tipos de Action</SubHeading>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Métodos</th>
              <th className="px-4 py-2 font-medium">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {[
              { type: "bank_app", methods: "MB WAY, Bizum, BLIK", desc: "Cliente deve confirmar na app bancária" },
              { type: "multibanco_reference", methods: "Multibanco", desc: "Retorna entidade, referência e montante" },
              { type: "redirect", methods: "Bancontact, Revolut Pay, Amazon Pay, Satispay", desc: "Redireciona o cliente para o provedor" },
              { type: "pix", methods: "PIX", desc: "Retorna copyPaste e/ou qrCode" },
            ].map((a) => (
              <tr key={a.type} className="border-b border-border/30">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{a.type}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{a.methods}</td>
                <td className="px-4 py-2.5 text-xs text-foreground">{a.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading>Idempotência</SubHeading>
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          Utilize o campo <InlineCode>reference</InlineCode> para garantir idempotência. Se enviar
          a mesma referência duas vezes para o mesmo método e valor, a XPayments retorna a
          transação existente sem criar uma nova cobrança.
        </p>
      </Card>
    </DocSection>
  );
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium whitespace-nowrap ${color}`}>
      {label}
    </span>
  );
}

function FlowArrow() {
  return <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />;
}
