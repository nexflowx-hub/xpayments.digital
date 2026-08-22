"use client";

import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DocSection,
  InlineCode,
  Callout,
  CodeBlock,
  SubHeading,
} from "./code-block";

export function AuthSection() {
  return (
    <DocSection id="auth" icon={ShieldCheck} title="Autenticação">
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          Todas as requisições à XPayments API devem incluir um cabeçalho de autenticação. O
          formato recomendado é <InlineCode>Bearer Token</InlineCode>. A autenticação via{" "}
          <InlineCode>x-api-key</InlineCode> é suportada para compatibilidade legada.
        </p>
      </Card>

      <SubHeading>Bearer Token (Recomendado)</SubHeading>
      <CodeBlock
        lang="http"
        code={`Authorization: Bearer xp_live_********************************`}
      />

      <Callout variant="info" title="Obter a API Key">
        As API Keys são geradas no painel da Store e estão associadas a scopes específicos.
        O scope necessário para criar pagamentos é <InlineCode>payments_write</InlineCode>.
      </Callout>

      <SubHeading>Header Legado</SubHeading>
      <CodeBlock
        lang="http"
        code={`x-api-key: xp_live_********************************`}
      />
      <p className="text-xs text-muted-foreground">
        O formato <InlineCode>x-api-key</InlineCode> continua funcional, mas o formato Bearer
        é o recomendado para novas integrações.
      </p>

      <SubHeading>Exemplo de Requisição Autenticada</SubHeading>
      <CodeBlock
        lang="bash"
        code={`curl -X GET \\
  https://api.xpayments.digital/api/v1/payments/tx_a1b2c3d4 \\
  -H "Authorization: Bearer xp_live_xxxxxxxxx" \\
  -H "Content-Type: application/json"`}
      />

      <Callout variant="security" title="Segurança da API Key">
        Nunca exponha a sua API Key no frontend, browser, aplicações mobile ou repositórios
        públicos. Mantenha-a sempre em variáveis de ambiente no servidor.
      </Callout>

      <Callout variant="warning" title="Credenciais por Store">
        Cada Store possui as suas próprias API Keys. Garanta que está a utilizar a chave
        correta para a Store pretendida. Mantenha credenciais de Live e Teste completamente
        separadas.
      </Callout>
    </DocSection>
  );
}
