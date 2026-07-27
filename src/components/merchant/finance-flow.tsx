"use client";

import * as React from "react";
import {
  TrendingUp, Wallet as WalletIcon, ArrowUpRight, Clock,
  RefreshCw, ChevronRight,
} from "lucide-react";
import { useFinanceOverview } from "@/hooks/queries";
import { StatCard, PageHeader, ErrorState } from "@/components/shared";
import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUi } from "@/stores/ui";

export default function FinanceFlowPage() {
  const setMerchantView = useUi((s) => s.setMerchantView);
  const {
    data: finance,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFinanceOverview("EUR");

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Fluxo Financeiro"
          description="Visão consolidada de vendas, wallet e payouts."
        />
        <ErrorState
          message="Não foi possível carregar os dados financeiros."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const s = finance?.sales;
  const w = finance?.wallet;
  const p = finance?.payouts;
  const cur = finance?.currency ?? "EUR";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fluxo Financeiro"
        description="Visão consolidada de vendas, wallet e payouts."
        actions={
          <div className="flex items-center gap-2">
            {isFetching && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  isFetching && "animate-spin"
                )}
              />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* ---- Sales overview ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Vendas brutas (mês)"
              value={s?.month?.gross ?? 0}
              icon={TrendingUp}
              accent="green"
              format={(n) => formatCurrency(n, cur)}
            />
            <StatCard
              label="Taxas registradas (mês)"
              value={s?.month?.fees ?? 0}
              icon={TrendingUp}
              accent="amber"
              format={(n) => formatCurrency(n, cur)}
            />
            <StatCard
              label="Líquido (mês)"
              value={s?.month?.net ?? 0}
              icon={TrendingUp}
              accent="green"
              format={(n) => formatCurrency(n, cur)}
            />
            <StatCard
              label="Wallet total"
              value={w?.balance ?? 0}
              icon={WalletIcon}
              accent="blue"
              format={(n) => formatCurrency(n, cur)}
            />
          </>
        )}
      </div>

      {/* ---- Wallet & Payouts detail ---- */}
      {isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pendente"
            value={w?.pending ?? 0}
            icon={Clock}
            accent="amber"
            format={(n) => formatCurrency(n, cur)}
          />
          <StatCard
            label="Disponível"
            value={w?.available ?? 0}
            icon={WalletIcon}
            accent="green"
            format={(n) => formatCurrency(n, cur)}
          />
          <StatCard
            label="Payouts pagos"
            value={p?.paid ?? 0}
            icon={ArrowUpRight}
            accent="violet"
            format={(n) => formatCurrency(n, cur)}
          />
          <StatCard
            label="Disponível projetado"
            value={finance?.projectedAvailable ?? 0}
            icon={WalletIcon}
            accent="green"
            format={(n) => formatCurrency(n, cur)}
          />
        </div>
      )}

      {/* ---- Quick navigation cards ---- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
          onClick={() => setMerchantView("finance-releases")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Liberações</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Calendário de liberações previstas.
              </p>
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
              <p className="mt-0.5 text-xs text-muted-foreground">
                Extratos de pagamento processados e agendados.
              </p>
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
              <p className="mt-0.5 text-xs text-muted-foreground">
                Dados financeiros por unidade de venda.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
      </div>
    </div>
  );
}
