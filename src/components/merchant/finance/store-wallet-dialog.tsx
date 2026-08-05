"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency, formatDateFull } from "@/lib/utils";
import type { FinanceStore } from "@/types";

interface StoreWalletDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  store: FinanceStore | null;
  currency: string;
  generatedAt?: string;
}

const METRICS = [
  { key: "gross" as const, label: "Vendas brutas", tone: "" },
  { key: "fees" as const, label: "Taxas", tone: "text-amber-400" },
  { key: "net" as const, label: "Vendas líquidas", tone: "text-emerald-400" },
  { key: "released" as const, label: "Liberado", tone: "" },
  { key: "operationalBalance" as const, label: "Saldo operacional", tone: "text-primary font-semibold" },
  { key: "paidPayouts" as const, label: "Payouts pagos", tone: "" },
  { key: "scheduledPayouts" as const, label: "Payouts agendados", tone: "text-sky-400" },
] as const;

export function StoreWalletDialog({ open, onOpenChange, store, currency, generatedAt }: StoreWalletDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            {store?.storeName ?? "Store"}
          </DialogTitle>
          <DialogDescription>
            {store?.storeCode} · {currency}
          </DialogDescription>
        </DialogHeader>

        {store && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map((m) => (
                <div
                  key={m.key}
                  className="rounded-lg border border-border/40 bg-background/40 p-3"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {m.label}
                  </p>
                  <p className={
                    "mt-1 font-mono text-sm tabular-nums " + m.tone
                  }>
                    {formatCurrency(store[m.key], currency)}
                  </p>
                </div>
              ))}
            </div>

            {generatedAt && (
              <p className="text-center text-[10px] text-muted-foreground">
                Dados atualizados em {formatDateFull(generatedAt, { withTime: true })}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
