"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { fadeUp } from "@/components/shared";
import type { FinanceStore } from "@/types";

interface StoreWalletCardProps {
  store: FinanceStore;
  currency: string;
  index?: number;
  onClick?: (store: FinanceStore) => void;
}

export function StoreWalletCard({ store, currency, index = 0, onClick }: StoreWalletCardProps) {
  const hasBalance = store.operationalBalance > 0;
  const monogram = store.storeCode.slice(-2).toUpperCase();

  const handleClick = () => onClick?.(store);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(store);
    }
  };

  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: index * 0.03 }}
    >
      <Card
        role="button"
        tabIndex={0}
        aria-label={`${store.storeName} — ${store.storeCode}`}
        className={cn(
          "group relative overflow-hidden border-border/60 bg-card/60 p-4 backdrop-blur-xl transition-all",
          onClick && "cursor-pointer hover:border-primary/40 hover:shadow-[0_0_20px_-5px_rgba(var(--primary),0.15)]",
          !hasBalance && "opacity-70"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Subtle glow */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
              {monogram}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{store.storeName}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {store.storeCode} · {currency}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                hasBalance
                  ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-400"
                  : "border-border/40 bg-muted/40 text-muted-foreground"
              )}
            >
              {hasBalance ? "Ativo" : "Sem saldo"}
            </Badge>
            {onClick && (
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Líquido acumulado
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-emerald-400">
              {formatCurrency(store.net, currency)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Saldo operacional
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums">
              {formatCurrency(store.operationalBalance, currency)}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/** Grid wrapper for Store cards */
export function StoreWalletGrid({
  stores,
  currency,
  loading,
  onStoreClick,
}: {
  stores: FinanceStore[];
  currency: string;
  loading: boolean;
  onStoreClick?: (store: FinanceStore) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Building2 className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhuma store encontrada.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {stores.map((store, i) => (
        <StoreWalletCard
          key={store.storeId}
          store={store}
          currency={currency}
          index={i}
          onClick={onStoreClick}
        />
      ))}
    </div>
  );
}
