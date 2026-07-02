"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Target, ShieldCheck, ArrowUpRight,
  ArrowDownRight, Activity, Crown, Wallet as WalletIcon, Zap,
} from "lucide-react";
import { useAnalyticsOverview, useRiskProfile, useWallets, useTransactions } from "@/hooks/queries";
import {
  StatCard, PageHeader, SectionCard, GlowCard, AnimatedCounter, fadeUp,
} from "@/components/shared";
import { StatusBadge, CurrencyBadge, MethodBadge, Sparkline } from "@/components/shared/badges";
import { AreaTrend, DonutChart, BarTrend, CHART_COLORS } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent, timeAgo, cn } from "@/lib/utils";
import { CURRENCIES, PAYMENT_METHODS } from "@/config";

export default function MerchantOverview() {
  const { data: analytics, isLoading: aLoading } = useAnalyticsOverview();
  const { data: risk } = useRiskProfile();
  const { data: wallets } = useWallets();
  const { data: txPage } = useTransactions({ page: 1, pageSize: 6, sortBy: "createdAt", sortDir: "desc" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Real-time view of your payments, revenue and risk."
        actions={
          <>
            <Button variant="outline" size="sm">Export</Button>
            <Button size="sm" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> New payment</Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {aLoading || !analytics ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Revenue (30d)" value={analytics.revenue} change={analytics.revenueChange} icon={DollarSign} accent="blue" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Volume (30d)" value={analytics.volume} change={analytics.volumeChange} icon={TrendingUp} accent="green" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Conversion" value={analytics.conversion} change={analytics.conversionChange} icon={Target} accent="violet" format={(n) => formatPercent(n)} />
            <StatCard label="Approval rate" value={analytics.approvalRate} change={analytics.approvalChange} icon={ShieldCheck} accent="green" format={(n) => formatPercent(n)} />
            <StatCard label="Risk score" value={analytics.riskScore} change={analytics.riskChange} icon={Activity} accent="amber" format={(n) => Math.round(n).toString()} />
          </>
        )}
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Revenue growth</h3>
              <p className="text-xs text-muted-foreground">Net revenue, last 30 days</p>
            </div>
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <ArrowUpRight className="h-3 w-3" /> {analytics?.revenueChange ?? 0}%
            </Badge>
          </div>
          {aLoading || !analytics ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <AreaTrend data={analytics.revenueSeries} formatter={(v) => formatCurrency(v, "EUR", { compact: true })} height={260} />
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Currency distribution</h3>
            <p className="text-xs text-muted-foreground">Volume share by currency</p>
          </div>
          {aLoading || !analytics ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <DonutChart
              data={analytics.currencies.map((c) => ({ name: c.currency, value: c.volume }))}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
              height={260}
            />
          )}
        </Card>
      </div>

      {/* Wallets + realtime */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Wallet balances</h3>
              <p className="text-xs text-muted-foreground">Multi-currency liquidity</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">View all</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {!wallets ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : (
              wallets.data.slice(0, 4).map((w) => {
                const c = CURRENCIES.find((x) => x.code === w.currency);
                return (
                  <div key={w.id} className="relative overflow-hidden rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold" style={{ background: `${w.color}22`, color: w.color }}>
                          {c?.flag}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{w.label}</p>
                          <p className="text-[10px] text-muted-foreground">{w.currency}</p>
                        </div>
                      </div>
                      <span className={cn("text-xs font-medium", w.changePct >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {w.changePct >= 0 ? "+" : ""}{w.changePct}%
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-lg font-semibold tabular-nums">
                      {formatCurrency(w.balance, w.currency, { compact: true })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <h3 className="text-sm font-semibold">Realtime activity</h3>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {analytics?.realtime.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground">{r.ago}</p>
                </div>
                <CurrencyBadge currency={r.currency} amount={r.amount} compact />
              </motion.div>
            )) ?? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        </Card>
      </div>

      {/* Payment methods + top customers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Payment methods</h3>
            <p className="text-xs text-muted-foreground">Volume by method</p>
          </div>
          {aLoading || !analytics ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <BarTrend
              data={analytics.paymentMethods.map((p) => ({ name: p.method, value: p.volume }))}
              dataKey="value"
              xKey="name"
              height={220}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Top customers</h3>
              <p className="text-xs text-muted-foreground">By lifetime value</p>
            </div>
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex flex-col gap-1">
            {analytics?.topCustomers.map((c, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/40">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-muted/60 text-[10px] font-semibold text-muted-foreground">{i + 1}</span>
                <span className="flex-1 truncate text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.orders} orders</span>
                <span className="font-mono text-sm font-semibold tabular-nums">{formatCurrency(c.ltv, "EUR", { compact: true })}</span>
              </div>
            )) ?? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
          </div>
        </Card>
      </div>

      {/* Latest transactions */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Latest transactions</h3>
            <p className="text-xs text-muted-foreground">Most recent payment activity</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">View all</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Reference</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Method</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {txPage?.data.map((t) => (
                <tr key={t.id} className="border-b border-border/30 transition hover:bg-muted/30">
                  <td className="py-2.5 font-mono text-xs text-primary">{t.reference}</td>
                  <td className="py-2.5">
                    <p className="font-medium">{t.customer}</p>
                    <p className="text-xs text-muted-foreground">{t.country}</p>
                  </td>
                  <td className="py-2.5"><MethodBadge method={t.method} /></td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {formatCurrency(t.amount, t.currency)}
                  </td>
                  <td className="py-2.5"><StatusBadge status={t.status} /></td>
                  <td className="py-2.5 text-right text-xs text-muted-foreground">{timeAgo(t.createdAt)}</td>
                </tr>
              )) ?? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6}><Skeleton className="my-2 h-8" /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Risk strip */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Risk score</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">{risk?.score ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">{risk?.trustStatus.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reserve</p>
            <p className="mt-1 text-2xl font-semibold">{risk ? formatPercent(risk.reservePct) : "—"}</p>
            <p className="text-[10px] text-muted-foreground">rolling reserve</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Chargeback rate</p>
            <p className="mt-1 text-2xl font-semibold">{risk ? formatPercent(risk.chargebackRate, 2) : "—"}</p>
            <p className="text-[10px] text-muted-foreground">vs 1% threshold</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
            <p className="mt-1 text-2xl font-semibold text-amber-400">{risk?.alerts.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">needs attention</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
