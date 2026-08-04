"use client";

import * as React from "react";
import {
  RefreshCw, ArrowUpRight, FileText, Store as StoreIcon,
} from "lucide-react";
import { usePayoutStatements } from "@/hooks/queries";
import { PageHeader, ErrorState, EmptyState } from "@/components/shared";
import { PayoutRequestPanel } from "@/components/merchant/payout-requests/payout-request-panel";
import { formatCurrency, formatDateCivil, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import type { PayoutStatementV4 } from "@/types";

const payoutStatusMap: Record<string, { label: string; className: string }> = {
  paid: { label: "Pago", className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
  scheduled: { label: "Programado", className: "border-sky-500/25 bg-sky-500/12 text-sky-400" },
  processing: { label: "Em processamento", className: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
  draft: { label: "Rascunho", className: "border-border bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelado", className: "border-rose-500/25 bg-rose-500/12 text-rose-400" },
  failed: { label: "Falhou", className: "border-rose-500/25 bg-rose-500/12 text-rose-400" },
};

function PayoutStatusBadge({ status }: { status: string }) {
  const s = payoutStatusMap[status] ?? { label: status, className: "border-border bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={cn("text-[10px]", s.className)}>{s.label}</Badge>;
}

export default function FinancePayoutsPage() {
  const { data: payoutRes, isLoading, isError, error, refetch, isFetching } = usePayoutStatements("EUR");

  if (isError) {
    const msg = (error as { message?: string })?.message ?? "Não foi possível carregar os extratos de pagamento.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Payouts & Saídas" description="Extratos de pagamento processados e agendados." />
        <ErrorState message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  const items: PayoutStatementV4[] = payoutRes?.items ?? [];
  const summary = payoutRes?.summary;
  const cur = payoutRes?.currency ?? "EUR";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payouts & Saídas"
        description="Extratos de pagamento processados e agendados."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      {/* Payout Requests panel — hidden when feature disabled, non-blocking */}
      <PayoutRequestPanel />

      {/* Summary */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">Total pago</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-400">
              {formatCurrency(summary.paidAmount, cur)}
              <span className="ml-2 text-xs font-normal text-muted-foreground">({summary.paidCount})</span>
            </p>
          </Card>
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">Agendado</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-amber-400">
              {formatCurrency(summary.scheduledAmount, cur)}
              <span className="ml-2 text-xs font-normal text-muted-foreground">({summary.scheduledCount})</span>
            </p>
          </Card>
        </div>
      ) : null}

      {/* Payouts table */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ArrowUpRight}
          title="Nenhum payout encontrado"
          description="Não há extratos de pagamento registados."
        />
      ) : (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Extratos de pagamento</h3>
              <p className="text-xs text-muted-foreground">Todos os extratos processados e agendados.</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {items.length} extratos
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                  <TableHead className="text-xs font-medium">Extrato</TableHead>
                  <TableHead className="text-xs font-medium">Stores</TableHead>
                  <TableHead className="text-xs font-medium text-right">Valor</TableHead>
                  <TableHead className="text-xs font-medium">Moeda</TableHead>
                  <TableHead className="text-xs font-medium">Status</TableHead>
                  <TableHead className="text-xs font-medium">Agendado para</TableHead>
                  <TableHead className="text-xs font-medium">Pago em</TableHead>
                  <TableHead className="text-xs font-medium">Referência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ps) => (
                  <TableRow key={ps.id} className="border-border/30">
                    <TableCell className="font-mono text-xs text-primary">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        {ps.statementCode}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {ps.allocations?.slice(0, 2).map((a) => (
                          <span key={a.storeId} className="flex items-center gap-1 text-xs">
                            <StoreIcon className="h-3 w-3 text-muted-foreground" />
                            {a.storeName}
                          </span>
                        ))}
                        {(ps.allocations?.length ?? 0) > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{(ps.allocations?.length ?? 0) - 2} mais
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatCurrency(ps.amount, ps.currency)}
                    </TableCell>
                    <TableCell className="text-xs">{ps.currency}</TableCell>
                    <TableCell><PayoutStatusBadge status={ps.status} /></TableCell>
                    <TableCell className="text-xs">
                      {formatDateCivil(ps.scheduledFor)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {ps.paidOn ? formatDateCivil(ps.paidOn) : "—"}
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
