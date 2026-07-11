"use client";

import * as React from "react";
import {
  Landmark, Wallet, Banknote, TrendingUp, ArrowDownRight,
  ArrowUpRight, PiggyBank, Activity,
} from "lucide-react";
import { useAdminTreasury } from "@/hooks/queries";
import { StatCard, PageHeader, SectionCard, EmptyState } from "@/components/shared";
import { CurrencyBadge } from "@/components/shared/badges";
import { AreaTrend, BarTrend, CHART_COLORS } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CURRENCIES } from "@/config";
import { cn, formatCurrency, formatPercent, timeAgo } from "@/lib/utils";
import type { CurrencyCode } from "@/types";

// Mock pending payouts feed (deterministic, derived in-component)
const pendingPayoutsFeed = [
  { id: "po_1", merchant: "Nimbus Labs", amount: 48200, currency: "EUR" as CurrencyCode, beneficiary: "IBAN ••4821", createdAt: "2025-11-22T07:30:00Z" },
  { id: "po_2", merchant: "Quanta Pay", amount: 12980, currency: "USD" as CurrencyCode, beneficiary: "Wise ••7782", createdAt: "2025-11-22T05:12:00Z" },
  { id: "po_3", merchant: "Vertex Commerce", amount: 84200, currency: "BRL" as CurrencyCode, beneficiary: "Pix ••9921", createdAt: "2025-11-21T22:01:00Z" },
  { id: "po_4", merchant: "Helix Retail", amount: 6240, currency: "EUR" as CurrencyCode, beneficiary: "IBAN ••2210", createdAt: "2025-11-21T18:44:00Z" },
  { id: "po_5", merchant: "Atlas Supply", amount: 33900, currency: "GBP" as CurrencyCode, beneficiary: "Faster Payments ••1182", createdAt: "2025-11-21T14:09:00Z" },
];

export default function AdminTreasuryPage() {
  const { data: t, isLoading } = useAdminTreasury();

  const totalBalances = (t?.balances ?? []).reduce((s, b) => s + b.amount, 0) || 1;
  const reservePct = t ? (t.reserve / t.totalLiquidity) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Treasury"
        description="Platform-wide liquidity, reserves and cash flow."
        breadcrumbs={[{ label: "Admin" }, { label: "Treasury" }]}
        actions={
          <Badge variant="outline" className="gap-1.5 border-emerald-500/25 bg-emerald-500/12 text-xs text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live settlement
          </Badge>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total liquidity"
              value={t?.totalLiquidity ?? 0}
              change={t?.liquidityChange}
              icon={Landmark}
              accent="blue"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Reserve"
              value={t?.reserve ?? 0}
              icon={PiggyBank}
              accent="violet"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Pending payouts"
              value={t?.pendingPayouts ?? 0}
              icon={Banknote}
              accent="amber"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Net flow (30d)"
              value={t?.netFlow ?? 0}
              icon={TrendingUp}
              accent="green"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
          </>
        )}
      </div>

      {/* Cash flow + settlement */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Cash flow</h3>
              <p className="text-xs text-muted-foreground">Inflow vs outflow, last 30 days</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[1] }} />
                Inflow
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[4] }} />
                Outflow
              </span>
            </div>
          </div>
          {isLoading || !t ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <BarTrend
              data={t?.cashFlowSeries ?? []}
              dataKey={[
                { key: "inflow", color: CHART_COLORS[1], name: "Inflow" },
                { key: "outflow", color: CHART_COLORS[4], name: "Outflow" },
              ]}
              xKey="date"
              stacked
              height={260}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Settlement</h3>
              <p className="text-xs text-muted-foreground">Net settled volume, 14 days</p>
            </div>
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <ArrowUpRight className="h-3 w-3" /> 6.4%
            </Badge>
          </div>
          {isLoading || !t ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <AreaTrend
              data={t?.settlementSeries ?? []}
              color={CHART_COLORS[2]}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
              height={260}
            />
          )}
        </Card>
      </div>

      {/* Balances + reserve utilization */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Balances by currency</h3>
              <p className="text-xs text-muted-foreground">Platform-wide treasury holdings</p>
            </div>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          {isLoading || !t ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">24h change</TableHead>
                  <TableHead className="w-[30%]">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(t?.balances ?? []).map((b) => {
                  const share = (b.amount / totalBalances) * 100;
                  const c = CURRENCIES.find((x) => x.code === b.currency);
                  return (
                    <TableRow key={b.currency}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{c?.flag}</span>
                          <span className="font-mono text-xs font-medium">{b.currency}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {formatCurrency(b.amount, b.currency, { compact: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 font-mono text-xs",
                            b.changePct >= 0 ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {b.changePct >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {Math.abs(b.changePct).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">
                            {share.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold">Reserve utilization</h3>
          </div>
          {isLoading || !t ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Reserved</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatCurrency(t.reserve, "EUR", { compact: true })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatPercent(reservePct)} of total liquidity
                </p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Utilization</span>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      reservePct > 15 ? "text-amber-400" : "text-emerald-400"
                    )}
                  >
                    {formatPercent(reservePct)}
                  </span>
                </div>
                <Progress
                  value={reservePct}
                  className={cn(
                    "h-2",
                    reservePct > 15 && "[&>div]:bg-amber-400",
                    reservePct > 25 && "[&>div]:bg-rose-400"
                  )}
                />
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Threshold: 10% target · 25% hard cap
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Available</p>
                  <p className="font-mono text-sm font-semibold">
                    {formatCurrency(t.totalLiquidity - t.reserve, "EUR", { compact: true })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Deployed</p>
                  <p className="font-mono text-sm font-semibold text-violet-400">
                    {formatCurrency(t.reserve, "EUR", { compact: true })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Pending payouts */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold">Pending payouts</h3>
              <p className="text-xs text-muted-foreground">Awaiting settlement rail execution</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 border-amber-500/25 bg-amber-500/12 text-amber-400">
            {pendingPayoutsFeed.length} queued
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead>Reference</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Initiated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingPayoutsFeed.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs text-primary">{p.id}</TableCell>
                <TableCell className="font-medium">{p.merchant}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.beneficiary}</TableCell>
                <TableCell className="text-right">
                  <CurrencyBadge currency={p.currency} amount={p.amount} compact />
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {timeAgo(p.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
