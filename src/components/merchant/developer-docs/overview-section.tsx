"use client";

import * as React from "react";
import { BookOpen, Terminal, ArrowRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DocSection, InlineCode, Callout, StatusBadge, CodeBlockMulti, buildSnippets, SubHeading } from "./code-block";

const QUICK_STEPS = [
  { step: 1, text: "Obter API Key no painel da Store" },
  { step: 2, text: 'POST /payments/charge com dados do pedido' },
  { step: 3, text: "Guardar o transactionId retornado" },
  { step: 4, text: "Executar a action retornada (se aplicável)" },
  { step: 5, text: "Aguardar confirmação assíncrona" },
  { step: 6, text: "Processar o webhook de confirmação" },
];

export function OverviewSection() {
  const [quickMethod, setQuickMethod] = React.useState<"mb_way" | "pix" | "blik">("mb_way");

  const quickBodies: Record<string, Record<string, unknown>> = {
    mb_way: {
      amount: 1500,
      currency: "EUR",
      payment_method_types: ["mb_way"],
      reference: "ORDER-PT-2026-0184",
      customer: { name: "João Martins", phone: "912345678" },
    },
    pix: {
      amount: 500,
      currency: "BRL",
      payment_method_types: ["pix"],
      reference: "ORDER-BR-2026-0092",
      customer: { name: "Ana Silva", document: "12345678901" },
    },
    blik: {
      amount: 2500,
      currency: "PLN",
      payment_method_types: ["blik"],
      reference: "ORDER-PL-2026-0447",
      customer: { name: "Jan Kowalski" },
      payment_method_options: { blik: { code: "123456" } },
    },
  };

  return (
    <DocSection id="overview" icon={BookOpen} title="Visão Geral">
      {/* Intro card */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge variant="available">API v1 Stable</StatusBadge>
          <span className="text-xs text-muted-foreground">Production</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A <strong className="text-foreground">XPayments API v1</strong> mantém compatibilidade
          com integrações existentes em produção. O contrato atual utiliza uma arquitetura
          inspirada no ciclo PaymentIntent e suporta pagamentos síncronos e assíncronos
          através de uma interface unificada.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A XPayments oferece duas modalidades principais de integração:
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">API S2S</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Server-to-Server: o seu backend comunica diretamente com a XPayments API.
              Controlo total sobre a experiência de checkout.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Checkout Hosted</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Redirecionamento seguro para interface de pagamento gerida pela XPayments.
              Implementação simplificada.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Start */}
      <SubHeading>Quick Start</SubHeading>
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <p className="mb-4 text-sm text-muted-foreground">
          Integre o seu primeiro pagamento em 6 passos:
        </p>
        <div className="space-y-2">
          {QUICK_STEPS.map((s, i) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {s.step}
              </div>
              <p className="text-sm text-foreground">{s.text}</p>
              {i < QUICK_STEPS.length - 1 && (
                <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/40" />
              )}
            </div>
          ))}
        </div>

        {/* Method selector */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Selecione um método para o exemplo:</p>
          <div className="flex flex-wrap gap-2">
            {([
              { key: "mb_way" as const, label: "EUR — MB WAY" },
              { key: "pix" as const, label: "BRL — PIX" },
              { key: "blik" as const, label: "PLN — BLIK" },
            ]).map((m) => (
              <button
                key={m.key}
                onClick={() => setQuickMethod(m.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  quickMethod === m.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <CodeBlockMulti
              snippets={buildSnippets("/payments/charge", quickBodies[quickMethod])}
            />
          </div>
        </div>
      </Card>

      {/* Base URL & Version */}
      <SubHeading>Base URL</SubHeading>
      <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs font-medium text-foreground">Ambiente de Produção</p>
            <InlineCode>https://api.xpayments.digital/api/v1</InlineCode>
          </div>
        </div>
      </Card>

      <Callout variant="info" title="Versão da API">
        Todas as requisições são feitas para <InlineCode>/api/v1</InlineCode>. A versão v1 está em estado <strong>Stable</strong> e mantém compatibilidade retroativa. O endpoint base é <InlineCode>https://api.xpayments.digital</InlineCode>.
      </Callout>

      <Callout variant="warning" title="Ambiente de Teste">
        A disponibilidade de um ambiente de teste depende da configuração da sua Store. Consulte o seu gestor de conta para mais informações sobre testes.
      </Callout>
    </DocSection>
  );
}
