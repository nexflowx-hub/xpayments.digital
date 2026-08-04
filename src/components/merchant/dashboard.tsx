"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Wallet as WalletIcon, Clock,
  Send, RefreshCw, ChevronRight, CalendarIcon,
  ArrowRight, Building2,
} from "lucide-react";
import { useFinanceOverview, useFinanceStores } from "@/hooks/queries";
import { PageHeader, ErrorState } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { useUi } from "@/stores/ui";
import type { FinanceOverview, FinanceStore } from "@/types";

// ---- Month helper ----
const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function buildMonthOptions() {
  const now = new Date();
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    opts.push({ value: val, label: `${MONTH_NAMES_PT[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
}

const MONTH_OPTIONS = buildMonthOptions();

// ---- KpiCard (uniform height) ----
function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
  onClick,
  action,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  sub?: string;
  onClick?: () => void;
  action?: React.ReactNode;
}) {
  const accentBg: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-400",
    violet: "bg-violet-500/10 text-violet-400",
    rose: "bg-rose-500/10 text-rose-400",
  };
  const glowBg: Record<string, string> = {
    emerald: "bg-emerald-500/10",
    primary: "bg-primary/10",
    amber: "bg-amber-500/10",
    violet: "bg-violet-500/10",
    rose: "bg-rose-500/10",
  };
  return (
    <Card
      className={cn(
        "relative min-h-[120px] overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl",
        onClick && "cursor-pointer transition hover:border-primary/40"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl",
        glowBg[accent] ?? ""
      )} />
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn(
          "flex items-center gap-2",
          accentBg[accent] ?? "",
          "rounded-lg p-1.5"
        )}>
          {action}
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

// ---- Drill-down dialog for Wallet / Pending by Store ----
function StoreBreakdownDialog({
  open,
  onOpenChange,
  title,
  field,
  fieldLabel,
  stores,
  currency,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  field: keyof FinanceStore;
  fieldLabel: string;
  stores: FinanceStore[];
  currency: string;
}) {
  const total = stores.reduce((s, st) => s + (st[field] as number), 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription>
            Detalhe por Store &middot; {fieldLabel} &middot; {currency}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                <TableHead className="text-xs font-medium">Store</TableHead>
                <TableHead className="text-xs font-medium text-right">{fieldLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((s) => (
                <TableRow key={s.storeId} className="border-border/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                        {s.storeCode.slice(-2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{s.storeName}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{s.storeCode}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatCurrency(s[field] as number, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-xs font-medium text-muted-foreground">Total ({stores.length} stores)</span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MerchantOverview() {
  const setMerchantView = useUi((s) => s.setMerchantView);
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useFinanceOverview("EUR");
  const { data: storesRes } = useFinanceStores("EUR");

  const d: FinanceOverview | null = overview ?? null;
  const cur = d?.currency ?? "EUR";
  const storesList = storesRes?.stores ?? [];

  // Month selector state
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth);
  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? currentMonth;
  const [monthOpen, setMonthOpen] = React.useState(false);

  // Drill-down state
  const [walletDetailOpen, setWalletDetailOpen] = React.useState(false);
  const [pendingDetailOpen, setPendingDetailOpen] = React.useState(false);

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Painel" description="Visão consolidada de vendas, wallet e payouts." />
        <ErrorState message="Não foi possível carregar os dados financeiros." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel"
        description="Visão consolidada de vendas, wallet e payouts."
        actions={
          <div className="flex items-center gap-2">
            {/* Month selector */}
            <Popover open={monthOpen} onOpenChange={setMonthOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate text-xs">{monthLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="end">
                <div className="max-h-64 overflow-y-auto">
                  {MONTH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedMonth(opt.value); setMonthOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition hover:bg-muted/60",
                        opt.value === selectedMonth && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* ---- KPI Grid (5 cards) ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="min-h-[120px] rounded-xl" />)
        ) : (
          <>
            {/* 1. Vendas brutas do mês */}
            <KpiCard
              label="Vendas brutas do mês"
              value={formatCurrency(d?.sales.month.gross ?? 0, cur)}
              icon={TrendingUp}
              accent="emerald"
            />

            {/* 2. Líquido do mês */}
            <KpiCard
              label="Líquido do mês"
              value={formatCurrency(d?.sales.month.net ?? 0, cur)}
              icon={TrendingUp}
              accent="emerald"
            />

            {/* 3. Wallet total (drill-down) */}
            <KpiCard
              label="Wallet total"
              value={formatCurrency(d?.wallet.balance ?? 0, cur)}
              icon={WalletIcon}
              accent="primary"
              sub="Clique para detalhe por Store"
              onClick={() => setWalletDetailOpen(true)}
            />

            {/* 4. Pendente (drill-down) */}
            <KpiCard
              label="Pendente"
              value={formatCurrency(d?.wallet.pending ?? 0, cur)}
              icon={Clock}
              accent="amber"
              sub="Aguardando liberação · Clique para detalhe"
              onClick={() => setPendingDetailOpen(true)}
            />

            {/* 5. Payouts pagos */}
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

      {/* ---- Quick navigation shortcuts ---- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
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
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
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
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
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

      {/* ---- Drill-down: Wallet by Store ---- */}
      <StoreBreakdownDialog
        open={walletDetailOpen}
        onOpenChange={setWalletDetailOpen}
        title="Wallet total por Store"
        field="operationalBalance"
        fieldLabel="Saldo operacional"
        stores={storesList}
        currency={cur}
      />

      {/* ---- Drill-down: Pending by Store ---- */}
      <StoreBreakdownDialog
        open={pendingDetailOpen}
        onOpenChange={setPendingDetailOpen}
        title="Pendente por Store"
        field="pending"
        fieldLabel="Pendente"
        stores={storesList}
        currency={cur}
      />
    </div>
  );
}
