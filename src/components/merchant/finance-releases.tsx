"use client";

import * as React from "react";
import {
  RefreshCw, CalendarClock,
} from "lucide-react";
import { useFinanceReleases } from "@/hooks/queries";
import { PageHeader, ErrorState, EmptyState } from "@/components/shared";
import { formatCurrency, formatDateCivil, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import type { FinanceNextRelease } from "@/types";

const releaseStatusMap: Record<string, { label: string; className: string }> = {
  expected: { label: "Prevista", className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
  overdue: { label: "Estimativa ultrapassada", className: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
};

function ReleaseStatusBadge({ status }: { status: string }) {
  const s = releaseStatusMap[status] ?? { label: status, className: "border-border bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={cn("text-[10px]", s.className)}>{s.label}</Badge>;
}

export default function FinanceReleasesPage() {
  const { data: releases, isLoading, isError, error, refetch, isFetching } = useFinanceReleases("EUR");

  const items: FinanceNextRelease[] = releases?.items ?? [];
  const summary = releases?.summary;
  const cur = releases?.currency ?? "EUR";

  if (isError) {
    const msg = (error as { message?: string })?.message ?? "Não foi possível carregar as liberações.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Liberações" description="Calendário de liberações previstas pelo backend." />
        <ErrorState message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Liberações"
        description="Calendário de liberações previstas pelo backend."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      {/* Summary */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">Total líquido</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-400">
              {formatCurrency(summary.totalNet, cur)}
            </p>
          </Card>
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">Movimentos</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
              {summary.movementCount}
            </p>
          </Card>
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">Líquido em atraso</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-amber-400">
              {formatCurrency(summary.overdueNet, cur)}
            </p>
          </Card>
        </div>
      ) : null}

      {/* Releases table */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nenhuma liberação encontrada"
          description="Não há liberações previstas no momento."
        />
      ) : (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Lista de liberações</h3>
              <p className="text-xs text-muted-foreground">Próximas liberações por data e valor.</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {items.length} liberações
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                  <TableHead className="text-xs font-medium">Data prevista</TableHead>
                  <TableHead className="text-xs font-medium text-right">Valor</TableHead>
                  <TableHead className="text-xs font-medium text-right">Movimentos</TableHead>
                  <TableHead className="text-xs font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r, i) => (
                  <TableRow key={`${r.date}-${i}`} className="border-border/30">
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDateCivil(r.date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatCurrency(r.amount, cur)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {r.movementCount}
                    </TableCell>
                    <TableCell>
                      <ReleaseStatusBadge status={r.status} />
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
