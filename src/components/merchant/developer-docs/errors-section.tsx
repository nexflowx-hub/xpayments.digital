"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DocSection,
  InlineCode,
  Callout,
  SubHeading,
  CodeBlock,
} from "./code-block";

const ERROR_OBJECT = `{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição legível do erro."
  }
}`;

interface ErrorRow {
  code: string;
  message: string;
}

const COMMON_ERRORS: ErrorRow[] = [
  { code: "API_KEY_REQUIRED", message: "Cabeçalho de autenticação ausente." },
  { code: "ACCESS_DENIED", message: "Credenciais inválidas ou sem permissão." },
  { code: "INSUFFICIENT_SCOPE", message: "A API Key não possui o scope payments_write." },
  { code: "INVALID_AMOUNT", message: "O valor do pagamento é inválido (ex: zero, negativo)." },
  { code: "INVALID_CURRENCY", message: "A moeda não é suportada pelo método selecionado." },
  { code: "TRANSACTION_ALREADY_PAID", message: "Esta transação já foi paga ou está em processamento." },
];

const MBWAY_ERRORS: ErrorRow[] = [
  { code: "INVALID_MBWAY_PHONE", message: "Número de telefone inválido para MB WAY." },
];

const BIZUM_ERRORS: ErrorRow[] = [
  { code: "BIZUM_EUR_REQUIRED", message: "Bizum requer a moeda EUR." },
  { code: "BIZUM_AMOUNT_OUT_OF_RANGE", message: "O valor deve estar entre €0,50 e €5.000,00." },
  { code: "INVALID_BIZUM_PHONE", message: "Número de telefone inválido para Bizum." },
];

const BLIK_ERRORS: ErrorRow[] = [
  { code: "BLIK_PLN_REQUIRED", message: "BLIK requer a moeda PLN." },
  { code: "INVALID_BLIK_CODE", message: "Código BLIK inválido (deve ter 6 dígitos)." },
];

const BANCONTACT_ERRORS: ErrorRow[] = [
  { code: "RETURN_URL_REQUIRED", message: "metadata.return_url é obrigatório para Bancontact." },
  { code: "PAYMENT_METHOD_EUR_REQUIRED", message: "Bancontact requer a moeda EUR." },
  { code: "BANCONTACT_NAME_REQUIRED", message: "customer.name é obrigatório para Bancontact." },
];

const PIX_ERRORS: ErrorRow[] = [
  { code: "PIX_BRL_REQUIRED", message: "PIX requer a moeda BRL." },
  { code: "PIX_PAYER_NAME_REQUIRED", message: "customer.name é obrigatório para PIX." },
  { code: "PIX_PAYER_DOCUMENT_REQUIRED", message: "customer.document é obrigatório para PIX (CPF ou CNPJ)." },
  { code: "PIX_GATEWAY_NOT_CONFIGURED", message: "Gateway PIX não configurado para esta Store." },
  { code: "PIX_ROUTING_NOT_CONFIGURED", message: "Routing PIX não configurado para esta Store." },
  { code: "STORE_CURRENCY_MISMATCH", message: "Moeda da Store incompatível com PIX (BRL)." },
  { code: "PIX_PROVIDER_UNAVAILABLE", message: "Serviço PIX temporariamente indisponível." },
  { code: "PIX_PROVIDER_ERROR", message: "Erro do provedor de pagamento." },
  { code: "PIX_INVALID_PROVIDER_RESPONSE", message: "Resposta inválida do provedor de pagamento." },
  { code: "PIX_PROCESSING_ERROR", message: "Erro interno no processamento do pagamento PIX." },
];

function ErrorTable({ rows }: { rows: ErrorRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">Código</th>
            <th className="px-4 py-2 font-medium">Descrição</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code} className="border-b border-border/30">
              <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.code}</td>
              <td className="px-4 py-2.5 text-xs text-foreground">{r.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ErrorsSection() {
  return (
    <DocSection id="errors" icon={AlertTriangle} title="Erros">
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          Quando uma requisição falha, a XPayments API retorna um objeto de erro padronizado:
        </p>
        <div className="mt-3">
          <CodeBlock code={ERROR_OBJECT} lang="json" />
        </div>
      </Card>

      <SubHeading>Erros Comuns</SubHeading>
      <ErrorTable rows={COMMON_ERRORS} />

      <SubHeading>Erros por Método de Pagamento</SubHeading>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">MB WAY</p>
          <ErrorTable rows={MBWAY_ERRORS} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Bizum</p>
          <ErrorTable rows={BIZUM_ERRORS} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">BLIK</p>
          <ErrorTable rows={BLIK_ERRORS} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Bancontact</p>
          <ErrorTable rows={BANCONTACT_ERRORS} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">PIX</p>
          <ErrorTable rows={PIX_ERRORS} />
        </div>
      </div>
    </DocSection>
  );
}
