"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Target, ShieldCheck, ArrowUpRight,
  Activity, Crown, Wallet as WalletIcon, Zap,
} from "lucide-react";
import { useAnalyticsOverview, useRiskProfile, useWallets, useTransactions } from "@/hooks/queries";
import {
  StatCard, PageHeader, ErrorState,
} from "@/components/shared";
import { StatusBadge, CurrencyBadge, MethodBadge } from "@/components/shared/badges";
import { AreaTrend, DonutChart, BarTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent, timeAgo, cn } from "@/lib/utils";
import { CURRENCIES } from "@/config";
import type { AnalyticsOverview, RiskProfile, Wallet, Transaction } from "@/types";
import { useT } from "@/lib/i18n";

export default function MerchantOverview() {
  const t = useT();
  const { data: analytics, isLoading: aLoading, isError: aError, refetch: aRefetch } = useAnalyticsOverview();
  const { data: risk } = useRiskProfile();
  const { data: wallets } = useWallets();
  const { data: txPage } = useTransactions({ page: 1, limit: 6, sortBy: "createdAt", sortDir: "desc" });

  // Safe accessors — v3.1 shapes
  const a: AnalyticsOverview | null = analytics ?? null;
  const r: RiskProfile | null = risk ?? null;
  const w: Wallet[] = wallets ?? [];
  // v3.1 Paginated has meta: { page, limit, total, pages }
  const txs: Transaction[] = txPage?.data ?? a?.recentTransactions ?? [];

  if (aError) return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dashboard")} description="Visão geral em tempo real dos seus pagamentos, receita e risco." />
      <ErrorState message="Failed to load analytics data. The backend may be unreachable." onRetry={() => aRefetch()} />
    </div>
  );

  // v3.1 stat values from analytics/overview
  const totalBalance = a?.wallet?.totalBalance ?? 0;
  const availableBalance = a?.wallet?.availableBalance ?? 0;
  const txToday = a?.transactions?.today ?? 0;
  const txMonth = a?.transactions?.month ?? 0;
  const txTotal = a?.transactions?.total ?? 0;
  const successRate = a?.transactions?.successRate ?? 0;
  const volumeToday = a?.transactions?.volumeToday ?? 0;
  const volumeMonth = a?.transactions?.volumeMonth ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.dashboard")}
        description="Visão geral em tempo real dos seus pagamentos, receita e risco."
        actions={
          <>
            <Button variant="outline" size="sm">Export</Button>
            <Button size="sm" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> New payment</Button>
          </>
        }
      />

      {/* Stat cards — v3.1 shape */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {aLoading || !a ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Total Balance" value={totalBalance} icon={WalletIcon} accent="blue" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Volume (Today)" value={volumeToday} icon={DollarSign} accent="green" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Volume (Month)" value={volumeMonth} icon={TrendingUp} accent="green" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Success Rate" value={successRate} icon={ShieldCheck} accent="green" format={(n) => formatPercent(n)} />
            <StatCard label="Risk Score" value={r?.score ?? 0} icon={Activity} accent="amber" format={(n) => Math.round(n).toString()} />
          </>
        )}
      </div>

      {/* Wallet + Transaction summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Wallet Balances</h3>
              <p className="text-xs text-muted-foreground">Multi-currency liquidity</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">View all</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {w.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : (
              w.slice(0, 4).map((wallet, i) => {
                const c = CURRENCIES.find((x) => x.code === wallet.currency);
                return (
                  <div key={i} className="relative overflow-hidden rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold bg-primary/10 text-primary">
                          {c?.flag ?? wallet.currency}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{wallet.currency}</p>
                          <p className="text-[10px] text-muted-foreground">{wallet.type}</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 font-mono text-lg font-semibold tabular-nums">
                      {formatCurrency(wallet.balance, wallet.currency, { compact: true })}
                    </p>
                    <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                      <span>Avail {formatCurrency(wallet.available, wallet.currency, { compact: true })}</span>
                      <span>Res {formatCurrency(wallet.reserved, wallet.currency, { compact: true })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Transaction Summary</h3>
            <p className="text-xs text-muted-foreground">Today & this month</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-xs text-muted-foreground">Today</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{txToday}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-xs text-muted-foreground">This Month</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{txMonth}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-xs text-muted-foreground">All Time</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{txTotal}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
              <span className="text-xs text-muted-foreground">Success Rate</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-emerald-400">{formatPercent(successRate)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Latest transactions — from analytics/overview.recentTransactions or transactions API */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Latest Transactions</h3>
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
              {txs.length > 0 ? (
                txs.map((t) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No transactions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Risk strip */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Risk score</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">{r?.score ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">{r?.trustStatus?.replace("_", " ") ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reserve</p>
            <p className="mt-1 text-2xl font-semibold">{r ? formatPercent(r.reservePct) : "—"}</p>
            <p className="text-[10px] text-muted-foreground">rolling reserve</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Chargeback rate</p>
            <p className="mt-1 text-2xl font-semibold">{r ? formatPercent(r.chargebackRate, 2) : "—"}</p>
            <p className="text-[10px] text-muted-foreground">vs 1% threshold</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
            <p className="mt-1 text-2xl font-semibold text-amber-400">{(r?.alerts ?? []).length}</p>
            <p className="text-[10px] text-muted-foreground">needs attention</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
