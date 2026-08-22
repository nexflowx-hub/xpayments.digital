"use client";

import { ExternalLink } from "lucide-react";
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
} from "./code-block";

export function CheckoutSection() {
  return (
    <DocSection id="checkout" icon={ExternalLink} title="Checkout">
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          O Checkout Hosted permite que a XPayments gere a interface de pagamento. Ideal para
          integrações rápidas onde não é necessário controlo total sobre a experiência de checkout.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <MethodBadge method="POST" />
          <InlineCode>/checkout/session</InlineCode>
        </div>
      </Card>

      <SubHeading>Parâmetros</SubHeading>
      <ParamTable
        rows={[
          { name: "amount", type: "Integer", required: "Obrigatório", desc: "Valor na menor unidade da moeda" },
          { name: "currency", type: "String", required: "Obrigatório", desc: 'Código ISO 4217 (ex: "EUR")' },
          { name: "metadata", type: "Object", required: "Opcional", desc: "Dados customizados (order_id, etc.)" },
          { name: "customer", type: "Object", required: "Opcional", desc: "Dados do cliente: name, email" },
        ]}
      />

      <SubHeading>Exemplo</SubHeading>
      <CodeBlockMulti
        snippets={buildSnippets("/checkout/session", {
          amount: 2510,
          currency: "EUR",
          metadata: { order_id: "ORDER-PT-2026-0184" },
          customer: { name: "João Martins", email: "joao@example.com" },
        })}
      />

      <SubHeading>Resposta</SubHeading>
      <CodeBlock
        lang="json"
        code={`{
  "success": true,
  "sessionId": "cs_x1y2z3a4b5c6d7e8",
  "url": "https://checkout.xpayments.digital?session=cs_x1y2z3a4b5c6d7e8"
}`}
      />

      <Callout variant="info" title="Checkout URL">
        O campo <InlineCode>url</InlineCode> aponta para <InlineCode>https://checkout.xpayments.digital</InlineCode>.
        Redirecione o cliente para este URL para iniciar o processo de pagamento.
      </Callout>

      <SubHeading>S2S vs Checkout Hosted</SubHeading>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Característica</th>
              <th className="px-4 py-2 font-medium">API S2S</th>
              <th className="px-4 py-2 font-medium">Checkout Hosted</th>
            </tr>
          </thead>
          <tbody>
            {[
              { feat: "Controlo da UI", s2s: "Total", hosted: "Limitado" },
              { feat: "Implementação", s2s: "Complexa", hosted: "Simples" },
              { feat: "Dados sensíveis", s2s: "No seu backend", hosted: "Geridos pela XPayments" },
              { feat: "Métodos suportados", s2s: "Todos", hosted: "Conforme Store" },
              { feat: "Customização", s2s: "Completa", hosted: "Limitada" },
              { feat: "Ideal para", s2s: "Experiência customizada", hosted: "Integração rápida" },
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
    </DocSection>
  );
}
