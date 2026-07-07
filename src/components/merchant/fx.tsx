"use client";

import * as React from "react";
import {
  ArrowLeftRight, TrendingUp, TrendingDown, RefreshCw, Calculator,
  ArrowRight, Coins, Activity, Clock, Zap,
} from "lucide-react";
import { useWallets, useWalletMovements, useWalletSwap } from "@/hooks/queries";
import { PageHeader } from "@/components/shared";
import { Sparkline, StatusBadge } from "@/components/shared/badges";
import { AreaTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  formatCurrency, timeAgo, cn,
} from "@/lib/utils";
import { CURRENCIES } from "@/config";
import type { CurrencyCode } from "@/types";
import { toast } from "sonner";

// EUR value of 1 unit of each currency — single source of truth for the page
const BASE_RATE: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 0.9200,
  BRL: 0.1798,
  GBP: 1.1700,
  USDT: 0.9199,
  BTC: 61861,
};

interface Pair {
  pair: string;
  from: CurrencyCode;
  to: CurrencyCode;
  change: number;
}

const PAIRS: Pair[] = [
  { pair: "EUR/USD", from: "EUR", to: "USD", change: 0.21 },
  { pair: "EUR/BRL", from: "EUR", to: "BRL", change: -0.42 },
  { pair: "USD/BRL", from: "USD", to: "BRL", change: -0.63 },
  { pair: "EUR/GBP", from: "EUR", to: "GBP", change: 0.18 },
  { pair: "BTC/USD", from: "BTC", to: "USD", change: 2.31 },
  { pair: "USDT/USD", from: "USDT", to: "USD", change: -0.01 },
];

function pairRate(from: CurrencyCode, to: CurrencyCode): number {
  return BASE_RATE[from] / BASE_RATE[to];
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function rateSeries(seed: number, base: number, positive: boolean, points = 30) {
  const arr: { date: string; value: number }[] = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (points - 1 - i));
    const noise = Math.sin(seed + i * 1.3) * base * 0.008;
    v = v + (positive ? base * 0.0008 : -base * 0.0008) + noise;
    arr.push({ date: d.toISOString().slice(0, 10), value: Number(v.toFixed(base < 1 ? 6 : base > 1000 ? 2 : 4)) });
  }
  return arr;
}

function sparkSeries(seed: number, positive: boolean, points = 24): number[] {
  const arr: number[] = [];
  let v = 50;
  for (let i = 0; i < points; i++) {
    const noise = Math.sin(seed + i * 1.7) * 6;
    v += (positive ? 0.6 : -0.6) + noise * 0.4;
    arr.push(Math.max(1, v));
  }
  return arr;
}

function fmtRate(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toFixed(4);
  return v.toFixed(6);
}

export default function FxPage() {
  const { data: walletsRes } = useWallets();
  const { data: movementsRes } = useWalletMovements();
  const swapM = useWalletSwap();

  const wallets = walletsRes ?? [];
  const swaps = (movementsRes ?? []).filter((m) => m.type === "swap");

  // Calculator state
  const [from, setFrom] = React.useState<CurrencyCode>("EUR");
  const [to, setTo] = React.useState<CurrencyCode>("USD");
  const [amount, setAmount] = React.useState<string>("1000");

  const rate = pairRate(from, to);
  const numericAmount = parseFloat(amount) || 0;
  const feeRate = 0.005; // 0.5% spread
  const fee = numericAmount * feeRate;
  const result = (numericAmount - fee) * rate;

  const trendSeries = React.useMemo(
    () => rateSeries(hashStr(from + to), rate, true),
    [from, to, rate]
  );

  function swapCurrencies() {
    setFrom(to);
    setTo(from);
  }

  function executeConvert() {
    if (!numericAmount || numericAmount <= 0) { toast.error("Enter a valid amount"); return; }
    if (from === to) { toast.error("Choose different currencies"); return; }
    swapM.mutate(
      { from, to, amount: numericAmount },
      {
        onSuccess: () => {
          toast.success(`Converted ${formatCurrency(numericAmount, from)} → ${formatCurrency(result, to)}`, {
            description: `Rate ${fmtRate(rate)} · fee ${formatCurrency(fee, from)} (0.5%)`,
          });
        },
        onError: () => toast.error("Conversion failed"),
      }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="FX"
        description="Live mid-market rates, multi-currency conversion and recent swap activity."
        actions={
          <Badge variant="outline" className="gap-1.5 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live rates
          </Badge>
        }
      />

      {/* Rates table + calculator */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold">Major pairs</h3>
                <p className="text-xs text-muted-foreground">Mid-market · last 24h</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" /> {PAIRS.length} pairs
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="text-xs font-medium text-muted-foreground">Pair</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">Rate</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">24h</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PAIRS.map((p) => {
                  const r = pairRate(p.from, p.to);
                  const seed = hashStr(p.pair);
                  const spark = sparkSeries(seed, p.change >= 0);
                  const positive = p.change >= 0;
                  return (
                    <TableRow
                      key={p.pair}
                      className="cursor-pointer border-border/40 transition hover:bg-muted/30"
                      onClick={() => { setFrom(p.from); setTo(p.to); }}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-mono text-sm font-semibold">{p.pair}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-sm font-medium tabular-nums">{fmtRate(r)}</TableCell>
                      <TableCell className="py-3 text-right">
                        <span className={cn("inline-flex items-center gap-0.5 font-mono text-xs font-medium tabular-nums", positive ? "text-emerald-400" : "text-rose-400")}>
                          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {positive ? "+" : ""}{p.change.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="w-28">
                          <Sparkline data={spark} color={positive ? "oklch(0.70 0.17 158)" : "oklch(0.66 0.21 20)"} height={28} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Conversion calculator */}
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Conversion calculator</h3>
              <p className="text-xs text-muted-foreground">Live rate · 0.5% spread</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fx-from">From</Label>
              <Select value={from} onValueChange={(v) => setFrom(v as CurrencyCode)}>
                <SelectTrigger id="fx-from" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} — {c.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={swapCurrencies}
                className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-background/40 text-muted-foreground transition hover:bg-muted/60 hover:text-primary"
                title="Swap currencies"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fx-to">To</Label>
              <Select value={to} onValueChange={(v) => setTo(v as CurrencyCode)}>
                <SelectTrigger id="fx-to" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} — {c.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fx-amt">Amount</Label>
              <Input id="fx-amt" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rate</span>
                <span className="font-mono text-foreground">
                  1 {from} = {fmtRate(rate)} {to}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Fee (0.5%)</span>
                <span className="font-mono text-foreground/80">{formatCurrency(fee, from)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3" /> You receive
                </span>
                <span className="font-mono text-lg font-semibold text-emerald-400 tabular-nums">
                  {formatCurrency(result, to)}
                </span>
              </div>
            </div>

            <Button onClick={executeConvert} disabled={swapM.isPending} className="gap-1.5">
              {swapM.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Convert now
            </Button>
          </div>
        </Card>
      </div>

      {/* Rate trend chart */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">
                Rate trend · <span className="font-mono text-primary">{from}/{to}</span>
              </h3>
              <p className="text-xs text-muted-foreground">Mid-market · last 30 days</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold tabular-nums">{fmtRate(rate)}</span>
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <TrendingUp className="h-3 w-3" /> live
            </Badge>
          </div>
        </div>
        <AreaTrend
          key={`${from}-${to}`}
          data={trendSeries}
          dataKey="value"
          xKey="date"
          color="oklch(0.62 0.21 258)"
          height={260}
          formatter={(v) => fmtRate(v)}
        />
      </Card>

      {/* Wallet balances + Recent swaps */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Wallet balances</h3>
              <p className="text-xs text-muted-foreground">Live across currencies</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {!walletsRes
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)
              : wallets.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: w.color }} />
                      <span className="text-xs font-medium">{w.label}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums">
                      {formatCurrency(w.balance, w.currency, { compact: w.balance >= 100000 })}
                    </span>
                  </div>
                ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold">Recent swaps</h3>
                <p className="text-xs text-muted-foreground">Conversion history across wallets</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">{swaps.length} swaps</Badge>
          </div>
          {!movementsRes ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : swaps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 px-3 py-10 text-center text-sm text-muted-foreground">
              No recent swaps recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60">
                    <TableHead className="text-xs font-medium text-muted-foreground">Reference</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Wallet</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Direction</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {swaps.slice(0, 10).map((s) => (
                    <TableRow key={s.id} className="border-border/40">
                      <TableCell className="py-2.5 font-mono text-xs text-primary">{s.reference}</TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground">{s.currency}</TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="gap-1 border-violet-500/25 bg-violet-500/12 text-violet-400">
                          <ArrowLeftRight className="h-3 w-3" /> Swap
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono text-xs tabular-nums">
                        {formatCurrency(s.amount, s.currency, { compact: s.amount >= 10000 })}
                      </TableCell>
                      <TableCell className="py-2.5"><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="py-2.5 text-right text-xs text-muted-foreground">{timeAgo(s.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
