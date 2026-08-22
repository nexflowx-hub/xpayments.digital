"use client";

import type { ReactNode } from "react";
import { Wallet, ArrowRight } from "lucide-react";
import {
  DocSection,
  InlineCode,
  Callout,
  CodeBlockMulti,
  buildSnippets,
  SubHeading,
  CodeBlock,
  StatusBadge,
} from "./code-block";

/* ------------------------------------------------------------------ */
/*  Matrix Table                                                       */
/* ------------------------------------------------------------------ */

const METHOD_MATRIX = [
  { method: "Card", region: "Global", currency: "Store currency", flow: "Direct / Action", badge: "available" as const },
  { method: "MB WAY", region: "Portugal", currency: "EUR", flow: "Bank App", badge: "available" as const },
  { method: "Multibanco", region: "Portugal", currency: "EUR", flow: "Reference", badge: "available" as const },
  { method: "Bizum", region: "Spain", currency: "EUR", flow: "Bank App", badge: "available" as const },
  { method: "BLIK", region: "Poland", currency: "PLN", flow: "Code + Bank App", badge: "available" as const },
  { method: "Bancontact", region: "Belgium", currency: "EUR", flow: "Redirect", badge: "available" as const },
  { method: "PIX", region: "Brazil", currency: "BRL", flow: "QR / Copy & Paste", badge: "new" as const },
  { method: "Revolut Pay", region: "Supported", currency: "Store", flow: "Redirect", badge: "store" as const },
  { method: "Amazon Pay", region: "Supported", currency: "Store", flow: "Redirect", badge: "store" as const },
  { method: "Satispay", region: "Supported", currency: "EUR", flow: "Redirect", badge: "store" as const },
];

/* ------------------------------------------------------------------ */
/*  Sub-component for each method                                      */
/* ------------------------------------------------------------------ */

function MethodBlock({
  id,
  title,
  badge,
  children,
}: {
  id: string;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        {badge}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Methods Section                                               */
/* ------------------------------------------------------------------ */

export function MethodsSection() {
  return (
    <DocSection id="methods" icon={Wallet} title="Métodos de Pagamento">
      {/* Matrix table */}
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Método</th>
              <th className="px-4 py-2 font-medium">Região</th>
              <th className="px-4 py-2 font-medium">Moeda</th>
              <th className="px-4 py-2 font-medium">Fluxo</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {METHOD_MATRIX.map((m) => (
              <tr key={m.method} className="border-b border-border/30">
                <td className="px-4 py-2.5 text-xs font-medium text-foreground">
                  {m.method}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.region}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.currency}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.flow}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge variant={m.badge}>
                    {m.badge === "available" ? "Available" : m.badge === "new" ? "NEW" : "Store dependent"}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout variant="info" title="Disponibilidade">
        A disponibilidade de cada método depende da configuração da Store. Consulte o seu
        gestor de conta para ativar métodos adicionais.
      </Callout>

      {/* ---- MB WAY ---- */}
      <MethodBlock id="method-mb-way" title="MB WAY">
        <p className="text-xs text-muted-foreground">
          Pagamento instantâneo via aplicação bancária. O cliente recebe uma notificação push
          e confirma o pagamento na app.
        </p>
        <CodeBlockMulti
          snippets={buildSnippets("/payments/charge", {
            amount: 1500,
            currency: "EUR",
            payment_method_types: ["mb_way"],
            reference: "ORDER-PT-2026-0184",
            customer: { name: "João Martins", phone: "912345678" },
          })}
        />
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
        <Callout variant="info" title="Formatos de telefone aceites">
          <InlineCode>912345678</InlineCode>, <InlineCode>351912345678</InlineCode>,{" "}
          <InlineCode>00351912345678</InlineCode>, <InlineCode>+351912345678</InlineCode>
        </Callout>
      </MethodBlock>

      {/* ---- Multibanco ---- */}
      <MethodBlock id="method-multibanco" title="Multibanco">
        <p className="text-xs text-muted-foreground">
          Pagamento por referência Multibanco. O cliente paga numa ATM Multibanco ou via
          homebanking com os dados fornecidos na resposta.
        </p>
        <CodeBlockMulti
          snippets={buildSnippets("/payments/charge", {
            amount: 3450,
            currency: "EUR",
            payment_method_types: ["multibanco"],
            reference: "ORDER-PT-2026-0184",
            customer: { email: "joao@example.com" },
          })}
        />
        <CodeBlock
          lang="json"
          code={`{
  "success": true,
  "transactionId": "tx_b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "reference": "ORDER-PT-2026-0184",
  "status": "pending",
  "method": "multibanco",
  "action": {
    "type": "multibanco_reference",
    "entidade": "21832",
    "referencia": "935 274 613",
    "montante": "34.50"
  }
}`}
        />
        <Callout variant="info" title="Campos da ação">
          Os campos retornados usam a nomenclatura PT: <InlineCode>entidade</InlineCode>,{" "}
          <InlineCode>referencia</InlineCode>, <InlineCode>montante</InlineCode>.
          O pagamento é confirmado assincronamente via webhook após o cliente pagar na ATM.
        </Callout>
      </MethodBlock>

      {/* ---- Bizum ---- */}
      <MethodBlock id="method-bizum" title="Bizum">
        <p className="text-xs text-muted-foreground">
          Pagamento instantâneo via Bizum. O cliente recebe uma notificação na app Bizum e
          confirma o pagamento.
        </p>
        <CodeBlockMulti
          snippets={buildSnippets("/payments/charge", {
            amount: 2500,
            currency: "EUR",
            payment_method_types: ["bizum"],
            reference: "ORDER-ES-2026-0331",
            customer: { name: "María García", phone: "612345678" },
          })}
        />
        <CodeBlock
          lang="json"
          code={`{
  "success": true,
  "transactionId": "tx_c3d4e5f6-a7b8-9012-cdef-123456789012",
  "reference": "ORDER-ES-2026-0331",
  "status": "requires_action",
  "method": "bizum",
  "action": {
    "type": "bank_app",
    "message": "Confirme o pagamento na sua aplicação Bizum."
  }
}`}
        />
        <Callout variant="info" title="Requisitos do Bizum">
          <ul className="list-disc pl-4 space-y-1">
            <li>Moeda obrigatória: <InlineCode>EUR</InlineCode></li>
            <li>Valor mínimo: €0,50 | Valor máximo: €5.000,00</li>
            <li>Formatos de telefone: <InlineCode>612345678</InlineCode>, <InlineCode>34612345678</InlineCode>, <InlineCode>+34612345678</InlineCode></li>
          </ul>
        </Callout>
      </MethodBlock>

      {/* ---- BLIK ---- */}
      <MethodBlock id="method-blik" title="BLIK">
        <p className="text-xs text-muted-foreground">
          Pagamento instantâneo via código BLIK de 6 dígitos. O cliente gera o código na app
          bancária e envia-o ao merchant.
        </p>
        <CodeBlockMulti
          snippets={buildSnippets("/payments/charge", {
            amount: 2500,
            currency: "PLN",
            payment_method_types: ["blik"],
            reference: "ORDER-PL-2026-0447",
            customer: { name: "Jan Kowalski" },
            payment_method_options: { blik: { code: "123456" } },
          })}
        />
        <CodeBlock
          lang="json"
          code={`{
  "success": true,
  "transactionId": "tx_d4e5f6a7-b8c9-0123-defa-234567890123",
  "reference": "ORDER-PL-2026-0447",
  "status": "requires_action",
  "method": "blik",
  "action": {
    "type": "bank_app",
    "message": "Confirme o pagamento na sua aplicação bancária.",
    "expiresInSeconds": 300
  }
}`}
        />
        <Callout variant="security" title="Códigos BLIK são efémeros">
          Os códigos BLIK são válidos apenas por um curto período (indicado por{" "}
          <InlineCode>expiresInSeconds</InlineCode>). Nunca armazene estes códigos em base
          de dados após a validação.
        </Callout>
        <Callout variant="info" title="Requisitos do BLIK">
          <ul className="list-disc pl-4 space-y-1">
            <li>Moeda obrigatória: <InlineCode>PLN</InlineCode></li>
            <li>Código BLIK de 6 dígitos via <InlineCode>payment_method_options.blik.code</InlineCode></li>
          </ul>
        </Callout>
      </MethodBlock>

      {/* ---- Bancontact ---- */}
      <MethodBlock id="method-bancontact" title="Bancontact">
        <p className="text-xs text-muted-foreground">
          Pagamento por redirecionamento. O cliente é redirecionado para o ambiente Bancontact
          para autenticar e confirmar o pagamento.
        </p>
        <CodeBlockMulti
          snippets={buildSnippets("/payments/charge", {
            amount: 1800,
            currency: "EUR",
            payment_method_types: ["bancontact"],
            reference: "ORDER-BE-2026-0078",
            customer: { name: "Pieter Janssen" },
            metadata: { return_url: "https://example.com/payment/return" },
          })}
        />
        <CodeBlock
          lang="json"
          code={`{
  "success": true,
  "transactionId": "tx_e5f6a7b8-c9d0-1234-efab-345678901234",
  "reference": "ORDER-BE-2026-0078",
  "status": "requires_action",
  "method": "bancontact",
  "action": {
    "type": "redirect",
    "url": "https://redirect.xpayments.digital/pay/bc_abc123"
  }
}`}
        />
        <Callout variant="warning" title="Requisitos do Bancontact">
          <ul className="list-disc pl-4 space-y-1">
            <li><InlineCode>customer.name</InlineCode> é obrigatório</li>
            <li><InlineCode>metadata.return_url</InlineCode> é obrigatório e deve ser HTTPS</li>
            <li>A confirmação final é enviada via webhook</li>
          </ul>
        </Callout>
      </MethodBlock>

      {/* ---- PIX ---- */}
      <MethodBlock
        id="method-pix"
        title="PIX"
        badge={<StatusBadge variant="new">NOVO</StatusBadge>}
      >
        <p className="text-xs text-muted-foreground">
          Pagamento instantâneo via PIX. O merchant recebe uma string PIX (EMV) e um QR code
          para apresentar ao cliente. O pagamento é confirmado via webhook.
        </p>
        <CodeBlockMulti
          snippets={buildSnippets("/payments/charge", {
            amount: 500,
            currency: "BRL",
            payment_method_types: ["pix"],
            reference: "ORDER-BR-2026-0092",
            customer: { name: "Ana Silva", document: "12345678901" },
          })}
        />
        <CodeBlock
          lang="json"
          code={`{
  "success": true,
  "transactionId": "tx_f6a7b8c9-d0e1-2345-fabc-456789012345",
  "reference": "ORDER-BR-2026-0092",
  "status": "pending",
  "method": "pix",
  "action": {
    "type": "pix",
    "copyPaste": "00020126580014br.gov.bcb.pix...",
    "pixString": "00020126580014br.gov.bcb.pix...",
    "qrCode": "data:image/png;base64,iVBORw0KGgo..."
  }
}`}
        />
        <SubHeading>Fluxo PIX</SubHeading>
        <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-2 text-xs min-w-[400px]">
            <div className="flex items-center gap-1">
              <StatusPill label="Criar Pagamento" color="bg-primary/10 text-primary border-primary/25" />
              <FlowArrow />
              <StatusPill label="Receber PIX" color="bg-violet-500/10 text-violet-400 border-violet-500/25" />
              <FlowArrow />
              <StatusPill label="Cliente Paga" color="bg-sky-500/10 text-sky-400 border-sky-500/25" />
              <FlowArrow />
              <StatusPill label="Webhook" color="bg-emerald-500/10 text-emerald-400 border-emerald-500/25" />
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span>POST /payments/charge</span>
              <span>copyPaste + qrCode</span>
              <span>App bancária do cliente</span>
              <span>payment_intent.succeeded</span>
            </div>
          </div>
        </div>
        <Callout variant="warning" title="Requisitos do PIX">
          <ul className="list-disc pl-4 space-y-1">
            <li>Moeda obrigatória: <InlineCode>BRL</InlineCode></li>
            <li><InlineCode>customer.name</InlineCode> é obrigatório</li>
            <li><InlineCode>customer.document</InlineCode> é obrigatório (CPF com 11 dígitos ou CNPJ com 14 dígitos)</li>
          </ul>
        </Callout>
        <Callout variant="security" title="Confirmação via Webhook">
          Não considere o pagamento como confirmado até receber o webhook{" "}
          <InlineCode>payment_intent.succeeded</InlineCode>.
        </Callout>
      </MethodBlock>

      {/* ---- Revolut Pay ---- */}
      <MethodBlock id="method-revolut-pay" title="Revolut Pay">
        <p className="text-xs text-muted-foreground">
          Pagamento por redirecionamento via Revolut Pay. O cliente é redirecionado para a
          interface Revolut para confirmar o pagamento.
        </p>
        <CodeBlockMulti
          snippets={buildSnippets("/payments/charge", {
            amount: 990,
            currency: "EUR",
            payment_method_types: ["revolut_pay"],
            reference: "ORDER-PT-2026-0201",
            customer: { name: "Pedro Santos", email: "pedro@example.com" },
            metadata: { return_url: "https://example.com/payment/return" },
          })}
        />
        <CodeBlock
          lang="json"
          code={`{
  "success": true,
  "transactionId": "tx_g7b8c9d0-e1f2-3456-abcd-567890123456",
  "reference": "ORDER-PT-2026-0201",
  "status": "requires_action",
  "method": "revolut_pay",
  "action": {
    "type": "redirect",
    "url": "https://redirect.xpayments.digital/pay/rv_xyz789"
  }
}`}
        />
        <Callout variant="info" title="Disponibilidade">
          A disponibilidade do Revolut Pay depende da configuração da Store. O{" "}
          <InlineCode>metadata.return_url</InlineCode> deve ser HTTPS.
        </Callout>
      </MethodBlock>

      {/* ---- Amazon Pay ---- */}
      <MethodBlock id="method-amazon-pay" title="Amazon Pay">
        <p className="text-xs text-muted-foreground">
          Pagamento por redirecionamento via Amazon Pay. O cliente é redirecionado para a
          interface Amazon para confirmar o pagamento.
        </p>
        <CodeBlockMulti
          snippets={buildSnippets("/payments/charge", {
            amount: 1990,
            currency: "EUR",
            payment_method_types: ["amazon_pay"],
            reference: "ORDER-PT-2026-0255",
            customer: { name: "Carlos Ferreira", email: "carlos@example.com" },
            metadata: { return_url: "https://example.com/payment/return" },
          })}
        />
        <CodeBlock
          lang="json"
          code={`{
  "success": true,
  "transactionId": "tx_h8c9d0e1-f2a3-4567-bcde-678901234567",
  "reference": "ORDER-PT-2026-0255",
  "status": "requires_action",
  "method": "amazon_pay",
  "action": {
    "type": "redirect",
    "url": "https://redirect.xpayments.digital/pay/am_abc456"
  }
}`}
        />
        <Callout variant="info" title="Disponibilidade">
          A disponibilidade do Amazon Pay depende da configuração da Store. O{" "}
          <InlineCode>metadata.return_url</InlineCode> deve ser HTTPS.
        </Callout>
      </MethodBlock>

      {/* ---- Satispay ---- */}
      <MethodBlock id="method-satispay" title="Satispay">
        <p className="text-xs text-muted-foreground">
          Pagamento por redirecionamento via Satispay. O cliente é redirecionado para a
          interface Satispay para confirmar o pagamento.
        </p>
        <CodeBlockMulti
          snippets={buildSnippets("/payments/charge", {
            amount: 750,
            currency: "EUR",
            payment_method_types: ["satispay"],
            reference: "ORDER-IT-2026-0103",
            customer: { name: "Marco Rossi", email: "marco@example.com" },
            metadata: { return_url: "https://example.com/payment/return" },
          })}
        />
        <CodeBlock
          lang="json"
          code={`{
  "success": true,
  "transactionId": "tx_i9d0e1f2-a3b4-5678-cdef-789012345678",
  "reference": "ORDER-IT-2026-0103",
  "status": "requires_action",
  "method": "satispay",
  "action": {
    "type": "redirect",
    "url": "https://redirect.xpayments.digital/pay/sp_def012"
  }
}`}
        />
        <Callout variant="info" title="Disponibilidade">
          A disponibilidade do Satispay depende da configuração da Store. A moeda suportada
          é EUR. O <InlineCode>metadata.return_url</InlineCode> deve ser HTTPS.
        </Callout>
      </MethodBlock>
    </DocSection>
  );
}

/* ---- Tiny helpers ---- */

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium whitespace-nowrap ${color}`}
    >
      {label}
    </span>
  );
}

function FlowArrow() {
  return <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />;
}
