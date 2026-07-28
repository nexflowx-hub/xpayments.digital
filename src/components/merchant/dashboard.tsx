"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Wallet as WalletIcon, Clock,
  CircleCheck, Send, CalendarClock, BarChart3,
} from "lucide-react";
import { useFinanceOverview } from "@/hooks/queries";
import { PageHeader, ErrorState, fadeUp } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDateCivil, formatNumber } from "@/lib/utils";
import type { FinanceOverview } from "@/types";

export default function MerchantOverview() {
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useFinanceOverview("EUR");

  const d: FinanceOverview | null = overview ?? null;
  const cur = d?.currency ?? "EUR";

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Painel"
          description="Visão geral financeira em tempo real."
        />
        <ErrorState
          message="Não foi possível carregar os dados. O backend pode estar indisponível."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  /* ---------- Loading skeletons ---------- */
  if (isLoading || !d) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Painel"
          description="Visão geral financeira em tempo real."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  /* ---------- KPI cards ---------- */
  const kpis = [
    {
      label: "Vendas brutas hoje",
      value: formatCurrency(d.sales.today.gross, cur),
      sub: `${formatNumber(d.sales.today.transactions)} transações`,
      icon: DollarSign,
      accent: "emerald",
    },
    {
      label: "Vendas líquidas hoje",
      value: formatCurrency(d.sales.today.net, cur),
      sub: `Taxas: ${formatCurrency(d.sales.today.fees, cur)}`,
      icon: TrendingUp,
      accent: "emerald",
    },
    {
      label: "Líquido da semana",
      value: formatCurrency(d.sales.week.net, cur),
      sub: `${formatNumber(d.sales.week.transactions)} transações`,
      icon: BarChart3,
      accent: "primary",
    },
    {
      label: "Líquido do mês",
      value: formatCurrency(d.sales.month.net, cur),
      sub: `${formatNumber(d.sales.month.transactions)} transações`,
      icon: BarChart3,
      accent: "primary",
    },
    {
      label: "Wallet total",
      value: formatCurrency(d.wallet.balance, cur),
      sub: "Saldo após payouts e ajustes",
      icon: WalletIcon,
      accent: "primary",
    },
    {
      label: "Pendente",
      value: formatCurrency(d.wallet.pending, cur),
      sub: "Aguardando liberação",
      icon: Clock,
      accent: "amber",
    },
    {
      label: "Disponível",
      value: formatCurrency(d.wallet.available, cur),
      sub: `Reservado: ${formatCurrency(d.wallet.reserved, cur)}`,
      icon: CircleCheck,
      accent: "emerald",
    },
    {
      label: "Payouts realizados",
      value: formatCurrency(d.payouts.paid, cur),
      sub: `${formatNumber(d.payouts.paidCount)} payouts`,
      icon: Send,
      accent: "rose",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel"
        description="Visão geral financeira em tempo real."
      />

      {/* ---- KPI Grid ---- */}
      <motion.div
        {...fadeUp}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -2 }}
            >
              <Card className="relative overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                <div
                  className={cn(
                    "absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl",
                    kpi.accent === "emerald" && "bg-emerald-500/10",
                    kpi.accent === "primary" && "bg-primary/10",
                    kpi.accent === "amber" && "bg-amber-500/10",
                    kpi.accent === "rose" && "bg-rose-500/10",
                  )}
                />
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </p>
                  <div
                    className={cn(
                      "rounded-lg p-1.5",
                      kpi.accent === "emerald" &&
                        "text-emerald-400 bg-emerald-500/10",
                      kpi.accent === "primary" &&
                        "text-primary bg-primary/10",
                      kpi.accent === "amber" &&
                        "text-amber-400 bg-amber-500/10",
                      kpi.accent === "rose" &&
                        "text-rose-400 bg-rose-500/10",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                  {kpi.value}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {kpi.sub}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ---- Next Release + Sales Summary ---- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Next release */}
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold">Próxima liberação</h3>
          </div>
          {d.nextRelease ? (
            <div className="flex flex-col gap-3">
              <p className="text-2xl font-semibold tabular-nums">
                {formatCurrency(d.nextRelease.amount, cur)}
              </p>
              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span>
                  Data: {formatDateCivil(d.nextRelease.date)}
                </span>
                <span>
                  Movimentos: {formatNumber(d.nextRelease.movementCount)}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "w-fit",
                    d.nextRelease.status === "expected" &&
                      "border-emerald-500/25 bg-emerald-500/12 text-emerald-400",
                    d.nextRelease.status === "overdue" &&
                      "border-rose-500/25 bg-rose-500/12 text-rose-400",
                  )}
                >
                  {d.nextRelease.status === "expected"
                    ? "Esperado"
                    : "Atrasado"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma liberação prevista.
            </p>
          )}
        </Card>

        {/* Sales summary */}
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-semibold">Resumo de vendas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Período</th>
                  <th className="pb-2 text-right font-medium">Vendas brutas</th>
                  <th className="pb-2 text-right font-medium">Taxas registradas</th>
                  <th className="pb-2 text-right font-medium">Vendas líquidas</th>
                  <th className="pb-2 text-right font-medium">Transações</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    {
                      label: "Hoje",
                      ...d.sales.today,
                    },
                    {
                      label: "Mês atual",
                      ...d.sales.month,
                    },
                  ] as const
                ).map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-border/30 transition hover:bg-muted/30"
                  >
                    <td className="py-2.5 font-medium">{row.label}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {formatCurrency(row.gross, cur)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-rose-400">
                      {formatCurrency(row.fees, cur)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums font-semibold">
                      {formatCurrency(row.net, cur)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {formatNumber(row.transactions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ---- Payouts summary ---- */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold">Resumo de payouts</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">Total pago</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatCurrency(d.payouts.paid, cur)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatNumber(d.payouts.paidCount)} payouts
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">Agendado</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatCurrency(d.payouts.scheduled, cur)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatNumber(d.payouts.scheduledCount)} payouts
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">
              Saldo operacional atual
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatCurrency(d.wallet.balance, cur)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Pendente: {formatCurrency(d.wallet.pending, cur)}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">
              Disponível projetado
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatCurrency(d.projectedAvailable, cur)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Reservado: {formatCurrency(d.wallet.reserved, cur)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
