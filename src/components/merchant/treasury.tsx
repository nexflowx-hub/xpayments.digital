"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Banknote, PiggyBank, ArrowDownToLine, Activity, ArrowUpRight, ArrowDownRight,
  ArrowDownLeft, ArrowUpLeft, RefreshCw, Wallet as WalletIcon, Landmark,
  CreditCard, Coins,
} from "lucide-react";
import { useTreasury, useWallets, useWalletMovements } from "@/hooks/queries";
import { PageHeader, StatCard, fadeUp } from "@/components/shared";
import { AreaTrend, BarTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatPercent, timeAgo } from "@/lib/utils";
import { CURRENCIES } from "@/config";
import type { CurrencyCode, WalletMovement } from "@/types";

const movementIcon: Record<WalletMovement["type"], React.ComponentType<{ className?: string }>> = {
  deposit: ArrowDownLeft,
  withdraw: ArrowUpRight,
  swap: RefreshCw,
  payment: ArrowDownLeft,
  fee: ArrowUpRight,
  payout: ArrowUpRight,
};

const movementColor: Record<WalletMovement["type"], string> = {
  deposit: "text-emerald-400 bg-emerald-500/10",
  withdraw: "text-rose-400 bg-rose-500/10",
  swap: "text-violet-400 bg-violet-500/10",
  payment: "text-sky-400 bg-sky-500/10",
  fee: "text-amber-400 bg-amber-500/10",
  payout: "text-rose-400 bg-rose-500/10",
};

function walletTypeMeta(type: "fiat" | "crypto" | "card") {
  if (type === "crypto") return { icon: Coins, label: "Crypto", color: "text-amber-400" };
  if (type === "card") return { icon: CreditCard, label: "Card", color: "text-violet-400" };
  return { icon: Landmark, label: "Fiat", color: "text-sky-400" };
}

export default function TreasuryPage() {
  const { data: treasury, isLoading } = useTreasury();
  const { data: wallets } = useWallets();
  const { data: movements } = useWalletMovements();

  const totalBalances = React.useMemo(
    () => (treasury?.balances ?? []).reduce((s, b) => s + b.amount, 0),
    [treasury],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Treasury"
        description="Liquidity, reserves, settlement and cash flow across all wallets."
        actions={
          <>
            <Button variant="outline" size="sm">Export</Button>
            <Button size="sm" className="gap-1.5"><Banknote className="h-3.5 w-3.5" /> Settle now</Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !treasury ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Total liquidity"
              value={treasury.totalLiquidity}
              change={treasury.liquidityChange}
              icon={Banknote}
              accent="blue"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Reserve"
              value={treasury.reserve}
              icon={PiggyBank}
              accent="amber"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Pending payouts"
              value={treasury.pendingPayouts}
              icon={ArrowDownToLine}
              accent="rose"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Net flow (30d)"
              value={treasury.netFlow}
              change={treasury.liquidityChange}
              icon={Activity}
              accent="green"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
          </>
        )}
      </div>

      {/* Cash flow + settlement */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Cash flow</h3>
              <p className="text-xs text-muted-foreground">Daily inflow vs outflow, last 30 days</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.70 0.17 158)" }} />
                Inflow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.68 0.20 20)" }} />
                Outflow
              </span>
            </div>
          </div>
          {isLoading || !treasury ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <BarTrend
              data={treasury.cashFlowSeries}
              dataKey={[
                { key: "inflow", color: "oklch(0.70 0.17 158)", name: "Inflow" },
                { key: "outflow", color: "oklch(0.68 0.20 20)", name: "Outflow" },
              ]}
              stacked
              height={260}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Settlement</h3>
            <p className="text-xs text-muted-foreground">Net settled volume, last 14 days</p>
          </div>
          {isLoading || !treasury ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <AreaTrend
              data={treasury.settlementSeries}
              color="oklch(0.66 0.20 300)"
              height={260}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>
      </div>

      {/* Balances table */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Currency balances</h3>
            <p className="text-xs text-muted-foreground">Allocation across fiat and crypto wallets</p>
          </div>
          <Badge variant="outline" className="border-border/60 bg-muted/30">
            {treasury?.balances.length ?? 0} currencies
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Currency</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="pb-2 text-right font-medium">24h</th>
                <th className="pb-2 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {(treasury?.balances ?? []).map((b) => {
                const c = CURRENCIES.find((x) => x.code === b.currency);
                const share = totalBalances ? (b.amount / totalBalances) * 100 : 0;
                const positive = b.changePct >= 0;
                return (
                  <tr key={b.currency} className="border-b border-border/30 transition hover:bg-muted/30">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-muted/40 text-sm">{c?.flag}</span>
                        <div>
                          <p className="font-medium">{b.currency}</p>
                          <p className="text-[10px] text-muted-foreground">{c?.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums">{formatCurrency(b.amount, b.currency)}</td>
                    <td className="py-3 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 text-xs font-medium",
                        positive ? "text-emerald-400" : "text-rose-400",
                      )}>
                        {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(b.changePct).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted/60">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">{share.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Movements + internal wallets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Recent movements</h3>
              <p className="text-xs text-muted-foreground">Deposits, payouts, swaps and fees</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">View all</Button>
          </div>
          <div className="flex flex-col gap-1">
            {(movements ?? []).slice(0, 8).map((m) => {
              const Icon = movementIcon[m.type];
              const isIn = m.direction === "in";
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/40"
                >
                  <div className={cn("rounded-lg p-1.5", movementColor[m.type])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize">{m.type}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{m.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-mono text-sm font-semibold tabular-nums",
                      isIn ? "text-emerald-400" : "text-foreground",
                    )}>
                      {isIn ? "+" : "−"}{formatCurrency(m.amount, m.currency)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(m.createdAt)}</p>
                  </div>
                </div>
              );
            }) ?? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <WalletIcon className="h-4 w-4 text-primary" />
              Internal wallets
            </h3>
            <p className="text-xs text-muted-foreground">All active balances</p>
          </div>
          <div className="flex flex-col gap-2">
            {(wallets ?? []).slice(0, 6).map((w) => {
              const meta = walletTypeMeta(w.type);
              const c = CURRENCIES.find((x) => x.code === w.currency);
              return (
                <div
                  key={w.id}
                  className="rounded-lg border border-border/40 bg-background/40 p-3 transition hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-muted/40 text-sm">{c?.flag}</span>
                      <div>
                        <p className="text-xs font-medium">{w.label}</p>
                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <meta.icon className={cn("h-2.5 w-2.5", meta.color)} />
                          {meta.label}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      w.changePct >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}>
                      {w.changePct >= 0 ? "+" : ""}{w.changePct}%
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-base font-semibold tabular-nums">
                    {formatCurrency(w.balance, w.currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatCurrency(w.available, w.currency)} available · {formatCurrency(w.reserved, w.currency)} reserved
                  </p>
                </div>
              );
            }) ?? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        </Card>
      </div>
    </div>
  );
}
