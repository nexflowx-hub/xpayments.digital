"use client";

import * as React from "react";
import {
  RefreshCw, ArrowUpRight, FileText, Store as StoreIcon,
} from "lucide-react";
import { usePayoutStatements } from "@/hooks/queries";
import { PageHeader, ErrorState, EmptyState } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { formatCurrency, formatDateCivil, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import type { PayoutStatement, PayoutStatementStatus } from "@/types";

const payoutStatusMap: Record<PayoutStatementStatus, { label: string; className: string }> = {
  paid: { label: "Pago", className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
  scheduled: { label: "Programado", className: "border-sky-500/25 bg-sky-500/12 text-sky-400" },
  processing: { label: "Em processamento", className: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
  draft: { label: "Rascunho", className: "border-border bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelado", className: "border-rose-500/25 bg-rose-500/12 text-rose-400" },
  failed: { label: "Falhou", className: "border-rose-500/25 bg-rose-500/12 text-rose-400" },
};

function PayoutStatusBadge({ status }: { status: PayoutStatementStatus }) {
  const s = payoutStatusMap[status] ?? { label: status, className: "border-border bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={cn("text-[10px]", s.className)}>{s.label}</Badge>;
}

export default function FinancePayoutsPage() {
  const t = useT();
  const { data: payoutRes, isLoading, isError, error, refetch, isFetching } = usePayoutStatements();

  if (isError) {
    const msg = (error as { message?: string })?.message ?? "Failed to load payout statements.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("finance.payoutsAndExits")} description={t("finance.payoutsPageDesc")} />
        <ErrorState message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  const items: PayoutStatement[] = payoutRes?.items ?? [];
  const summary = payoutRes?.summary;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("finance.payoutsAndExits")}
        description={t("finance.payoutsPageDesc")}
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            {t("common.refresh")}
          </Button>
        }
      />

      {/* Summary */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">{t("finance.paidPayouts")}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-400">
              {formatCurrency(summary.totalPaid, "EUR")}
              <span className="ml-2 text-xs font-normal text-muted-foreground">({summary.totalPaidCount})</span>
            </p>
          </Card>
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">{t("finance.scheduledPayouts")}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-amber-400">
              {formatCurrency(summary.totalScheduled, "EUR")}
              <span className="ml-2 text-xs font-normal text-muted-foreground">({summary.totalScheduledCount})</span>
            </p>
          </Card>
        </div>
      ) : null}

      {/* Payouts table */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState icon={ArrowUpRight} title={t("finance.noPayouts")} description={t("finance.noPayoutsDesc")} />
      ) : (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("finance.payoutStatements")}</h3>
              <p className="text-xs text-muted-foreground">{t("finance.payoutStatementsDesc")}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">{items.length} {t("finance.statements")}</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                  <TableHead className="text-xs font-medium">{t("finance.statementNumber")}</TableHead>
                  <TableHead className="text-xs font-medium">{t("finance.stores")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.valueCol")}</TableHead>
                  <TableHead className="text-xs font-medium">{t("finance.currency")}</TableHead>
                  <TableHead className="text-xs font-medium">{t("finance.status")}</TableHead>
                  <TableHead className="text-xs font-medium">{t("finance.scheduledDate")}</TableHead>
                  <TableHead className="text-xs font-medium">{t("finance.paidDate")}</TableHead>
                  <TableHead className="text-xs font-medium">{t("finance.description")}</TableHead>
                  <TableHead className="text-xs font-medium">{t("finance.reference")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ps) => (
                  <TableRow key={ps.id} className="border-border/30">
                    <TableCell className="font-mono text-xs text-primary">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        {ps.statementNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {ps.stores?.slice(0, 2).map((a) => (
                          <span key={a.storeId} className="flex items-center gap-1 text-xs">
                            <StoreIcon className="h-3 w-3 text-muted-foreground" />
                            {a.storeName}
                          </span>
                        ))}
                        {(ps.stores?.length ?? 0) > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{(ps.stores?.length ?? 0) - 2} {t("finance.moreStores")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatCurrency(ps.value, ps.currency)}
                    </TableCell>
                    <TableCell className="text-xs">{ps.currency}</TableCell>
                    <TableCell><PayoutStatusBadge status={ps.status} /></TableCell>
                    <TableCell className="text-xs">
                      {ps.scheduledDate ? formatDateCivil(ps.scheduledDate) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {ps.historicalDateOnly && ps.paidOn
                        ? formatDateCivil(ps.paidOn)
                        : ps.paidAt
                          ? formatDateCivil(ps.paidAt)
                          : "—"}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                      {ps.description || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {ps.externalReference || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
