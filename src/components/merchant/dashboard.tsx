"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Wallet as WalletIcon, Send, RefreshCw, ChevronRight,
} from "lucide-react";
import { useFinanceOverview, useFinanceStores } from "@/hooks/queries";
import { PageHeader, ErrorState } from "@/components/shared";
import { FinanceCurrencySelector } from "@/components/shared/finance-currency-selector";
import { useFinanceCurrencyStore } from "@/stores/finance-currency";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { useUi } from "@/stores/ui";
import { StoreWalletGrid } from "@/components/merchant/finance/store-wallet-card";
import { StoreWalletDialog } from "@/components/merchant/finance/store-wallet-dialog";
import type { FinanceOverview, FinanceStore } from "@/types";

// ---- Animated KPI Card ----
function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  sub?: string;
  onClick?: () => void;
}) {
  const accentBg: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    primary: "bg-primary/10 text-primary",
    violet: "bg-violet-500/10 text-violet-400",
  };
  const glowBg: Record<string, string> = {
    emerald: "bg-emerald-500/10",
    primary: "bg-primary/10",
    violet: "bg-violet-500/10",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={label}
        onKeyDown={onClick ? (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
        } : undefined}
        className={cn(
          "relative min-h-[120px] overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl",
          "transition-all duration-200",
          onClick && "cursor-pointer hover:border-primary/40 hover:shadow-[0_0_24px_-6px_rgba(var(--primary),0.15)]"
        )}
        onClick={onClick}
      >
        <div className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-opacity",
          glowBg[accent] ?? ""
        )} />
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={cn(
            "rounded-lg p-1.5",
            accentBg[accent] ?? "",
          )}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>}
      </Card>
    </motion.div>
  );
}

function KpiSkeleton() {
  return (
    <div className="min-h-[120px] rounded-xl bg-muted/30 animate-pulse" />
  );
}

export default function MerchantOverview() {
  const setMerchantView = useUi((s) => s.setMerchantView);
  const financeCurrency = useFinanceCurrencyStore((s) => s.currency);
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useFinanceOverview(financeCurrency);
  const { data: storesRes, isLoading: storesLoading } = useFinanceStores(financeCurrency);

  const d: FinanceOverview | null = overview ?? null;
  const cur = d?.currency ?? financeCurrency;
  const storesList = storesRes?.stores ?? [];

  // Store detail dialog
  const [selectedStore, setSelectedStore] = React.useState<FinanceStore | null>(null);
  const [storeDialogOpen, setStoreDialogOpen] = React.useState(false);

  function handleStoreClick(store: FinanceStore) {
    setSelectedStore(store);
    setStoreDialogOpen(true);
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Painel" description="Visão consolidada de vendas, wallet e payouts." />
        <ErrorState message="Não foi possível carregar os dados financeiros." onRetry={() => refetch()} />
      </div>
    );
  }

  const todayTx = d?.sales.today.transactions;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel"
        description="Visão consolidada de vendas, wallet e payouts."
        actions={
          <div className="flex items-center gap-2">
            <FinanceCurrencySelector />
            {isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* ---- KPI Grid (4 cards) ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            {/* 1. Vendas brutas de hoje */}
            <KpiCard
              label="Vendas brutas de hoje"
              value={formatCurrency(d?.sales.today.gross ?? 0, cur)}
              icon={TrendingUp}
              accent="emerald"
              sub={todayTx != null ? `${todayTx} transações` : undefined}
            />

            {/* 2. Vendas líquidas de hoje */}
            <KpiCard
              label="Vendas líquidas de hoje"
              value={formatCurrency(d?.sales.today.net ?? 0, cur)}
              icon={TrendingUp}
              accent="emerald"
              sub="Líquido contabilizado das vendas de hoje"
            />

            {/* 3. Wallet total */}
            <KpiCard
              label="Wallet total"
              value={formatCurrency(d?.wallet.balance ?? 0, cur)}
              icon={WalletIcon}
              accent="primary"
              sub="Saldo operacional após payouts e ajustes contabilísticos"
              onClick={() => setMerchantView("wallets")}
            />

            {/* 4. Payouts pagos */}
            <KpiCard
              label="Payouts pagos"
              value={formatCurrency(d?.payouts.paid ?? 0, cur)}
              icon={Send}
              accent="violet"
              sub={`${d?.payouts.paidCount ?? 0} payouts`}
            />
          </>
        )}
      </div>

      {/* ---- Carteiras por Store ---- */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Carteiras por Store</h3>
            <p className="text-xs text-muted-foreground">Dados financeiros associados a cada loja/moeda.</p>
          </div>
        </div>
        <StoreWalletGrid
          stores={storesList}
          currency={cur}
          loading={storesLoading && !storesRes}
          onStoreClick={handleStoreClick}
        />
      </Card>

      {/* ---- Quick navigation shortcuts ---- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          role="button"
          tabIndex={0}
          aria-label="Liberações"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMerchantView("finance-releases"); }}}
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40 hover:shadow-[0_0_20px_-5px_rgba(var(--primary),0.12)]"
          onClick={() => setMerchantView("finance-releases")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Liberações</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Calendário de liberações previstas.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
        <Card
          role="button"
          tabIndex={0}
          aria-label="Payouts e Saídas"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMerchantView("finance-payouts"); }}}
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40 hover:shadow-[0_0_20px_-5px_rgba(var(--primary),0.12)]"
          onClick={() => setMerchantView("finance-payouts")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Payouts & Saídas</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Extratos de pagamento processados e agendados.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
        <Card
          role="button"
          tabIndex={0}
          aria-label="Por Store"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMerchantView("finance-stores"); }}}
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40 hover:shadow-[0_0_20px_-5px_rgba(var(--primary),0.12)]"
          onClick={() => setMerchantView("finance-stores")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Por Store</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Dados financeiros por unidade de venda.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
      </div>

      {/* ---- Store Detail Dialog ---- */}
      <StoreWalletDialog
        open={storeDialogOpen}
        onOpenChange={setStoreDialogOpen}
        store={selectedStore}
        currency={cur}
        generatedAt={storesRes?.generatedAt}
      />
    </div>
  );
}
