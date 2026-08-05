"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Target, ShieldCheck, Activity,
  CalendarRange, ArrowUpRight, BarChart3,
} from "lucide-react";
import { useAnalyticsOverview } from "@/hooks/queries";
import { PageHeader, StatCard, ErrorState } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { AreaTrend, BarTrend, DonutChart } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

const methodLabel: Record<string, string> = {
  visa: "Visa", mastercard: "Mastercard", pix: "Pix", mbway: "MBWay",
  apple_pay: "Apple Pay", google_pay: "Google Pay", crypto: "Crypto", sepa: "SEPA", wise: "Wise", amex: "Amex",
};

const EMPTY_SERIES_MSG = "Dados ainda não disponíveis para este período.";

export default function AnalyticsPage() {
  const t = useT();
  const { data: a, isLoading, isError, refetch } = useAnalyticsOverview();
  const [range, setRange] = React.useState<string>("30d");

  if (isError) return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.analytics")} description="Performance, conversão e receita." />
      <ErrorState message="Não foi possível carregar os analytics." onRetry={() => refetch()} />
    </div>
  );

  const hasRevenue = (a?.revenueSeries?.length ?? 0) > 0;
  const hasVolume = (a?.volumeSeries?.length ?? 0) > 0;
  const hasCurrencies = (a?.currencies?.length ?? 0) > 0;
  const hasMethods = (a?.paymentMethods?.length ?? 0) > 0;
  const hasTopCustomers = (a?.topCustomers?.length ?? 0) > 0;

  // Only show stat cards when the API provides legacy fields
  const showStats = a && (a.revenue != null || a.volume != null || a.conversion != null || a.approvalRate != null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.analytics")}
        description="Performance, conversão e receita." /* Removed because the range selector isn't connected to any API parameter. */
      />

      {/* Stat cards — only shown when API provides real data */}
      {showStats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {a?.revenue != null && (
            <StatCard label="Revenue" value={a.revenue} change={a.revenueChange ?? 0} icon={DollarSign} accent="blue" format={(n) => formatCurrency(n, "EUR")} />
          )}
          {a?.volume != null && (
            <StatCard label="Volume" value={a.volume} change={a.volumeChange ?? 0} icon={TrendingUp} accent="green" format={(n) => formatCurrency(n, "EUR")} />
          )}
          {a?.conversion != null && (
            <StatCard label="Conversion" value={a.conversion} change={a.conversionChange ?? 0} icon={Target} accent="violet" format={(n) => formatPercent(n)} />
          )}
          {a?.approvalRate != null && (
            <StatCard label="Approval" value={a.approvalRate} change={a.approvalChange ?? 0} icon={ShieldCheck} accent="green" format={(n) => formatPercent(n)} />
          )}
          {a?.riskScore != null && (
            <StatCard label="Risk score" value={a.riskScore} change={a.riskChange ?? 0} icon={Activity} accent="amber" format={(n) => Math.round(n).toString()} />
          )}
        </div>
      )}

      {/* Revenue trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Revenue trend</h3>
              <p className="text-xs text-muted-foreground">Net revenue</p>
            </div>
            {a?.revenueChange != null && (
              <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
                <ArrowUpRight className="h-3 w-3" /> {a.revenueChange}%
              </Badge>
            )}
          </div>
          {isLoading || !a ? <Skeleton className="h-64 w-full" /> : hasRevenue ? (
            <AreaTrend
              data={a.revenueSeries ?? []}
              dataKey="value"
              xKey="date"
              color="oklch(0.62 0.21 258)"
              height={260}
              formatter={(v) => formatCurrency(v, "EUR")}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
              {EMPTY_SERIES_MSG}
            </div>
          )}
        </Card>

        {/* Currency distribution */}
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Distribuição por moeda</h3>
            <p className="text-xs text-muted-foreground">Volume por moeda</p>
          </div>
          {isLoading || !a ? <Skeleton className="h-64 w-full" /> : hasCurrencies ? (
            <DonutChart
              data={(a?.currencies ?? []).map((c) => ({ name: c.currency, value: c.volume }))}
              height={260}
              formatter={(v) => formatCurrency(v, "EUR")}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
              {EMPTY_SERIES_MSG}
            </div>
          )}
        </Card>
      </div>

      {/* Volume + Payment methods */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Volume trend</h3>
              <p className="text-xs text-muted-foreground">Gross payment volume</p>
            </div>
            {a?.volumeChange != null && (
              <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
                <ArrowUpRight className="h-3 w-3" /> {a.volumeChange}%
              </Badge>
            )}
          </div>
          {isLoading || !a ? <Skeleton className="h-64 w-full" /> : hasVolume ? (
            <AreaTrend
              data={a?.volumeSeries ?? []}
              dataKey="value"
              xKey="date"
              color="oklch(0.70 0.17 158)"
              height={260}
              formatter={(v) => formatCurrency(v, "EUR")}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
              {EMPTY_SERIES_MSG}
            </div>
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
          {isLoading || !a ? <Skeleton className="h-64 w-full" /> : hasMethods ? (
            <BarTrend
              data={(a?.paymentMethods ?? []).map((p) => ({ name: methodLabel[p.method] ?? p.method, value: p.volume }))}
              dataKey="value"
              xKey="name"
              color="oklch(0.66 0.20 300)"
              height={260}
              formatter={(v) => formatCurrency(v, "EUR")}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
              {EMPTY_SERIES_MSG}
            </div>
          )}
        </Card>
      </div>

      {/* Top customers — only when API provides data */}
      {hasTopCustomers && (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Top customers</h3>
              <p className="text-xs text-muted-foreground">By lifetime value</p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {a!.topCustomers!.map((c, i) => {
              const maxLtv = a!.topCustomers![0]?.ltv ?? 1;
              const pct = (c.ltv / maxLtv) * 100;
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-md bg-muted/60 text-[10px] font-semibold text-muted-foreground">{i + 1}</span>
                      <span className="truncate font-medium">{c.name}</span>
                    </div>
                    <span className="font-mono tabular-nums">{formatCurrency(c.ltv, "EUR")}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* No data at all */}
      {!isLoading && a && !showStats && !hasRevenue && !hasVolume && !hasCurrencies && !hasMethods && !hasTopCustomers && (
        <Card className="border-border/60 bg-card/60 p-12 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Dados ainda não disponíveis para este período.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
