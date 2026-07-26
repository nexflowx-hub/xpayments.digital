"use client";

import * as React from "react";
import {
  TrendingUp, Wallet as WalletIcon, ArrowUpRight, Clock,
  RefreshCw, Store as StoreIcon, ChevronRight,
} from "lucide-react";
import { useFinanceOverview, useFinanceReleases, usePayoutStatements, useFinanceStores } from "@/hooks/queries";
import { StatCard, PageHeader, ErrorState, EmptyState } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { formatCurrency, formatDateCivil, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useUi } from "@/stores/ui";

export default function FinanceFlowPage() {
  const t = useT();
  const setMerchantView = useUi((s) => s.setMerchantView);
  const { data: finance, isLoading, isError, error, refetch, isFetching } = useFinanceOverview();

  if (isError) {
    const msg = (error as { message?: string })?.message ?? "Failed to load financial data.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("finance.flowTitle")} description={t("finance.flowDesc")} />
        <ErrorState message={msg} onRetry={() => refetch()} />
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
        title={t("finance.flowTitle")}
        description={t("finance.flowDesc")}
        actions={
          <div className="flex items-center gap-2">
            {isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              {t("common.refresh")}
            </Button>
          </div>
        }
      />

      {/* ---- Sales overview ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label={t("finance.grossMonth")} value={s?.month?.gross ?? 0} icon={TrendingUp} accent="green"
              format={(n) => formatCurrency(n, cur, { compact: true })} />
            <StatCard label={t("finance.registeredFeesMonth")} value={s?.month?.fees ?? 0} icon={TrendingUp} accent="amber"
              format={(n) => formatCurrency(n, cur, { compact: true })} />
            <StatCard label={t("finance.netMonth")} value={s?.month?.net ?? 0} icon={TrendingUp} accent="green"
              format={(n) => formatCurrency(n, cur, { compact: true })} />
            <StatCard label={t("finance.walletTotal")} value={w?.balance ?? 0} icon={WalletIcon} accent="blue"
              format={(n) => formatCurrency(n, cur, { compact: true })} />
          </>
        )}
      </div>

      {/* ---- Wallet & Payouts detail ---- */}
      {isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t("finance.pending")} value={w?.pending ?? 0} icon={Clock} accent="amber"
            format={(n) => formatCurrency(n, cur, { compact: true })} />
          <StatCard label={t("finance.available")} value={w?.available ?? 0} icon={WalletIcon} accent="green"
            format={(n) => formatCurrency(n, cur, { compact: true })} />
          <StatCard label={t("finance.paidPayouts")} value={p?.paid ?? 0} icon={ArrowUpRight} accent="violet"
            format={(n) => formatCurrency(n, cur, { compact: true })} />
          <StatCard label={t("finance.projectedAvailable")} value={finance?.projectedAvailable ?? 0} icon={WalletIcon} accent="green"
            format={(n) => formatCurrency(n, cur, { compact: true })} />
        </div>
      )}

      {/* ---- Quick navigation cards ---- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
          onClick={() => setMerchantView("finance-releases")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("finance.releases")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("finance.releasesDesc")}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
        <Card className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
          onClick={() => setMerchantView("finance-payouts")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("finance.payoutsAndExits")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("finance.payoutsAndExitsDesc")}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
        <Card className="group cursor-pointer border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40"
          onClick={() => setMerchantView("finance-stores")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("finance.byStore")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("finance.byStoreDesc")}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </Card>
      </div>
    </div>
  );
}
