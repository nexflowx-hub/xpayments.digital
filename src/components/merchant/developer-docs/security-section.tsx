"use client";

import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DocSection,
  InlineCode,
  Callout,
} from "./code-block";

const RULES = [
  { title: "API Keys apenas no servidor", desc: "Nunca exponha chaves de API no frontend, browser, aplicações mobile ou repositórios públicos." },
  { title: "HTTPS obrigatório", desc: "Todas as requisições devem ser feitas via HTTPS. Nunca use HTTP para comunicação com a API." },
  { title: "Referências estáveis", desc: "Gere referências únicas e idempotentes para cada pedido. Nunca reutilize referências." },
  { title: "Validar webhooks", desc: "Sempre verifique a assinatura x-nexflowx-signature antes de processar qualquer webhook." },
  { title: "Webhook secret seguro", desc: "Armazene o webhook secret em variáveis de ambiente. Nunca o hardcode no código." },
  { title: "Processamento idempotente", desc: "Implemente idempotência no processamento de webhooks usando event + transaction_id." },
  { title: "Não armazene códigos BLIK", desc: "Os códigos BLIK são efémeros. Não os armazene em base de dados após a validação." },
  { title: "Minimize dados de pagamento", desc: "Não armazene dados de pagamento sensíveis desnecessariamente. Cumpra o princípio do mínimo privilégio." },
  { title: "Não confirme via redirect", desc: "Nunca considere o redirecionamento do cliente como confirmação financeira. Confirme sempre via webhook." },
  { title: "Confirme via webhook", desc: "O estado definitivo de uma transação é comunicado via webhook payment_intent.succeeded." },
  { title: "Credenciais separadas", desc: "Mantenha credenciais Live e Teste completamente separadas. Nunca misture ambientes." },
];

export function SecuritySection() {
  return (
    <DocSection id="security" icon={ShieldCheck} title="Segurança">
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          Siga estas melhores práticas de segurança para proteger a sua integração e os dados dos seus clientes.
        </p>
      </Card>

      <div className="space-y-3">
        {RULES.map((rule, i) => (
          <Card key={i} className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-400">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{rule.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{rule.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Callout variant="security" title="Responsabilidade do Merchant">
        A segurança da integração é partilhada. A XPayments garante a segurança da infraestrutura,
        mas o Merchant é responsável por proteger as suas credenciais, validar webhooks e
        implementar processamento seguro no seu backend.
      </Callout>
    </DocSection>
  );
}
