"use client";

import * as React from "react";
import {
  TrendingUp, Wallet as WalletIcon, Clock, ArrowUpRight,
  ShieldCheck, RefreshCw, CalendarClock, ChevronRight,
} from "lucide-react";
import { useFinanceOverview } from "@/hooks/queries";
import {
  StatCard, PageHeader, ErrorState, EmptyState,
} from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateCivil, cn } from "@/lib/utils";
import type { FinanceOverview } from "@/types";
import { useT } from "@/lib/i18n";
import { useUi } from "@/stores/ui";

export default function MerchantOverview() {
  const t = useT();
  const setMerchantView = useUi((s) => s.setMerchantView);
  const { data: finance, isLoading, isError, error, refetch, isFetching } = useFinanceOverview();

  const f: FinanceOverview | null = finance ?? null;
  const cur = f?.currency ?? "EUR";

  if (isError) {
    const msg = (error as { message?: string })?.message ?? "Failed to load financial data.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("nav.dashboard")} description={t("finance.dashboardDesc")} />
        <ErrorState message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  const walletBalance = f?.wallet?.balance ?? 0;
  const walletPending = f?.wallet?.pending ?? 0;
  const walletAvailable = f?.wallet?.available ?? 0;
  const grossToday = f?.sales?.today?.gross ?? 0;
  const netToday = f?.sales?.today?.net ?? 0;
  const netWeek = f?.sales?.week?.net ?? 0;
  const netMonth = f?.sales?.month?.net ?? 0;
  const paidTotal = f?.payouts?.paid ?? 0;
  const nextRelease = f?.nextRelease;
  const projectedAvailable = f?.projectedAvailable ?? 0;
  const feesToday = f?.sales?.today?.fees ?? 0;
  const txToday = f?.sales?.today?.transactions ?? 0;
  const txMonth = f?.sales?.month?.transactions ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.dashboard")}
        description={t("finance.dashboardDesc")}
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

      {/* ---- KPI Cards ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label={t("finance.grossToday")}
              value={grossToday}
              icon={TrendingUp}
              accent="green"
              format={(n) => formatCurrency(n, cur, { compact: true })}
            />
            <StatCard
              label={t("finance.netToday")}
              value={netToday}
              icon={TrendingUp}
              accent="green"
              format={(n) => formatCurrency(n, cur, { compact: true })}
            />
            <StatCard
              label={t("finance.netWeek")}
              value={netWeek}
              icon={TrendingUp}
              accent="green"
              format={(n) => formatCurrency(n, cur, { compact: true })}
            />
            <StatCard
              label={t("finance.netMonth")}
              value={netMonth}
              icon={TrendingUp}
              accent="green"
              format={(n) => formatCurrency(n, cur, { compact: true })}
            />
            <StatCard
              label={t("finance.walletTotal")}
              value={walletBalance}
              icon={WalletIcon}
              accent="blue"
              format={(n) => formatCurrency(n, cur, { compact: true })}
            />
          </>
        )}
      </div>

      {/* ---- Second row ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label={t("finance.pending")}
              value={walletPending}
              icon={Clock}
              accent="amber"
              format={(n) => formatCurrency(n, cur, { compact: true })}
            />
            <StatCard
              label={t("finance.available")}
              value={walletAvailable}
              icon={ShieldCheck}
              accent="green"
              format={(n) => formatCurrency(n, cur, { compact: true })}
            />
            <StatCard
              label={t("finance.paidPayouts")}
              value={paidTotal}
              icon={ArrowUpRight}
              accent="violet"
              format={(n) => formatCurrency(n, cur, { compact: true })}
            />
            <StatCard
              label={t("finance.nextRelease")}
              value={nextRelease?.amount ?? 0}
              icon={CalendarClock}
              accent="blue"
              format={(n) =>
                nextRelease
                  ? `${formatCurrency(n, f?.currency ?? cur, { compact: true })} · ${formatDateCivil(nextRelease.date)}`
                  : "—"
              }
            />
          </>
        )}
      </div>

      {/* ---- Wallet composition ---- */}
      {isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("finance.walletComposition")}</h3>
              <p className="text-xs text-muted-foreground">{t("finance.walletCompositionDesc")}</p>
            </div>
            <Button
              variant="ghost" size="sm" className="gap-1 text-xs"
              onClick={() => setMerchantView("wallets")}
            >
              {t("common.viewAll")}
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">{t("finance.walletTotal")}</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                {formatCurrency(walletBalance, cur)}
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs text-muted-foreground">{t("finance.pending")}</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-amber-400">
                {formatCurrency(walletPending, cur)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-muted-foreground">{t("finance.available")}</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-emerald-400">
                {formatCurrency(walletAvailable, cur)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ---- Quick financial summary ---- */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Sales summary */}
          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">{t("finance.salesSummary")}</h3>
              <p className="text-xs text-muted-foreground">{t("finance.salesSummaryDesc")}</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.grossToday")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(grossToday, cur)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.registeredFees")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(feesToday, cur)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.netToday")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-emerald-400">
                  {formatCurrency(netToday, cur)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.netMonth")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-emerald-400">
                  {formatCurrency(netMonth, cur)}
                </span>
              </div>
              <div className="mt-1 flex gap-4 text-[10px] text-muted-foreground">
                <span>{txToday} {t("finance.transactionsToday")}</span>
                <span>{txMonth} {t("finance.transactionsMonth")}</span>
              </div>
            </div>
          </Card>

          {/* Payouts summary */}
          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{t("finance.payoutsSummary")}</h3>
                <p className="text-xs text-muted-foreground">{t("finance.payoutsSummaryDesc")}</p>
              </div>
              <Button
                variant="ghost" size="sm" className="gap-1 text-xs"
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
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.paidCount")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {f?.payouts?.paidCount ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.scheduledPayouts")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-amber-400">
                  {formatCurrency(f?.payouts?.scheduled ?? 0, cur)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{t("finance.projectedAvailable")}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-emerald-400">
                  {formatCurrency(projectedAvailable, cur)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---- Next release card ---- */}
      {isLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : nextRelease ? (
        <Card className="border-primary/30 bg-primary/5 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t("finance.nextReleaseTitle")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("finance.estimatedRelease")}: {formatDateCivil(nextRelease.date)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-xl font-semibold tabular-nums text-primary">
                {formatCurrency(nextRelease.amount, f?.currency ?? cur)}
              </p>
              <Badge variant="outline" className="mt-1 text-[10px]">
                {t("finance.awaitingRelease")}
              </Badge>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={CalendarClock}
          title={t("finance.noReleases")}
          description={t("finance.noReleasesDesc")}
        />
      )}
    </div>
  );
}
