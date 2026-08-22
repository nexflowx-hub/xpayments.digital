"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ExternalLink, ChevronRight } from "lucide-react";
import { PageHeader, fadeUp } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocsSidebar, useActiveSection } from "./docs-sidebar";
import { OverviewSection } from "./overview-section";
import { AuthSection } from "./auth-section";
import { PaymentsSection } from "./payments-section";
import { MethodsSection } from "./methods-section";
import { CheckoutSection } from "./checkout-section";
import { WebhooksSection } from "./webhooks-section";
import { ErrorsSection } from "./errors-section";
import { SecuritySection } from "./security-section";
import { StatusSection } from "./status-section";

export default function DocsLayout() {
  const active = useActiveSection();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documentação API"
        description="Documentação oficial da XPayments API v1 — integração S2S, Checkout, Webhooks e todos os métodos de pagamento."
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Documentação" },
        ]}
      />

      {/* Top bar with version badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Documentação API</h2>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[11px]"
        >
          API v1 &bull; Stable
        </Badge>
      </div>

      {/* Sidebar + Content */}
      <div className="flex gap-6">
        <DocsSidebar active={active} onSelect={() => {}} />

        <main className="min-w-0 flex-1 space-y-12 pb-8">
          <OverviewSection />
          <AuthSection />
          <PaymentsSection />
          <MethodsSection />
          <CheckoutSection />
          <WebhooksSection />
          <ErrorsSection />
          <SecuritySection />
          <StatusSection />

          {/* Support footer */}
          <motion.div {...fadeUp} className="pt-4">
            <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-3 text-center">
                <h3 className="text-sm font-semibold">Suporte Técnico</h3>
                <p className="max-w-md text-xs text-muted-foreground">
                  Precisa de ajuda com a sua integração? A nossa equipa técnica está pronta para
                  o apoiar. Contacte-nos através do nosso portal de suporte oficial.
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
