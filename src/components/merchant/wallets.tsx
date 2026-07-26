"use client";

import * as React from "react";
import {
  Wallet as WalletIcon, Clock, ShieldCheck, ArrowUpRight,
  CalendarClock, RefreshCw, ChevronRight, Landmark,
} from "lucide-react";
import { useFinanceOverview } from "@/hooks/queries";
import { StatCard, PageHeader, ErrorState, EmptyState } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { formatCurrency, formatDateCivil, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useUi } from "@/stores/ui";

export default function WalletsPage() {
  const t = useT();
  const setMerchantView = useUi((s) => s.setMerchantView);
  const { data: finance, isLoading, isError, error, refetch, isFetching } = useFinanceOverview();

  if (isError) {
    const msg = (error as { message?: string })?.message ?? "Failed to load wallet data.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("nav.wallets")} description={t("finance.walletPageDesc")} />
        <ErrorState message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  const walletBalance = finance?.wallet?.balance ?? 0;
  const walletPending = finance?.wallet?.pending ?? 0;
  const walletAvailable = finance?.wallet?.available ?? 0;
  const paidTotal = finance?.payouts?.paid ?? 0;
  const scheduledTotal = finance?.payouts?.scheduled ?? 0;
  const projectedAvailable = finance?.projectedAvailable ?? 0;
  const nextRelease = finance?.nextRelease;
  const cur = finance?.currency ?? "EUR";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.wallets")}
        description={t("finance.walletPageDesc")}
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

      {/* ---- Main KPIs ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label={t("finance.walletTotal")}
              value={walletBalance}
              icon={WalletIcon}
              accent="blue"
              format={(n) => formatCurrency(n, cur)}
            />
            <StatCard
              label={t("finance.pending")}
              value={walletPending}
              icon={Clock}
              accent="amber"
              format={(n) => formatCurrency(n, cur)}
            />
            <StatCard
              label={t("finance.available")}
              value={walletAvailable}
              icon={ShieldCheck}
              accent="green"
              format={(n) => formatCurrency(n, cur)}
            />
          </>
        )}
      </div>

      {/* ---- Wallet composition detail ---- */}
      {isLoading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">{t("finance.walletComposition")}</h3>
            <p className="text-xs text-muted-foreground">{t("finance.walletCompositionDesc")}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-amber-500/10 p-1.5">
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{t("finance.pending")}</p>
              </div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-amber-400">
                {formatCurrency(walletPending, cur)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">{t("finance.pendingDesc")}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-emerald-500/10 p-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{t("finance.available")}</p>
              </div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-emerald-400">
                {formatCurrency(walletAvailable, cur)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">{t("finance.availableDesc")}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ---- Payouts & Projections ---- */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{t("finance.payouts")}</h3>
                <p className="text-xs text-muted-foreground">{t("finance.payoutsDesc")}</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs"
                onClick={() => setMerchantView("finance-payouts")}
              >
                {t("common.viewAll")}
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.paidPayouts")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(paidTotal, cur)}
                  <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                    ({finance?.payouts?.paidCount ?? 0})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.scheduledPayouts")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-amber-400">
                  {formatCurrency(scheduledTotal, cur)}
                  <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                    ({finance?.payouts?.scheduledCount ?? 0})
                  </span>
                </span>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">{t("finance.projections")}</h3>
              <p className="text-xs text-muted-foreground">{t("finance.projectionsDesc")}</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.projectedAvailable")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-emerald-400">
                  {formatCurrency(projectedAvailable, cur)}
                </span>
              </div>
              {nextRelease ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs font-medium">{t("finance.nextRelease")}</p>
                        <p className="text-[10px] text-muted-foreground">{t("finance.estimatedRelease")}: {formatDateCivil(nextRelease.date)}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-primary">
                      {formatCurrency(nextRelease.amount, finance?.currency ?? cur)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("finance.noReleases")}</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ---- Actions coming soon ---- */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted/40 p-2.5">
              <Landmark className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("finance.walletActions")}</p>
              <p className="text-xs text-muted-foreground">{t("finance.walletActionsDesc")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              {t("finance.comingSoon")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
