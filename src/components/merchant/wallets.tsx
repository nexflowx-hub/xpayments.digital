"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight,
  Activity, RefreshCw, Lock, Coins,
} from "lucide-react";
import {
  useWallets, useWalletMovements, useFinanceStores,
} from "@/hooks/queries";
import { PageHeader, ErrorState, fadeUp } from "@/components/shared";
import { FinanceCurrencySelector } from "@/components/shared/finance-currency-selector";
import { useFinanceCurrencyStore } from "@/stores/finance-currency";
import { useT } from "@/lib/i18n";
import { StatusBadge } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { formatCurrency, cn, timeAgo } from "@/lib/utils";
import type { Wallet, WalletMovement, FinanceStore } from "@/types";
import { StoreWalletGrid } from "@/components/merchant/finance/store-wallet-card";
import { StoreWalletDialog } from "@/components/merchant/finance/store-wallet-dialog";

const movementTypeLabel: Record<string, string> = {
  deposit: "Deposit", withdraw: "Withdraw", swap: "Swap",
  payment: "Payment", fee: "Fee", payout: "Payout",
};

function NoDataMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Activity className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export default function WalletsPage() {
  const t = useT();
  const financeCurrency = useFinanceCurrencyStore((s) => s.currency);
  const { data: walletsRes, isLoading, isError: wError, refetch: wRefetch } = useWallets();
  const { data: movementsRes } = useWalletMovements();
  const { data: storesRes, isLoading: storesLoading } = useFinanceStores(financeCurrency);

  const wallets: Wallet[] = walletsRes ?? [];
  const allMovements: WalletMovement[] = movementsRes ?? [];
  const financeStores = storesRes?.stores ?? [];
  const currency = storesRes?.currency ?? financeCurrency;

  // Movement currency filter
  const [movementCurrencyFilter, setMovementCurrencyFilter] = React.useState<string | null>(null);

  const filteredMovements = React.useMemo(() => {
    if (!movementCurrencyFilter) return allMovements;
    return allMovements.filter((m) => m.currency === movementCurrencyFilter);
  }, [allMovements, movementCurrencyFilter]);

  // Derive movement currencies for filter buttons
  const movementCurrencies = React.useMemo(() => {
    const seen = new Set<string>();
    for (const m of allMovements) seen.add(m.currency);
    return Array.from(seen);
  }, [allMovements]);

  // Store detail
  const [selectedStore, setSelectedStore] = React.useState<FinanceStore | null>(null);
  const [storeDialogOpen, setStoreDialogOpen] = React.useState(false);

  function handleStoreClick(store: FinanceStore) {
    setSelectedStore(store);
    setStoreDialogOpen(true);
  }

  if (wError) return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.wallets")} description="Carteiras associadas por Store e moeda." />
      <ErrorState message="Não foi possível carregar as carteiras." onRetry={() => wRefetch()} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.wallets")}
        description="Carteiras associadas por Store e moeda."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => wRefetch()} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* ---- Store wallets section ---- */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-sm font-semibold">Carteiras por Store</h3>
              <p className="text-xs text-muted-foreground">Dados financeiros associados a cada loja/moeda.</p>
            </div>
            <FinanceCurrencySelector />
          </div>
          <Badge variant="outline" className="text-[10px]">
            {financeStores.length} stores
          </Badge>
        </div>
        <StoreWalletGrid
          stores={financeStores}
          currency={currency}
          loading={storesLoading && !storesRes}
          onStoreClick={handleStoreClick}
        />
      </Card>

      {/* ---- Wallet cards grid ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading || !walletsRes
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
          : wallets.map((w, i) => {
              const chg = w.changePct ?? 0;
              return (
                <motion.div key={w.id ?? `${w.currency}-${i}`} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}>
                  <Card className="relative overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                    {w.color && (
                      <div
                        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl"
                        style={{ background: `${w.color}22` }}
                      />
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="grid h-9 w-9 place-items-center rounded-lg text-base font-bold"
                          style={{ background: `${w.color ?? "#888"}22`, color: w.color ?? "#888" }}
                        >
                          {w.type === "card" ? "💳" : w.currency.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{w.label ?? w.currency}</p>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            {w.type === "card" ? `Card •${w.cardLast4}` : w.currency}
                          </p>
                        </div>
                      </div>
                      {chg !== 0 && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 font-medium",
                            chg >= 0
                              ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-400"
                              : "border-rose-500/25 bg-rose-500/12 text-rose-400"
                          )}
                        >
                          <Activity className="h-3 w-3" />
                          {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                        </Badge>
                      )}
                    </div>
                    <p className="mt-3 font-mono text-2xl font-semibold tabular-nums">
                      {formatCurrency(w.balance, w.currency)}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Disponível <span className="font-mono text-foreground/80">{formatCurrency(w.available, w.currency)}</span>
                      </span>
                      <span>
                        Reservado <span className="font-mono text-foreground/80">{formatCurrency(w.reserved, w.currency)}</span>
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      {/* ---- No sparkline message ---- */}
      {wallets.length > 0 && (
        <p className="text-center text-[10px] text-muted-foreground">
          Sem histórico disponível
        </p>
      )}

      {/* ---- Disabled operations banner ---- */}
      <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-3">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Operações de depósito, levantamento e câmbio estão indisponíveis nesta versão. O fluxo real de payout encontra-se em <span className="font-medium text-foreground">Payouts & Saídas</span>.
          </p>
        </div>
      </Card>

      {/* ---- Movements table ---- */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Movimentos</h3>
            <p className="text-xs text-muted-foreground">Atividade recente de carteiras.</p>
          </div>
          <div className="flex items-center gap-2">
            {movementCurrencies.length > 1 && (
              <div className="inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5">
                <button
                  onClick={() => setMovementCurrencyFilter(null)}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[11px] font-medium transition",
                    !movementCurrencyFilter
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Todas
                </button>
                {movementCurrencies.map((c) => (
                  <button
                    key={c}
                    onClick={() => setMovementCurrencyFilter(c)}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[11px] font-medium transition",
                      movementCurrencyFilter === c
                        ? "bg-primary/12 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <Badge variant="outline" className="gap-1">{filteredMovements.length} registos</Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                <TableHead className="text-xs font-medium">Referência</TableHead>
                <TableHead className="text-xs font-medium">Tipo</TableHead>
                <TableHead className="text-xs font-medium text-right">Montante</TableHead>
                <TableHead className="text-xs font-medium">Moeda</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!movementsRes
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="my-2 h-7" /></TableCell>
                    </TableRow>
                  ))
                : filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                        {movementCurrencyFilter ? `Sem movimentos em ${movementCurrencyFilter}.` : "Sem movimentos registados."}
                      </TableCell>
                    </TableRow>
                  )
                : filteredMovements.slice(0, 20).map((m) => {
                    const incoming = m.direction === "in";
                    return (
                      <TableRow key={m.id} className="border-border/30">
                        <TableCell className="font-mono text-xs text-primary">{m.reference ?? m.id}</TableCell>
                        <TableCell>
                          <span className="text-xs capitalize">{movementTypeLabel[m.type ?? "payment"] ?? m.type}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-mono text-xs tabular-nums",
                              incoming ? "text-emerald-400" : "text-rose-400"
                            )}
                          >
                            {incoming ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                            {incoming ? "+" : "−"}{formatCurrency(m.amount, m.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-medium text-muted-foreground">{m.currency}</span>
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

      {/* ---- Store Detail Dialog ---- */}
      <StoreWalletDialog
        open={storeDialogOpen}
        onOpenChange={setStoreDialogOpen}
        store={selectedStore}
        currency={currency}
        generatedAt={storesRes?.generatedAt}
      />
    </div>
  );
}
