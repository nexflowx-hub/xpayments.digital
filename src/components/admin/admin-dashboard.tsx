"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Building2, DollarSign, Landmark, Activity, ArrowUpRight,
  Server, Cpu, Gauge, ScrollText, ChevronRight, ShieldCheck,
} from "lucide-react";
import {
  useAdminMerchants, useAdminRevenue, useAdminTreasury,
  useAdminHealth, useAdminKyc,
} from "@/hooks/queries";
import {
  StatCard, PageHeader, EmptyState, fadeUp,
} from "@/components/shared";
import { StatusBadge } from "@/components/shared/badges";
import { AreaTrend, BarTrend, CHART_COLORS } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUi } from "@/stores/ui";
import {
  formatCurrency, formatNumber, formatPercent, timeAgo, cn,
} from "@/lib/utils";

export default function AdminOverviewPage() {
  const { setAdminView } = useUi();
  const { data: merchants, isLoading: mLoading } = useAdminMerchants();
  const { data: revenue, isLoading: rLoading } = useAdminRevenue();
  const { data: treasury, isLoading: tLoading } = useAdminTreasury();
  const { data: health, isLoading: hLoading } = useAdminHealth();
  const { data: kyc } = useAdminKyc();

  const totalMerchants = merchants?.data.length ?? 0;
  const pendingKyc = kyc?.data.length ?? 0;
  const recentMerchants = (merchants?.data ?? [])
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6);

  const queueThroughput = (health?.queues ?? []).map((q) => ({
    name: q.name.split(".")[0],
    throughput: q.throughput,
    pending: q.pending,
  }));

  const operationalServices = (health?.services ?? []).filter(
    (s) => s.status === "operational"
  ).length;
  const totalServices = health?.services.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Platform Overview"
        description="Operational control center for the XPayments platform."
        breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}
        actions={
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setAdminView("admin-health")}
          >
            <Activity className="h-3.5 w-3.5" /> System status
          </Button>
        }
      />

      {/* Operational status pill + stat cards */}
      <div className="flex flex-wrap items-center gap-2">
        {hLoading || !health ? (
          <Skeleton className="h-7 w-44 rounded-full" />
        ) : (
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 px-3 py-1 text-xs font-semibold",
              health.status === "operational" &&
                "border-emerald-500/25 bg-emerald-500/12 text-emerald-400",
              health.status === "degraded" &&
                "border-amber-500/25 bg-amber-500/12 text-amber-400",
              health.status === "outage" &&
                "border-rose-500/25 bg-rose-500/12 text-rose-400"
            )}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  health.status === "operational" && "bg-emerald-400",
                  health.status === "degraded" && "bg-amber-400",
                  health.status === "outage" && "bg-rose-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  health.status === "operational" && "bg-emerald-400",
                  health.status === "degraded" && "bg-amber-400",
                  health.status === "outage" && "bg-rose-400"
                )}
              />
            </span>
            {health.status === "operational"
              ? "All systems operational"
              : health.status === "degraded"
              ? "Degraded performance detected"
              : "Active outage in progress"}
          </Badge>
        )}
        <Badge variant="outline" className="gap-1.5 border-border/60 bg-muted/30 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          {operationalServices}/{totalServices} services nominal
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mLoading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <StatCard
            label="Total merchants"
            value={totalMerchants}
            icon={Building2}
            accent="blue"
            format={(n) => formatNumber(n)}
          />
        )}
        {rLoading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <StatCard
            label="Platform revenue"
            value={revenue?.total ?? 0}
            change={18.4}
            icon={DollarSign}
            accent="green"
            format={(n) => formatCurrency(n, "EUR", { compact: true })}
          />
        )}
        {tLoading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <StatCard
            label="Treasury liquidity"
            value={treasury?.totalLiquidity ?? 0}
            change={treasury?.liquidityChange}
            icon={Landmark}
            accent="violet"
            format={(n) => formatCurrency(n, "EUR", { compact: true })}
          />
        )}
        {hLoading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <StatCard
            label="System uptime"
            value={health?.uptime ?? 0}
            icon={Activity}
            accent="amber"
            format={(n) => `${n.toFixed(3)}%`}
          />
        )}
      </div>

      {/* Revenue trend + System health */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Platform revenue</h3>
              <p className="text-xs text-muted-foreground">
                Gross platform take, last 30 days
              </p>
            </div>
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <ArrowUpRight className="h-3 w-3" /> 18.4%
            </Badge>
          </div>
          {rLoading || !revenue ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <AreaTrend
              data={revenue.series}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
              height={260}
            />
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">System health</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAdminView("admin-health")}
            >
              View <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            {hLoading || !health
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9" />
                ))
              : health.services.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          s.status === "operational" && "bg-emerald-400",
                          s.status === "degraded" && "bg-amber-400",
                          s.status === "outage" && "bg-rose-400"
                        )}
                      />
                      <span className="text-xs font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "font-mono text-xs tabular-nums",
                          s.latencyMs > 200
                            ? "text-amber-400"
                            : s.latencyMs > 400
                            ? "text-rose-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {s.latencyMs}ms
                      </span>
                      <StatusBadge status={s.status} className="hidden sm:inline-flex" />
                    </div>
                  </div>
                ))}
          </div>
        </Card>
      </div>

      {/* KYC queue + queue throughput */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold">KYC queue</h3>
            </div>
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/25 bg-amber-500/12 text-amber-400"
            >
              {pendingKyc} pending
            </Badge>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-3xl font-semibold tabular-nums">{pendingKyc}</p>
              <p className="text-xs text-muted-foreground">
                Awaiting compliance review
              </p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Avg review time</span>
                <span className="font-mono font-medium">4h 12m</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">SLA target</span>
                <span className="font-mono font-medium">8h</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Approvals (24h)</span>
                <span className="font-mono font-medium text-emerald-400">14</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Rejections (24h)</span>
                <span className="font-mono font-medium text-rose-400">3</span>
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => setAdminView("admin-kyc")}
            >
              Open review queue
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold">Queue throughput</h3>
                <p className="text-xs text-muted-foreground">Events / minute, by queue</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1 border-border/60 bg-muted/30">
              <Gauge className="h-3 w-3" /> live
            </Badge>
          </div>
          {hLoading || !health ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <BarTrend
              data={queueThroughput}
              dataKey="throughput"
              xKey="name"
              height={220}
              formatter={(v) => `${formatNumber(v, { compact: true })}/m`}
            />
          )}
        </Card>
      </div>

      {/* Recent merchants */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Recently onboarded merchants</h3>
            <p className="text-xs text-muted-foreground">Latest accounts across all regions</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setAdminView("admin-merchants")}
          >
            All merchants <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
        {mLoading || !merchants ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : recentMerchants.length === 0 ? (
          <EmptyState icon={Building2} title="No merchants yet" description="New accounts will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Merchant</th>
                  <th className="pb-2 font-medium">Country</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Risk</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                  <th className="pb-2 text-right font-medium">Onboarded</th>
                </tr>
              </thead>
              <tbody>
                {recentMerchants.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border/30 transition hover:bg-muted/30"
                  >
                    <td className="py-2.5">
                      <p className="font-medium">{m.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{m.id}</p>
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">{m.country}</td>
                    <td className="py-2.5"><StatusBadge status={m.status} /></td>
                    <td className="py-2.5">
                      <RiskCell score={m.riskScore} />
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {formatCurrency(m.revenue, "EUR", { compact: true })}
                    </td>
                    <td className="py-2.5 text-right text-xs text-muted-foreground">
                      {timeAgo(m.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function RiskCell({ score }: { score: number }) {
  const color =
    score < 30
      ? "text-emerald-400"
      : score < 60
      ? "text-amber-400"
      : "text-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            score < 30 && "bg-emerald-400",
            score >= 30 && score < 60 && "bg-amber-400",
            score >= 60 && "bg-rose-400"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("font-mono text-xs font-semibold tabular-nums", color)}>
        {score}
      </span>
    </div>
  );
}
