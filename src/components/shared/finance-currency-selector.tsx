"use client";

import * as React from "react";
import { Coins } from "lucide-react";
import { useFinanceCurrencyStore } from "@/stores/finance-currency";
import { useWallets } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FinanceCurrencySelector({ className }: { className?: string }) {
  const { currency, setCurrency } = useFinanceCurrencyStore();
  const { data: wallets } = useWallets();

  // Derive available currencies from wallets, remove duplicates, fallback to ["EUR"]
  const currencies = React.useMemo(() => {
    if (!wallets || wallets.length === 0) return ["EUR"];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const w of wallets) {
      if (!seen.has(w.currency)) {
        seen.add(w.currency);
        list.push(w.currency);
      }
    }
    return list;
  }, [wallets]);

  // If the stored currency is not in the available list, reset to first available
  React.useEffect(() => {
    if (currencies.length > 0 && !currencies.includes(currency)) {
      setCurrency(currencies[0]);
    }
  }, [currencies, currency, setCurrency]);

  if (currencies.length <= 1) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5",
              className,
            )}
          >
            <Coins className="mr-1 h-3 w-3 text-muted-foreground" />
            {currencies.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium transition",
                  currency === c
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Moeda da conta</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
