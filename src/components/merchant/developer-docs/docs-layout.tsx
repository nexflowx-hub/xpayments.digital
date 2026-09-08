"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { PageHeader, fadeUp } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocsSidebar, useActiveSection } from "./docs-sidebar";
import { S2SCertifiedSection } from "./s2s-certified-section";
import { S2SSandboxSection } from "./s2s-sandbox-section";
import { CheckoutSection } from "./checkout-section";
import { MaintenanceSection } from "./maintenance-section";

export default function DocsLayout() {
  const active = useActiveSection();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documentação API Merchant"
        description="Contrato oficial XPayments para API S2S e Checkout XPay, com estados de suporte, Sandbox, webhooks e regras de confirmação financeira."
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Documentação" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Developer Platform</h2>
          <Badge
            variant="outline"
            className="border-sky-500/25 bg-sky-500/10 text-sky-300 text-[11px]"
          >
            S2S + Checkout
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[11px]"
            onClick={() => window.open("/doc/s2s", "_blank")}
          >
            <ExternalLink className="h-3 w-3" /> Guia público S2S
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[11px]"
            onClick={() => window.open("/doc/checkout", "_blank")}
          >
            <ExternalLink className="h-3 w-3" /> Guia público Checkout
          </Button>
          <Badge
            variant="outline"
            className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[11px]"
          >
            Core E2E Certified
          </Badge>
        </div>
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Superfícies certificadas em 08/09/2026</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              API S2S MB WAY e Checkout Hosted foram validados de ponta a ponta até <code className="text-primary">Transaction=succeeded</code> + WalletMovement, incluindo signed webhook e resolução de GatewayVault lógico sobre credencial Stripe física partilhada. A matriz abaixo distingue claramente métodos certificados, dependentes da Store e ainda não suportados em S2S direto.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-6">
        <DocsSidebar active={active} onSelect={() => {}} />

        <main className="min-w-0 flex-1 space-y-12 pb-8">
          <S2SCertifiedSection />
          <S2SSandboxSection />
          <CheckoutSection />

          <MaintenanceSection
            id="errors"
            title="Referência Global de Erros"
            icon={AlertTriangle}
            description="A taxonomia consolidada continua em revisão. Utilize os códigos documentados nas secções S2S e Checkout ativas e trate HTTP 4xx/5xx de forma defensiva."
          />
          <MaintenanceSection
            id="security"
            title="Guia Consolidado de Segurança"
            icon={ShieldCheck}
            description="As regras obrigatórias já estão publicadas nas secções ativas: API Keys apenas no backend, separação Test/Live, HTTPS, idempotência, verificação de webhooks e ausência de PAN/CVV bruto em endpoints não certificados."
          />
          <MaintenanceSection
            id="status"
            title="Estado da API"
            icon={Activity}
            description="Consulte o endpoint público de health para disponibilidade do core. Uma futura página de status agregará incidentes, manutenção e métricas históricas."
          />

          <motion.div {...fadeUp} className="pt-4">
            <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-3 text-center">
                <h3 className="text-sm font-semibold">Suporte Técnico</h3>
                <p className="max-w-md text-xs text-muted-foreground">
                  Para ativação de Store, credenciais, métodos, Sandbox, Checkout Embedded ou configuração de webhook Merchant, utilize os canais oficiais de suporte.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => window.open("/support", "_self")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Portal de Suporte
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => window.open("https://t.me/XPayments_Manager", "_blank")}
                  >
                    <ChevronRight className="h-3.5 w-3.5" /> Telegram Manager
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
