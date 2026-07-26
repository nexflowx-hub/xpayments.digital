"use client";

import * as React from "react";
import {
  RefreshCw, CalendarClock, Store as StoreIcon, ArrowDownLeft,
} from "lucide-react";
import { useFinanceReleases } from "@/hooks/queries";
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
import type { FinanceReleaseItem } from "@/types";

const releaseStatusMap: Record<string, { label: string; className: string }> = {
  expected: { label: "Prevista", className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
  overdue: { label: "Estimativa ultrapassada", className: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
};

function ReleaseStatusBadge({ status }: { status: string }) {
  const s = releaseStatusMap[status] ?? { label: status, className: "border-border bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={cn("text-[10px]", s.className)}>{s.label}</Badge>;
}

/** Stable key from date + storeId + storeCode */
function releaseKey(r: FinanceReleaseItem): string {
  return `${r.date}__${r.storeId ?? "none"}__${r.storeCode ?? "none"}`;
}

export default function FinanceReleasesPage() {
  const t = useT();
  const { data: releases, isLoading, isError, error, refetch, isFetching } = useFinanceReleases();

  const items = releases?.items ?? [];
  const summary = releases?.summary;
  const cur = releases?.currency ?? "EUR";

  // Group by date
  const grouped = React.useMemo(() => {
    const map = new Map<string, FinanceReleaseItem[]>();
    items.forEach((r) => {
      const key = r.date?.split("T")[0] ?? "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [items]);

  if (isError) {
    const msg = (error as { message?: string })?.message ?? "Failed to load releases.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("finance.releases")} description={t("finance.releasesPageDesc")} />
        <ErrorState message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("finance.releases")}
        description={t("finance.releasesPageDesc")}
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            {t("common.refresh")}
          </Button>
        }
      />

      {/* Summary — only what backend provides: totalNet, movementCount, overdueNet */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">{t("finance.totalNet")}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-400">
              {formatCurrency(summary.totalNet, cur)}
            </p>
          </Card>
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">{t("finance.movementsCol")}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
              {summary.movementCount}
            </p>
          </Card>
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">{t("finance.overdueNet")}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-amber-400">
              {formatCurrency(summary.overdueNet, cur)}
            </p>
          </Card>
        </div>
      ) : null}

      {/* Releases table / grouped list */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState icon={CalendarClock} title={t("finance.noReleases")} description={t("finance.noReleasesDesc")} />
      ) : (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("finance.releasesList")}</h3>
              <p className="text-xs text-muted-foreground">{t("finance.releasesListDesc")}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">{items.length} {t("finance.movements")}</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                  <TableHead className="text-xs font-medium">{t("finance.estimatedDate")}</TableHead>
                  <TableHead className="text-xs font-medium">{t("finance.store")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.grossCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.feesCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.netCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.movementsCol")}</TableHead>
                  <TableHead className="text-xs font-medium">{t("finance.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={releaseKey(r)} className="border-border/30">
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDateCivil(r.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StoreIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{r.storeName ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatCurrency(r.gross, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-amber-400">
                      {formatCurrency(r.fees, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-emerald-400">
                      {formatCurrency(r.net, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {r.movementCount}
                    </TableCell>
                    <TableCell><ReleaseStatusBadge status={r.status} /></TableCell>
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
