"use client";

import * as React from "react";
import { useFxStore } from "@/stores/fx";
import type { DisplayCurrency } from "@/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const options: { value: DisplayCurrency; label: string; symbol: string }[] = [
  { value: "BRL", label: "BRL", symbol: "R$" },
  { value: "USDT", label: "USDT", symbol: "₮" },
];

export function DisplayCurrencySelector({ className }: { className?: string }) {
  const { displayCurrency, setDisplayCurrency } = useFxStore();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5", className)}>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDisplayCurrency(opt.value)}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium transition",
                  displayCurrency === opt.value
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Conversão apenas indicativa. Não altera a moeda contabilística da Wallet.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
