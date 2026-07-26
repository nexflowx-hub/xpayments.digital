"use client";

import * as React from "react";
import {
  RefreshCw, Store as StoreIcon, Eye, EyeOff,
} from "lucide-react";
import { useFinanceStores } from "@/hooks/queries";
import { PageHeader, ErrorState, EmptyState } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import type { FinanceStore } from "@/types";

const HIDDEN_STORES = ["XPAYMENTS-TEST"];

function hasActivity(s: FinanceStore): boolean {
  return (
    (s.transactions > 0) ||
    (s.net > 0) ||
    (s.pending > 0) ||
    (s.paidPayouts > 0) ||
    (s.scheduledPayouts > 0)
  );
}

export default function FinanceStoresPage() {
  const t = useT();
  const { data: storesRes, isLoading, isError, error, refetch, isFetching } = useFinanceStores();
  const [showAll, setShowAll] = React.useState(false);

  const allItems: FinanceStore[] = storesRes?.stores ?? [];
  const cur = storesRes?.currency ?? "EUR";

  const filteredItems = React.useMemo(() => {
    const visible = allItems.filter((s) => !HIDDEN_STORES.includes(s.storeCode?.toUpperCase() ?? "") && !HIDDEN_STORES.includes(s.storeName?.toUpperCase() ?? ""));
    if (showAll) return visible;
    return visible.filter(hasActivity);
  }, [allItems, showAll]);

  if (isError) {
    const msg = (error as { message?: string })?.message ?? "Failed to load store data.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("finance.byStore")} description={t("finance.byStorePageDesc")} />
        <ErrorState message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("finance.byStore")}
        description={t("finance.byStorePageDesc")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={showAll ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="gap-1.5"
            >
              {showAll ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showAll ? t("finance.showActive") : t("finance.showAll")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              {t("common.refresh")}
            </Button>
          </div>
        }
      />

      {/* Stores table — no summary cards (backend does not provide summary) */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={StoreIcon} title={t("finance.noStores")} description={t("finance.noStoresDesc")} />
      ) : (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("finance.storePerformance")}</h3>
              <p className="text-xs text-muted-foreground">{t("finance.storePerformanceDesc")}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">{filteredItems.length} {t("finance.stores")}</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                  <TableHead className="text-xs font-medium">{t("finance.store")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.grossCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.feesCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.netCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.pendingCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.releasedCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.paidPayoutsCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.scheduledPayoutsCol")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.operationalBalance")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("finance.availableAfterPayouts")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((s) => (
                  <TableRow key={s.storeId} className="border-border/30">
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StoreIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <span className="text-xs font-medium">{s.storeName}</span>
                          {s.storeCode && (
                            <p className="text-[10px] text-muted-foreground">{s.storeCode}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatCurrency(s.gross, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-amber-400">
                      {formatCurrency(s.fees, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-emerald-400">
                      {formatCurrency(s.net, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-amber-400">
                      {formatCurrency(s.pending, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatCurrency(s.released, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatCurrency(s.paidPayouts, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-sky-400">
                      {formatCurrency(s.scheduledPayouts, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatCurrency(s.operationalBalance, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-emerald-400">
                      {formatCurrency(s.availableAfterPayouts, cur)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Footnote about availableAfterPayouts */}
          <p className="mt-3 text-[10px] text-muted-foreground">
            * {t("finance.availableAfterPayoutsNote")}
          </p>
        </Card>
      )}
    </div>
  );
}
