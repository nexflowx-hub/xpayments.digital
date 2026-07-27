"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, BarChart3, Clock, Wallet as WalletIcon,
  CircleCheck, CalendarClock, ArrowRightLeft, Target, Send, RefreshCw,
} from "lucide-react";
import { useFinancialSummary, useFinancialChart, useStores } from "@/hooks/queries";
import { PageHeader, ErrorState, fadeUp } from "@/components/shared";
import { AreaTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import type { FinancialPeriod, FinancialChartPoint } from "@/types";

const PERIODS: { key: FinancialPeriod | "custom"; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "month", label: "Mês" },
  { key: "custom", label: "Intervalo" },
];

type ChartMetric = "gross" | "fees" | "net";
const CHART_METRICS: { key: ChartMetric; label: string }[] = [
  { key: "gross", label: "Bruto" },
  { key: "fees", label: "Taxas" },
  { key: "net", label: "Líquido" },
];

export default function FinancialDashboard() {
  const { data: summary, isLoading: sLoading, isError: sError, refetch } = useFinancialSummary();
  const { data: stores } = useStores();

  const [period, setPeriod] = React.useState<FinancialPeriod | "custom">("today");
  const [metric, setMetric] = React.useState<ChartMetric>("net");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  const chartParams = period === "custom"
    ? { period: "custom" as const, from: fromDate, to: toDate }
    : { period: period === "today" ? "today" : period === "7d" ? "7d" : period === "30d" ? "30d" : "month" };

  const { data: chartData, isLoading: cLoading } = useFinancialChart(
    period === "custom" && !fromDate && !toDate ? {} : chartParams,
  );

  const s = summary;
  const cur = "EUR";
  const fmt = (n: number) => formatCurrency(n, cur);

  function dv(value: number | undefined | null): string {
    return value === undefined || value === null ? "—" : fmt(value);
  }

  if (sError) return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard Financeiro" description="Visão completa do seu fluxo financeiro." />
      <ErrorState message="Não foi possível carregar os dados financeiros. O backend pode estar indisponível." onRetry={() => refetch()} />
    </div>
  );

  const kpis = [
    { label: "Vendas brutas hoje", value: s?.grossToday, icon: DollarSign, accent: "green" as const },
    { label: "Vendas líquidas hoje", value: s?.netToday, icon: TrendingUp, accent: "green" as const },
    { label: "Vendas líquidas no mês", value: s?.netMonth, icon: BarChart3, accent: "blue" as const },
    { label: "Pendente de liberação", value: s?.pending, icon: Clock, accent: "amber" as const },
    { label: "Wallet total", value: s?.walletTotal, icon: WalletIcon, accent: "blue" as const },
    { label: "Disponível", value: s?.available, icon: CircleCheck, accent: "green" as const },
    { label: "Próxima liberação", value: s?.nextReleaseAmount, icon: CalendarClock, accent: "violet" as const },
    { label: "Saídas previstas", value: s?.scheduledPayouts, icon: ArrowRightLeft, accent: "amber" as const },
    { label: "Disponível projetado", value: s?.projectedAvailable, icon: Target, accent: "blue" as const },
    { label: "Total já pago", value: s?.totalPaid, icon: Send, accent: "rose" as const },
  ];

  const chartSeries: { date: string; value: number }[] =
    (chartData ?? []).map((p: FinancialChartPoint) => ({
      date: p.date,
      value: p[metric] ?? 0,
    }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard Financeiro"
        description="Visão completa do seu fluxo financeiro."
        actions={<Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}><RefreshCw className="h-3.5 w-3.5" /> Atualizar</Button>}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {sLoading || !s
          ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : kpis.map((kpi) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -2 }}
              >
                <Card className="relative overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                  <div className={cn(
                    "absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl",
                    kpi.accent === "green" && "bg-emerald-500/10",
                    kpi.accent === "blue" && "bg-primary/10",
                    kpi.accent === "amber" && "bg-amber-500/10",
                    kpi.accent === "violet" && "bg-violet-500/10",
                    kpi.accent === "rose" && "bg-rose-500/10",
                  )} />
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                    <div className={cn(
                      "rounded-lg p-1.5",
                      kpi.accent === "green" && "text-emerald-400 bg-emerald-500/10",
                      kpi.accent === "blue" && "text-primary bg-primary/10",
                      kpi.accent === "amber" && "text-amber-400 bg-amber-500/10",
                      kpi.accent === "violet" && "text-violet-400 bg-violet-500/10",
                      kpi.accent === "rose" && "text-rose-400 bg-rose-500/10",
                    )}>
                      <kpi.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">
                      {dv(kpi.value)}
                    </p>
                    {kpi.label === "Próxima liberação" && s?.nextReleaseDate && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Prevista: {new Date(s.nextReleaseDate).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Chart */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Evolução Financeira</h3>
            <p className="text-xs text-muted-foreground">Bruto, taxas e líquido ao longo do tempo</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {CHART_METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  metric === m.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition",
                period === p.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="mb-4 flex items-center gap-2">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 w-auto text-xs" />
            <span className="text-xs text-muted-foreground">até</span>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 w-auto text-xs" />
          </div>
        )}

        <div className="h-72">
          {cLoading || !chartData ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : chartSeries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sem dados para o período selecionado.
            </div>
          ) : (
            <AreaTrend
              data={chartSeries}
              color={metric === "fees" ? "rgb(239,68,68)" : metric === "gross" ? "rgb(34,197,94)" : "rgb(59,130,246)"}
              height={280}
            />
          )}
        </div>
      </Card>
    </div>
  );
}