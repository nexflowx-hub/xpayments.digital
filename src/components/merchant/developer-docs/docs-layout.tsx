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
import { OverviewSection } from "./overview-section";
import { AuthSection } from "./auth-section";
import { PaymentsSection } from "./payments-section";
import { MethodsSection } from "./methods-section";
import { WebhooksSection } from "./webhooks-section";
import { MaintenanceSection } from "./maintenance-section";

export default function DocsLayout() {
  const active = useActiveSection();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documentação API Merchant"
        description="Contrato oficial da API S2S XPayments v1 para criação de pagamentos, métodos locais e webhooks Merchant."
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Documentação" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">API Merchant S2S</h2>
          <Badge
            variant="outline"
            className="border-sky-500/25 bg-sky-500/10 text-sky-300 text-[11px]"
          >
            Server-to-Server
          </Badge>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[11px]"
        >
          API v1 • S2S Stable
        </Badge>
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Superfície certificada</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Autenticação, <code className="text-primary">POST /payments/charge</code>, MB WAY, Bizum, Multibanco, Bancontact, BLIK e webhooks Merchant estão documentados de acordo com o runtime S2S atual. As restantes áreas permanecem assinaladas como manutenção até nova certificação.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-6">
        <DocsSidebar active={active} onSelect={() => {}} />

        <main className="min-w-0 flex-1 space-y-12 pb-8">
          <OverviewSection />
          <AuthSection />
          <PaymentsSection />
          <MethodsSection />
          <WebhooksSection />

          <MaintenanceSection
            id="checkout"
            title="Checkout"
            description="O contrato do Checkout Hosted está em revisão. Para novas integrações utilize a API Merchant S2S até esta secção voltar a estar certificada."
          />
          <MaintenanceSection
            id="errors"
            title="Referência de Erros"
            icon={AlertTriangle}
            description="A taxonomia completa de erros está a ser alinhada com o runtime atual. Os erros específicos documentados nas secções S2S ativas podem ser utilizados; a referência global permanece em manutenção."
          />
          <MaintenanceSection
            id="security"
            title="Guia de Segurança"
            icon={ShieldCheck}
            description="O guia consolidado de segurança está em revisão. As regras obrigatórias de API Key, chamadas apenas pelo backend, HTTPS, redaction de BLIK e verificação HMAC de webhooks estão documentadas nas secções S2S ativas."
          />
          <MaintenanceSection
            id="status"
            title="Estado da API"
            icon={Activity}
            description="A página pública de estado e a referência de disponibilidade estão a ser reorganizadas. Consulte o suporte XPayments para incidentes ou manutenção programada."
          />

          <motion.div {...fadeUp} className="pt-4">
            <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-3 text-center">
                <h3 className="text-sm font-semibold">Suporte Técnico</h3>
                <p className="max-w-md text-xs text-muted-foreground">
                  Para ativação de Store, credenciais, ambiente Sandbox ou configuração do webhook Merchant, utilize os canais oficiais de suporte.
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
