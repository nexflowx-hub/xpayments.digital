"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert, ShieldCheck, Snowflake, Ban, AlertTriangle,
  Activity, Zap, Eye, TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminMerchants, useAnalyticsOverview } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
import { StatCard, PageHeader, EmptyState } from "@/components/shared";
import { StatusBadge, RiskGauge } from "@/components/shared/badges";
import { DonutChart, CHART_COLORS } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import type { AdminMerchant, RiskAlert } from "@/types";

// Mock platform-level alerts feed
const platformAlerts: (RiskAlert & { merchant?: string })[] = [
  {
    id: "pa1",
    severity: "critical",
    title: "Sanctions watchlist proximity match",
    description: "Vertex Commerce KYC flagged for sanctions list proximity (0.86 confidence). Manual review required.",
    createdAt: "2025-11-22T08:14:00Z",
    merchant: "Vertex Commerce",
  },
  {
    id: "pa2",
    severity: "high",
    title: "Velocity rule cluster",
    description: "12 cards from Cobalt Digital attempted 184 transactions in 90 seconds. Auto-freeze triggered.",
    createdAt: "2025-11-22T05:32:00Z",
    merchant: "Cobalt Digital",
  },
  {
    id: "pa3",
    severity: "high",
    title: "Chargeback spike (BR region)",
    description: "Pix chargeback rate at 0.94% for Atlas Supply, exceeds 0.8% threshold for 3 consecutive days.",
    createdAt: "2025-11-21T22:09:00Z",
    merchant: "Atlas Supply",
  },
  {
    id: "pa4",
    severity: "medium",
    title: "Elevated dispute rate",
    description: "Helix Retail dispute rate climbed to 0.72% (24h rolling), review recommended.",
    createdAt: "2025-11-21T15:48:00Z",
    merchant: "Helix Retail",
  },
  {
    id: "pa5",
    severity: "low",
    title: "New device fingerprint cluster",
    description: "37 transactions share a new device fingerprint across 4 merchants. Velocity within tolerance.",
    createdAt: "2025-11-21T10:21:00Z",
  },
  {
    id: "pa6",
    severity: "medium",
    title: "High-risk jurisdiction activity",
    description: "Increased volume from high-risk jurisdiction detected on Meridian account.",
    createdAt: "2025-11-20T19:55:00Z",
    merchant: "Meridian",
  },
];

const severityStyles: Record<RiskAlert["severity"], { badge: string; dot: string; label: string }> = {
  low: { badge: "border-sky-500/25 bg-sky-500/12 text-sky-400", dot: "bg-sky-400", label: "Low" },
  medium: { badge: "border-amber-500/25 bg-amber-500/12 text-amber-400", dot: "bg-amber-400", label: "Medium" },
  high: { badge: "border-orange-500/25 bg-orange-500/12 text-orange-400", dot: "bg-orange-400", label: "High" },
  critical: { badge: "border-rose-500/25 bg-rose-500/12 text-rose-400", dot: "bg-rose-400", label: "Critical" },
};

function bucket(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 30) return "low";
  if (score < 60) return "high";
  return "critical";
}

export default function AdminRiskPage() {
  const qc = useQueryClient();
  const { data: merchants, isLoading: mLoading } = useAdminMerchants();
  const { data: analytics, isLoading: aLoading } = useAnalyticsOverview();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminMerchant["status"] }) =>
      xpApi.admin.setMerchantStatus(id, status),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "merchants"] });
      toast.success("Merchant updated", {
        description: `Status set to "${vars.status}".`,
      });
    },
    onError: () => toast.error("Failed to update merchant"),
  });

  const list = merchants ?? [];

  // Aggregated platform risk metrics
  const avgRisk = list.length
    ? list.reduce((s, m) => s + m.riskScore, 0) / list.length
    : 0;
  const highRisk = list.filter((m) => m.riskScore >= 60).length;
  const frozen = list.filter((m) => m.status === "frozen" || m.status === "suspended").length;

  // Top risky merchants
  const topRisky = React.useMemo(
    () => list.slice().sort((a, b) => b.riskScore - a.riskScore).slice(0, 8),
    [list]
  );

  // Risk distribution buckets
  const distribution = React.useMemo(() => {
    const buckets: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const m of list) {
      // Use a refined bucket mapping for distribution: low <25, medium 25-50, high 50-75, critical >75
      if (m.riskScore < 25) buckets.low += 1;
      else if (m.riskScore < 50) buckets.medium += 1;
      else if (m.riskScore < 75) buckets.high += 1;
      else buckets.critical += 1;
    }
    return [
      { name: "Low (0-24)", value: buckets.low },
      { name: "Medium (25-49)", value: buckets.medium },
      { name: "High (50-74)", value: buckets.high },
      { name: "Critical (75+)", value: buckets.critical },
    ];
  }, [list]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Platform Risk"
        description="Aggregate merchant risk posture, exposure and active alerts."
        breadcrumbs={[{ label: "Admin" }, { label: "Risk" }]}
        actions={
          <Badge variant="outline" className="gap-1.5 border-amber-500/25 bg-amber-500/12 text-amber-400">
            <ShieldAlert className="h-3.5 w-3.5" /> {platformAlerts.length} active alerts
          </Badge>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Aggregate risk score"
              value={avgRisk}
              icon={Activity}
              accent={avgRisk < 30 ? "green" : avgRisk < 60 ? "amber" : "rose"}
              format={(n) => Math.round(n).toString()}
            />
            <StatCard
              label="High-risk merchants"
              value={highRisk}
              icon={ShieldAlert}
              accent="rose"
              format={(n) => formatNumber(n)}
            />
            <StatCard
              label="Frozen / suspended"
              value={frozen}
              icon={Snowflake}
              accent="violet"
              format={(n) => formatNumber(n)}
            />
            <StatCard
              label="Platform chargeback rate"
              value={analytics?.riskScore ?? 0}
              icon={TrendingDown}
              accent="amber"
              format={(n) => `${(n * 0.02).toFixed(2)}%`}
            />
          </>
        )}
      </div>

      {/* Risk gauge + distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Platform risk score</h3>
              <p className="text-xs text-muted-foreground">Average across {list.length} merchants</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            {mLoading ? (
              <Skeleton className="h-32 w-48" />
            ) : (
              <>
                <RiskGauge score={avgRisk} size={200} />
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-3 gap-1",
                    avgRisk < 30
                      ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-400"
                      : avgRisk < 60
                      ? "border-amber-500/25 bg-amber-500/12 text-amber-400"
                      : "border-rose-500/25 bg-rose-500/12 text-rose-400"
                  )}
                >
                  {avgRisk < 30
                    ? "Healthy posture"
                    : avgRisk < 60
                    ? "Elevated posture"
                    : "Critical posture"}
                </Badge>
              </>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Risk distribution</h3>
              <p className="text-xs text-muted-foreground">Merchant count by risk bucket</p>
            </div>
          </div>
          {mLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DonutChart
                data={distribution}
                height={240}
                formatter={(v) => `${formatNumber(v)} merchants`}
              />
              <div className="flex flex-col justify-center gap-2">
                {distribution.map((d, i) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-xs font-medium">{d.name}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Top risky merchants */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <div>
              <h3 className="text-sm font-semibold">Top risky merchants</h3>
              <p className="text-xs text-muted-foreground">Highest risk scores across the platform</p>
            </div>
          </div>
        </div>
        {mLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : topRisky.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No merchants" description="No merchant data available." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead>Merchant</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topRisky.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-xs font-semibold text-primary">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{m.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.country}</TableCell>
                  <TableCell>
                    <RiskCell score={m.riskScore} />
                  </TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatCurrency(m.revenue, "EUR", { compact: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toast.info(`Viewing ${m.name}`, { description: m.id })}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-sky-400 hover:text-sky-300"
                        disabled={m.status === "frozen" || statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: m.id, status: "frozen" })}
                        title="Freeze"
                      >
                        <Snowflake className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-400 hover:text-rose-300"
                        disabled={m.status === "suspended" || statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: m.id, status: "suspended" })}
                        title="Suspend"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Alerts feed */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold">Platform alerts</h3>
              <p className="text-xs text-muted-foreground">Real-time risk signals from across the network</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 border-border/60 bg-muted/30 text-xs">
            {platformAlerts.filter((a) => a.severity === "critical" || a.severity === "high").length} critical/high
          </Badge>
        </div>
        <div className="flex flex-col gap-2">
          {platformAlerts.map((a) => {
            const style = severityStyles[a.severity];
            return (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/40 p-3"
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", style.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    <Badge variant="outline" className={cn("gap-1 text-[10px]", style.badge)}>
                      <AlertTriangle className="h-2.5 w-2.5" /> {style.label}
                    </Badge>
                    {a.merchant && (
                      <Badge variant="outline" className="gap-1 border-border/60 bg-muted/30 text-[10px] text-muted-foreground">
                        {a.merchant}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(a.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
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
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
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
