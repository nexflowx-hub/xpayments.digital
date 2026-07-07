"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  TrendingUp, Lock, Activity, RefreshCw, CheckCircle2,
  ArrowRight, Coins,
} from "lucide-react";
import {
  useWallets, useWalletMovements, useWalletDeposit, useWalletPayout, useWalletSwap,
} from "@/hooks/queries";
import { StatCard, PageHeader, fadeUp } from "@/components/shared";
import { StatusBadge, Sparkline } from "@/components/shared/badges";
import { DonutChart } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { formatCurrency, formatNumber, cn, timeAgo } from "@/lib/utils";
import { CURRENCIES, PAYMENT_METHODS } from "@/config";
import type { CurrencyCode, Wallet, WalletMovement } from "@/types";
import { toast } from "sonner";

const EUR_RATES: Record<CurrencyCode, number> = {
  EUR: 1, USD: 0.92, BRL: 0.18, GBP: 1.17, USDT: 0.99, BTC: 42000,
};

function genSpark(seed: number, positive: boolean): number[] {
  const arr: number[] = [];
  let v = 50;
  for (let i = 0; i < 18; i++) {
    const noise = (Math.sin(seed + i * 1.7) + Math.cos(seed + i * 0.9)) * 6;
    v += (positive ? 1.3 : -1.3) + noise * 0.45;
    arr.push(Math.max(1, v));
  }
  return arr;
}

const movementTypeLabel: Record<WalletMovement["type"], string> = {
  deposit: "Deposit", withdraw: "Withdraw", swap: "Swap",
  payment: "Payment", fee: "Fee", payout: "Payout",
};

export default function WalletsPage() {
  const { data: walletsRes, isLoading } = useWallets();
  const { data: movementsRes } = useWalletMovements();
  const depositM = useWalletDeposit();
  const payoutM = useWalletPayout();
  const swapM = useWalletSwap();

  const wallets: Wallet[] = walletsRes ?? [];
  const movements: WalletMovement[] = movementsRes ?? [];

  const totalEur = wallets.reduce((s, w) => s + w.balance * EUR_RATES[w.currency], 0);
  const availableEur = wallets.reduce((s, w) => s + w.available * EUR_RATES[w.currency], 0);
  const reservedEur = wallets.reduce((s, w) => s + w.reserved * EUR_RATES[w.currency], 0);
  const weightedChange = totalEur
    ? wallets.reduce((s, w) => s + w.changePct * (w.balance * EUR_RATES[w.currency]), 0) / totalEur
    : 0;

  const [depositOpen, setDepositOpen] = React.useState(false);
  const [payoutOpen, setPayoutOpen] = React.useState(false);
  const [swapOpen, setSwapOpen] = React.useState(false);

  // deposit form
  const [depCurrency, setDepCurrency] = React.useState<CurrencyCode>("EUR");
  const [depAmount, setDepAmount] = React.useState<string>("");
  const [depMethod, setDepMethod] = React.useState<string>("sepa");

  // payout form
  const [poCurrency, setPoCurrency] = React.useState<CurrencyCode>("EUR");
  const [poAmount, setPoAmount] = React.useState<string>("");
  const [poBeneficiary, setPoBeneficiary] = React.useState<string>("");

  // swap form
  const [swapFrom, setSwapFrom] = React.useState<CurrencyCode>("EUR");
  const [swapTo, setSwapTo] = React.useState<CurrencyCode>("USD");
  const [swapAmount, setSwapAmount] = React.useState<string>("");

  const swapRate = EUR_RATES[swapFrom] / EUR_RATES[swapTo];
  const swapConverted = (parseFloat(swapAmount) || 0) * swapRate;

  const walletById = React.useMemo(() => {
    const m = new Map<string, Wallet>();
    wallets.forEach((w) => m.set(w.id, w));
    return m;
  }, [wallets]);

  const allocationData = wallets.map((w) => ({
    name: w.currency,
    value: w.balance * EUR_RATES[w.currency],
  }));

  function resetDeposit() {
    setDepAmount(""); setDepMethod("sepa");
  }
  function resetPayout() {
    setPoAmount(""); setPoBeneficiary("");
  }
  function resetSwap() {
    setSwapAmount("");
  }

  function submitDeposit() {
    const amount = parseFloat(depAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    depositM.mutate(
      { currency: depCurrency, amount, method: depMethod },
      {
        onSuccess: () => { toast.success(`Deposit of ${formatCurrency(amount, depCurrency)} initiated`); setDepositOpen(false); resetDeposit(); },
        onError: () => toast.error("Deposit failed"),
      }
    );
  }
  function submitPayout() {
    const amount = parseFloat(poAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!poBeneficiary.trim()) { toast.error("Beneficiary IBAN is required"); return; }
    payoutM.mutate(
      { currency: poCurrency, amount, beneficiary: poBeneficiary.trim() },
      {
        onSuccess: () => { toast.success(`Payout of ${formatCurrency(amount, poCurrency)} queued`); setPayoutOpen(false); resetPayout(); },
        onError: () => toast.error("Payout failed"),
      }
    );
  }
  function submitSwap() {
    const amount = parseFloat(swapAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (swapFrom === swapTo) { toast.error("Choose different currencies"); return; }
    swapM.mutate(
      { from: swapFrom, to: swapTo, amount },
      {
        onSuccess: () => {
          toast.success(`Swapped ${formatCurrency(amount, swapFrom)} → ${formatCurrency(amount * swapRate, swapTo)}`, { description: `Rate ${swapRate.toFixed(4)} · executed` });
          setSwapOpen(false); resetSwap();
        },
        onError: () => toast.error("Swap failed"),
      }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Wallets"
        description="Multi-currency treasury across fiat, crypto and card balances."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDepositOpen(true)}>
              <ArrowDownLeft className="h-3.5 w-3.5" /> Deposit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPayoutOpen(true)}>
              <ArrowUpRight className="h-3.5 w-3.5" /> Withdraw
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setSwapOpen(true)}>
              <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !walletsRes ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Total balance" value={totalEur} change={weightedChange} icon={WalletIcon} accent="blue" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Available" value={availableEur} icon={Coins} accent="green" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Reserved" value={reservedEur} icon={Lock} accent="amber" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="24h change" value={weightedChange} icon={Activity} accent="violet" format={(n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`} />
          </>
        )}
      </div>

      {/* Wallet cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading || !walletsRes
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
          : wallets.map((w, i) => {
              const c = CURRENCIES.find((x) => x.code === w.currency);
              const spark = genSpark(i + 1, w.changePct >= 0);
              return (
                <motion.div key={w.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}>
                  <Card className="relative overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl"
                      style={{ background: `${w.color}22` }}
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="grid h-9 w-9 place-items-center rounded-lg text-base font-bold"
                          style={{ background: `${w.color}22`, color: w.color }}
                        >
                          {w.type === "card" ? "💳" : c?.flag}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{w.label}</p>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            {w.type === "card" ? `Card •${w.cardLast4}` : w.currency}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 font-medium",
                          w.changePct >= 0
                            ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-400"
                            : "border-rose-500/25 bg-rose-500/12 text-rose-400"
                        )}
                      >
                        {w.changePct >= 0 ? <TrendingUp className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                        {w.changePct >= 0 ? "+" : ""}{w.changePct}%
                      </Badge>
                    </div>

                    <p className="mt-3 font-mono text-2xl font-semibold tabular-nums">
                      {formatCurrency(w.balance, w.currency, { compact: w.balance >= 100000 })}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Avail <span className="font-mono text-foreground/80">{formatCurrency(w.available, w.currency, { compact: true })}</span>
                      </span>
                      <span>
                        Res <span className="font-mono text-foreground/80">{formatCurrency(w.reserved, w.currency, { compact: true })}</span>
                      </span>
                    </div>

                    <div className="mt-3">
                      <Sparkline data={spark} color={w.color} height={32} />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      {/* Movements + allocation */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Movements</h3>
              <p className="text-xs text-muted-foreground">Recent wallet activity across all balances</p>
            </div>
            <Badge variant="outline" className="gap-1">{movements.length} records</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                  <TableHead className="text-xs font-medium">Reference</TableHead>
                  <TableHead className="text-xs font-medium">Wallet</TableHead>
                  <TableHead className="text-xs font-medium">Type</TableHead>
                  <TableHead className="text-xs font-medium text-right">Amount</TableHead>
                  <TableHead className="text-xs font-medium">Status</TableHead>
                  <TableHead className="text-xs font-medium text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!movementsRes
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="my-2 h-7" /></TableCell>
                      </TableRow>
                    ))
                  : movements.slice(0, 12).map((m) => {
                      const w = walletById.get(m.walletId);
                      const incoming = m.direction === "in";
                      return (
                        <TableRow key={m.id} className="border-border/30">
                          <TableCell className="font-mono text-xs text-primary">{m.reference}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: w?.color ?? "#888" }}
                              />
                              <span className="text-xs">{w?.label ?? m.walletId}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs capitalize">{movementTypeLabel[m.type]}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 font-mono text-xs tabular-nums",
                                incoming ? "text-emerald-400" : "text-rose-400"
                              )}
                            >
                              {incoming ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              {incoming ? "+" : "−"}{formatCurrency(m.amount, m.currency, { compact: m.amount >= 10000 })}
                            </span>
                          </TableCell>
                          <TableCell><StatusBadge status={m.status} /></TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{timeAgo(m.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Balance allocation</h3>
            <p className="text-xs text-muted-foreground">Share of total liquidity by currency</p>
          </div>
          {!walletsRes ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <DonutChart data={allocationData} height={240} formatter={(v) => formatCurrency(v, "EUR", { compact: true })} />
          )}
        </Card>
      </div>

      {/* ---- Deposit Dialog ---- */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowDownLeft className="h-4 w-4 text-emerald-400" /> Deposit funds</DialogTitle>
            <DialogDescription>Add funds to one of your wallets via bank rail or instant method.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dep-cur">Currency</Label>
              <Select value={depCurrency} onValueChange={(v) => setDepCurrency(v as CurrencyCode)}>
                <SelectTrigger id="dep-cur" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} — {c.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dep-amt">Amount</Label>
              <Input id="dep-amt" type="number" placeholder="0.00" value={depAmount} onChange={(e) => setDepAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dep-mth">Method</Label>
              <Select value={depMethod} onValueChange={setDepMethod}>
                <SelectTrigger id="dep-mth" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button onClick={submitDeposit} disabled={depositM.isPending} className="gap-1.5">
              {depositM.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Confirm deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Payout Dialog ---- */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-rose-400" /> Withdraw funds</DialogTitle>
            <DialogDescription>Send a payout to a beneficiary IBAN. Funds leave the selected wallet immediately.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="po-cur">From wallet</Label>
              <Select value={poCurrency} onValueChange={(v) => setPoCurrency(v as CurrencyCode)}>
                <SelectTrigger id="po-cur" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="po-amt">Amount</Label>
              <Input id="po-amt" type="number" placeholder="0.00" value={poAmount} onChange={(e) => setPoAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="po-ben">Beneficiary IBAN</Label>
              <Input id="po-ben" placeholder="PT50 0002 0123 1234 5678 9015 4" value={poBeneficiary} onChange={(e) => setPoBeneficiary(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancel</Button>
            <Button onClick={submitPayout} disabled={payoutM.isPending} className="gap-1.5">
              {payoutM.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
              Confirm payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Swap Dialog ---- */}
      <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-primary" /> Convert currency</DialogTitle>
            <DialogDescription>Swap between wallet balances at live mid-market rates.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>From</Label>
                <Select value={swapFrom} onValueChange={(v) => setSwapFrom(v as CurrencyCode)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>To</Label>
                <Select value={swapTo} onValueChange={(v) => setSwapTo(v as CurrencyCode)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sw-amt">Amount</Label>
              <Input id="sw-amt" type="number" placeholder="0.00" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} />
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rate</span>
                <span className="font-mono text-foreground">
                  1 {swapFrom} = {swapRate.toFixed(swapRate < 1 ? 4 : 2)} {swapTo}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>You receive</span>
                <span className="font-mono text-sm font-semibold text-emerald-400">
                  {formatCurrency(swapConverted, swapTo)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwapOpen(false)}>Cancel</Button>
            <Button onClick={submitSwap} disabled={swapM.isPending} className="gap-1.5">
              {swapM.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
              Execute swap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
