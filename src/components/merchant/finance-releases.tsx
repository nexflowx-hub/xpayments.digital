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

type ProviderRelease = FinanceNextRelease & {
  storeId?: string | null;
  storeCode?: string | null;
  storeName?: string | null;
  gateway?: string | null;
  net?: number;
  providerStatus?: "pending" | "available" | "unknown";
  operationalStatus?: "expected" | "awaiting_admin";
  providerSyncedAt?: string | null;
};

type ProviderReleaseSummary = {
  totalNet: number;
  movementCount: number;
  overdueNet: number;
  awaitingAdminNet?: number;
};

const releaseStatusMap: Record<string, { label: string; className: string }> = {
  expected: {
    label: "Prevista",
    className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400",
  },
  awaiting_admin: {
    label: "Aguarda validação",
    className: "border-amber-500/25 bg-amber-500/12 text-amber-400",
  },
  overdue: {
    label: "Aguarda validação",
    className: "border-amber-500/25 bg-amber-500/12 text-amber-400",
  },
};

const providerStatusMap: Record<string, { label: string; className: string }> = {
  available: {
    label: "Disponível no provedor",
    className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400",
  },
  pending: {
    label: "Pendente no provedor",
    className: "border-sky-500/25 bg-sky-500/12 text-sky-400",
  },
  unknown: {
    label: "A sincronizar",
    className: "border-border bg-muted text-muted-foreground",
  },
};

function ReleaseStatusBadge({ status }: { status: string }) {
  const s = releaseStatusMap[status] ?? {
    label: status,
    className: "border-border bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px]", s.className)}>
      {s.label}
    </Badge>
  );
}

function ProviderStatusBadge({ status }: { status?: string }) {
  const normalized = status || "unknown";
  const s = providerStatusMap[normalized] ?? providerStatusMap.unknown;

  return (
    <Badge variant="outline" className={cn("text-[10px]", s.className)}>
      {s.label}
    </Badge>
  );
}

export default function FinanceReleasesPage() {
  const { data: releases, isLoading, isError, error, refetch, isFetching } = useFinanceReleases("EUR");

  const items = (releases?.items ?? []) as ProviderRelease[];
  const summary = releases?.summary as ProviderReleaseSummary | undefined;
  const cur = releases?.currency ?? "EUR";

  if (isError) {
    const msg = (error as { message?: string })?.message ?? "Não foi possível carregar as liberações.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Liberações"
          description="Calendário previsto de disponibilidade dos seus fundos."
        />
        <ErrorState message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Liberações"
        description="Calendário previsto de disponibilidade dos seus fundos."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-xs text-sky-300">
        As datas apresentadas são previsões informativas. A disponibilização e os payouts permanecem sujeitos à validação operacional da XPayments.
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">Total previsto</p>
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
            <p className="text-xs text-muted-foreground">Aguarda validação administrativa</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-amber-400">
              {formatCurrency(summary.awaitingAdminNet ?? summary.overdueNet, cur)}
            </p>
          </Card>
        </div>
      ) : null}

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nenhuma liberação encontrada"
          description="Não há previsões de liberação no momento."
        />
      ) : (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Calendário de liberações</h3>
              <p className="text-xs text-muted-foreground">
                Valores previstos agrupados por data de disponibilidade.
              </p>
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
                  <TableHead className="text-xs font-medium">Gateway</TableHead>
                  <TableHead className="text-xs font-medium">Store</TableHead>
                  <TableHead className="text-xs font-medium text-right">Valor previsto</TableHead>
                  <TableHead className="text-xs font-medium text-right">Movimentos</TableHead>
                  <TableHead className="text-xs font-medium">Provedor</TableHead>
                  <TableHead className="text-xs font-medium">Operação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r, i) => {
                  const operationStatus = r.operationalStatus ?? r.status;

                  return (
                    <TableRow key={`${r.date}-${r.storeId ?? r.storeCode ?? i}-${r.gateway ?? i}`} className="border-border/30">
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDateCivil(r.date)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.gateway || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <p className="font-medium">{r.storeName || "—"}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{r.storeCode || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold tabular-nums text-emerald-400">
                        {formatCurrency(r.amount, cur)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {r.movementCount}
                      </TableCell>
                      <TableCell>
                        <ProviderStatusBadge status={r.providerStatus} />
                      </TableCell>
                      <TableCell>
                        <ReleaseStatusBadge status={operationStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
