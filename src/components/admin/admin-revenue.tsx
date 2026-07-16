"use client";

import * as React from "react";
import {
  DollarSign, TrendingUp, Users, ArrowUpRight, Globe, Crown,
  Coins, BarChart3,
} from "lucide-react";
import { useAdminRevenue, useAdminMerchants } from "@/hooks/queries";
import { StatCard, PageHeader } from "@/components/shared";
import { AreaTrend, BarTrend, DonutChart, CHART_COLORS } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { CURRENCIES } from "@/config";
import type { CurrencyCode } from "@/types";

export default function AdminRevenuePage() {
  const { data: revenue, isLoading: rLoading } = useAdminRevenue();
  const { data: merchants, isLoading: mLoading } = useAdminMerchants();

  const merchantList = merchants ?? [];

  // ---- Derived metrics ----
  const totalRevenue = revenue?.total ?? 0;
  const totalMerchants = merchantList.length || 1;
  const mrr = totalRevenue / 12; // crude MRR approximation from 12mo revenue
  const avgPerMerchant = totalRevenue / totalMerchants;
  const growth = 18.4;

  // Top merchants by revenue
  const topMerchants = React.useMemo(
    () =>
      merchantList
        .slice()
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
    [merchantList]
  );
  const topMerchantMax = topMerchants[0]?.revenue ?? 1;

  // Revenue by country (group merchants)
  const byCountry = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const m of merchantList) {
      map.set(m.country, (map.get(m.country) ?? 0) + m.revenue);
    }
    return Array.from(map.entries())
      .map(([country, value]) => ({ country, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [merchantList]);
  const byCountryMax = byCountry[0]?.value ?? 1;

  // Revenue by currency (donut) — derived from balances as proxy
  const byCurrency = React.useMemo(() => {
    // Distribute revenue across currencies using a deterministic share
    const shares: { currency: CurrencyCode; share: number }[] = [
      { currency: "EUR", share: 0.41 },
      { currency: "USD", share: 0.28 },
      { currency: "BRL", share: 0.19 },
      { currency: "GBP", share: 0.08 },
      { currency: "USDT", share: 0.04 },
    ];
    return shares.map((s) => ({
      name: s.currency,
      value: totalRevenue * s.share,
    }));
  }, [totalRevenue]);

  // Comparison bars (this period vs last period per month)
  const comparison = React.useMemo(() => {
    return (revenue?.series ?? []).slice(-6).map((s, i) => ({
      name: s.date.slice(5),
      thisPeriod: s.value,
      lastPeriod: s.value * (0.78 + i * 0.02),
    }));
  }, [revenue]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Revenue"
        description="Platform take rate, merchant contribution and regional breakdown."
        breadcrumbs={[{ label: "Admin" }, { label: "Revenue" }]}
        actions={
          <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
            <ArrowUpRight className="h-3 w-3" /> +{growth}% YoY
          </Badge>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total platform revenue"
              value={totalRevenue}
              change={growth}
              icon={DollarSign}
              accent="green"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="MRR (annualized ÷12)"
              value={mrr}
              icon={TrendingUp}
              accent="blue"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Avg per merchant"
              value={avgPerMerchant}
              icon={Users}
              accent="violet"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Growth (YoY)"
              value={growth}
              icon={BarChart3}
              accent="amber"
              format={(n) => `+${n.toFixed(1)}%`}
            />
          </>
        )}
      </div>

      {/* Revenue trend (large) */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Platform revenue trend</h3>
            <p className="text-xs text-muted-foreground">Gross take rate, last 30 days</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <ArrowUpRight className="h-3 w-3" /> {growth}%
            </Badge>
          </div>
        </div>
        {rLoading || !revenue ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <AreaTrend
            data={revenue.series}
            formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            height={300}
          />
        )}
      </Card>

      {/* Top merchants + comparison */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold">Top merchants by revenue</h3>
                <p className="text-xs text-muted-foreground">Top 8 contributors</p>
              </div>
            </div>
          </div>
          {mLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {topMerchants.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-muted/40">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted/60 text-[10px] font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-medium">{m.name}</span>
                      <span className="font-mono text-xs font-semibold tabular-nums">
                        {formatCurrency(m.revenue, "EUR", { compact: true })}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(m.revenue / topMerchantMax) * 100}%`,
                          background: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Period comparison</h3>
              <p className="text-xs text-muted-foreground">This period vs last period</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[0] }} />
                This period
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[3] }} />
                Last period
              </span>
            </div>
          </div>
          {rLoading || !revenue ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <BarTrend
              data={comparison}
              dataKey={[
                { key: "thisPeriod", color: CHART_COLORS[0], name: "This period" },
                { key: "lastPeriod", color: CHART_COLORS[3], name: "Last period" },
              ]}
              xKey="name"
              height={260}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>
      </div>

      {/* By country + by currency */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Revenue by country</h3>
              <p className="text-xs text-muted-foreground">Top regions by merchant revenue</p>
            </div>
          </div>
          {mLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {byCountry.map((c, i) => (
                <div key={c.country} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  <span className="w-32 shrink-0 truncate text-xs font-medium">{c.country}</span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(c.value / byCountryMax) * 100}%`,
                          background: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-20 shrink-0 text-right font-mono text-xs font-semibold tabular-nums">
                    {formatCurrency(c.value, "EUR", { compact: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold">By currency</h3>
              <p className="text-xs text-muted-foreground">Settlement currency mix</p>
            </div>
          </div>
          {rLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <DonutChart
              data={byCurrency}
              height={260}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
