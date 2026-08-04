"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Wallet as WalletIcon, Clock,
  CircleCheck, Send, RefreshCw, ChevronRight,
} from "lucide-react";
import { useFinanceOverview } from "@/hooks/queries";
import { PageHeader, ErrorState } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { useUi } from "@/stores/ui";
import type { FinanceOverview } from "@/types";

export default function MerchantOverview() {
  const setMerchantView = useUi((s) => s.setMerchantView);
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useFinanceOverview("EUR");

  const d: FinanceOverview | null = overview ?? null;
  const cur = d?.currency ?? "EUR";

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Painel" description="Visão consolidada de vendas, wallet e payouts." />
        <ErrorState message="Não foi possível carregar os dados financeiros." onRetry={() => refetch()} />
      </div>
    );
  }

  /* KPI definitions — matches finance-flow spec */
  const kpis = d ? [
    { label: "Vendas brutas do mês", value: d.sales.month.gross, icon: TrendingUp, accent: "emerald", sub: undefined },
    { label: "Taxas registadas do mês", value: d.sales.month.fees, icon: TrendingUp, accent: "amber", sub: undefined },
    { label: "Líquido do mês", value: d.sales.month.net, icon: TrendingUp, accent: "emerald", sub: undefined },
    { label: "Wallet total", value: d.wallet.balance, sub: "Saldo após payouts e ajustes", icon: WalletIcon, accent: "primary" },
    { label: "Pendente", value: d.wallet.pending, sub: "Aguardando liberação", icon: Clock, accent: "amber" },
    { label: "Disponível", value: d.wallet.available, sub: undefined, icon: CircleCheck, accent: "emerald" },
    { label: "Payouts pagos", value: d.payouts.paid, sub: `${d.payouts.paidCount} payouts`, icon: Send, accent: "violet" },
    { label: "Disponível projetado", value: d.projectedAvailable ?? 0, sub: undefined, icon: WalletIcon, accent: "emerald" },
  ] : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel"
        description="Visão consolidada de vendas, wallet e payouts."
        actions={
          <div className="flex items-center gap-1.5">
            {isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* ---- KPI Grid (8 cards) ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <Card className="relative overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                  <div className={cn(
                    "absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl",
                    kpi.accent === "emerald" && "bg-emerald-500/10",
                    kpi.accent === "primary" && "bg-primary/10",
                    kpi.accent === "amber" && "bg-amber-500/10",
                    kpi.accent === "violet" && "bg-violet-500/10",
                    kpi.accent === "rose" && "bg-rose-500/10",
                  )} />
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                    <div className={cn(
                      "rounded-lg p-1.5",
                      kpi.accent === "emerald" && "text-emerald-400 bg-emerald-500/10",
                      kpi.accent === "primary" && "text-primary bg-primary/10",
                      kpi.accent === "amber" && "text-amber-400 bg-amber-500/10",
                      kpi.accent === "violet" && "text-violet-400 bg-violet-500/10",
                      kpi.accent === "rose" && "text-rose-400 bg-rose-500/10",
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(kpi.value, cur)}
                  </p>
                  {kpi.sub ? (
                    <p className="mt-1 text-[10px] text-muted-foreground">{kpi.sub}</p>
                  ) : null}
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ---- Quick navigation shortcuts ---- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
          onClick={() => setMerchantView("finance-releases")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Liberações</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Calendário de liberações previstas.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
        <Card
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
          onClick={() => setMerchantView("finance-payouts")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Payouts & Saídas</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Extratos de pagamento processados e agendados.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
        <Card
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
          onClick={() => setMerchantView("finance-stores")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Por Store</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Dados financeiros por unidade de venda.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
      </div>
    </div>
  );
}
