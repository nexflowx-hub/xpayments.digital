"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Target, ShieldCheck, Activity, Crown,
  CalendarRange, ArrowUpRight, ArrowDownRight, Globe, BarChart3,
} from "lucide-react";
import { useAnalyticsOverview } from "@/hooks/queries";
import { PageHeader, StatCard } from "@/components/shared";
import { AreaTrend, BarTrend, DonutChart, CHART_COLORS } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  formatCurrency, formatNumber, formatPercent, cn,
} from "@/lib/utils";
import { COUNTRY_LIST } from "@/config";

const methodLabel: Record<string, string> = {
  visa: "Visa", mastercard: "Mastercard", pix: "Pix", mbway: "MBWay",
  apple_pay: "Apple Pay", google_pay: "Google Pay", crypto: "Crypto", sepa: "SEPA", wise: "Wise", amex: "Amex",
};

interface FunnelStage {
  key: string;
  label: string;
  value: number;
}

export default function AnalyticsPage() {
  const { data: a, isLoading } = useAnalyticsOverview();
  const [range, setRange] = React.useState<string>("30d");

  // Build a deterministic conversion funnel from analytics signals
  const funnel: FunnelStage[] = React.useMemo(() => {
    const conversion = a?.conversion ?? 4.7;
    const approval = a?.approvalRate ?? 96.8;
    const visits = 184200;
    const captured = Math.round((visits * conversion) / 100);
    const authenticated = Math.round(captured / (approval / 100));
    const initiated = Math.round(authenticated / 0.93);
    return [
      { key: "visits", label: "Visits", value: visits },
      { key: "initiated", label: "Initiated", value: initiated },
      { key: "authenticated", label: "Authenticated", value: authenticated },
      { key: "captured", label: "Captured", value: captured },
    ];
  }, [a]);
  const funnelMax = funnel[0]?.value ?? 1;

  // Countries breakdown — deterministic, derived from COUNTRY_LIST
  const countries = React.useMemo(() => {
    const rows = COUNTRY_LIST.map((name, i) => {
      const seed = name.length * 7 + i * 13 + 1;
      const volume = Math.round(220000 + (Math.sin(seed) * 0.5 + 0.5) * 1900000);
      return { country: name, volume };
    });
    const total = rows.reduce((s, r) => s + r.volume, 0);
    return rows
      .map((r) => ({ ...r, share: (r.volume / total) * 100 }))
      .sort((x, y) => y.volume - x.volume);
  }, []);
  const maxCountryVol = countries[0]?.volume ?? 1;

  const topByLtv = a?.topCustomers ?? [];
  const maxLtv = topByLtv[0]?.ltv ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Performance, conversion and revenue intelligence across your merchant account."
        actions={
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger size="sm" className="h-8 w-[140px] gap-1.5">
              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading || !a ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Revenue" value={a.revenue} change={a.revenueChange} icon={DollarSign} accent="blue" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Volume" value={a.volume} change={a.volumeChange} icon={TrendingUp} accent="green" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Conversion" value={a.conversion} change={a.conversionChange} icon={Target} accent="violet" format={(n) => formatPercent(n)} />
            <StatCard label="Approval" value={a.approvalRate} change={a.approvalChange} icon={ShieldCheck} accent="green" format={(n) => formatPercent(n)} />
            <StatCard label="Risk score" value={a.riskScore} change={a.riskChange} icon={Activity} accent="amber" format={(n) => Math.round(n).toString()} />
          </>
        )}
      </div>

      {/* Revenue + Currency distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Revenue trend</h3>
              <p className="text-xs text-muted-foreground">Net revenue · {range}</p>
            </div>
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <ArrowUpRight className="h-3 w-3" /> {a?.revenueChange ?? 0}%
            </Badge>
          </div>
          {isLoading || !a ? <Skeleton className="h-64 w-full" /> : (
            <AreaTrend
              data={a.revenueSeries}
              dataKey="value"
              xKey="date"
              color="oklch(0.62 0.21 258)"
              height={260}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Currency distribution</h3>
            <p className="text-xs text-muted-foreground">Volume share by currency</p>
          </div>
          {isLoading || !a ? <Skeleton className="h-64 w-full" /> : (
            <DonutChart
              data={a.currencies.map((c) => ({ name: c.currency, value: c.volume }))}
              height={260}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>
      </div>

      {/* Volume + Payment methods */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Volume trend</h3>
              <p className="text-xs text-muted-foreground">Gross payment volume · {range}</p>
            </div>
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <ArrowUpRight className="h-3 w-3" /> {a?.volumeChange ?? 0}%
            </Badge>
          </div>
          {isLoading || !a ? <Skeleton className="h-64 w-full" /> : (
            <AreaTrend
              data={a.volumeSeries}
              dataKey="value"
              xKey="date"
              color="oklch(0.70 0.17 158)"
              height={260}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Payment methods</h3>
              <p className="text-xs text-muted-foreground">Volume by method</p>
            </div>
          </div>
          {isLoading || !a ? <Skeleton className="h-64 w-full" /> : (
            <BarTrend
              data={a.paymentMethods.map((p) => ({ name: methodLabel[p.method] ?? p.method, value: p.volume }))}
              dataKey="value"
              xKey="name"
              color="oklch(0.66 0.20 300)"
              height={260}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>
      </div>

      {/* Funnel + Top customers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Conversion funnel</h3>
              <p className="text-xs text-muted-foreground">Visits → Initiated → Authenticated → Captured</p>
            </div>
            <Badge variant="outline" className="gap-1 border-violet-500/25 bg-violet-500/12 text-violet-400">
              <Target className="h-3 w-3" /> {a ? formatPercent(a.conversion) : "—"}
            </Badge>
          </div>
          <div className="flex flex-col gap-3">
            {funnel.map((stage, i) => {
              const pct = (stage.value / funnelMax) * 100;
              const convPct = i === 0 ? 100 : (stage.value / funnel[0].value) * 100;
              const colors = ["oklch(0.62 0.21 258)", "oklch(0.66 0.20 300)", "oklch(0.70 0.17 158)", "oklch(0.78 0.16 78)"];
              return (
                <motion.div
                  key={stage.key}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "100%" }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{stage.label}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {formatNumber(stage.value)} · {convPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-9 w-full overflow-hidden rounded-lg border border-border/40 bg-background/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.08 + 0.1, duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 rounded-lg"
                      style={{ background: `linear-gradient(90deg, ${colors[i]}cc, ${colors[i]}66)` }}
                    />
                    <div className="relative flex h-full items-center justify-between px-3">
                      <span className="text-[11px] font-medium text-foreground/90">{stage.label}</span>
                      {i > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <ArrowDownRight className="h-3 w-3" />
                          {((stage.value / funnel[i - 1].value) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Top customers</h3>
              <p className="text-xs text-muted-foreground">By lifetime value</p>
            </div>
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex flex-col gap-2.5">
            {isLoading || !a
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)
              : topByLtv.map((c, i) => {
                  const pct = (c.ltv / maxLtv) * 100;
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="grid h-5 w-5 place-items-center rounded-md bg-muted/60 text-[10px] font-semibold text-muted-foreground">{i + 1}</span>
                          <span className="truncate font-medium">{c.name}</span>
                        </div>
                        <span className="font-mono tabular-nums">{formatCurrency(c.ltv, "EUR", { compact: true })}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
          </div>
        </Card>
      </div>

      {/* Countries breakdown */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Countries breakdown</h3>
              <p className="text-xs text-muted-foreground">Volume and share by customer country</p>
            </div>
          </div>
          <Badge variant="outline">{countries.length} countries</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {countries.map((c, i) => (
            <div key={c.country} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted/60 text-[10px] font-semibold text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{c.country}</span>
                  <span className="font-mono text-xs tabular-nums">{formatCurrency(c.volume, "EUR", { compact: true })}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.volume / maxCountryVol) * 100}%` }}
                      transition={{ delay: i * 0.04, duration: 0.5 }}
                      className="h-full rounded-full bg-primary/80"
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted-foreground">{c.share.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
