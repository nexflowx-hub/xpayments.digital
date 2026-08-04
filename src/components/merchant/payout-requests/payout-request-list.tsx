"use client";

import * as React from "react";
import {
  RefreshCw, ArrowUpRight, Edit3, Trash2, Send, ShieldCheck, AlertTriangle, Eye, RotateCcw,
} from "lucide-react";
import { usePayoutRequests, useCancelPayoutRequest, useRequestPayoutManager } from "@/hooks/queries";
import { PayoutRequestStatusBadge } from "./payout-request-status-badge";
import { EmptyState } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDateCivil } from "@/lib/utils";
import { toast } from "sonner";
import type { PayoutRequest, PayoutRequestStatus } from "@/types";

interface PayoutRequestListProps {
  onEdit: (req: PayoutRequest) => void;
  onConfirm: (req: PayoutRequest) => void;
  onRefreshFunding: (req: PayoutRequest) => void;
}

export function PayoutRequestList({ onEdit, onConfirm, onRefreshFunding }: PayoutRequestListProps) {
  const { data: items, isLoading, isError, refetch, isFetching } = usePayoutRequests();
  const cancelMut = useCancelPayoutRequest();
  const reqManagerMut = useRequestPayoutManager();

  async function handleCancel(id: string) {
    try {
      await cancelMut.mutateAsync(id);
      toast.success("Pedido cancelado.");
    } catch {
      toast.error("Não foi possível cancelar o pedido.");
    }
  }

  async function handleRequestManager(req: PayoutRequest) {
    try {
      await reqManagerMut.mutateAsync({ id: req.id, expectedVersion: req.version });
      toast.success("Pedido encaminhado para validação do gerente.");
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "PAYOUT_REQUEST_VERSION_CONFLICT") {
        toast.error("Este pedido foi alterado noutra sessão. Atualizámos os dados disponíveis.");
        refetch();
      } else {
        toast.error("Não foi possível solicitar validação.");
      }
    }
  }

  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Meus pedidos</h3>
          <p className="text-xs text-muted-foreground">Todos os pedidos de payout criados.</p>
        </div>
        <div className="flex items-center gap-2">
          {items && <span className="text-[10px] text-muted-foreground">{items.length} pedidos</span>}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !items || items.length === 0 ? (
        <EmptyState icon={ArrowUpRight} title="Nenhum pedido" description="Crie um novo pedido de payout." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                <TableHead className="text-xs font-medium">Código</TableHead>
                <TableHead className="text-xs font-medium">Store</TableHead>
                <TableHead className="text-xs font-medium text-right">Valor</TableHead>
                <TableHead className="text-xs font-medium">Estado</TableHead>
                <TableHead className="text-xs font-medium">Versão</TableHead>
                <TableHead className="text-xs font-medium">Criação</TableHead>
                <TableHead className="text-xs font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((req) => (
                <TableRow key={req.id} className="border-border/30">
                  <TableCell className="font-mono text-xs text-primary">{req.code}</TableCell>
                  <TableCell className="text-xs">{req.storeName || req.storeCode || "—"}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums font-semibold">
                    {formatCurrency(req.amount, req.currency)}
                  </TableCell>
                  <TableCell><PayoutRequestStatusBadge status={req.status} /></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">v{req.version}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateCivil(req.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {req.status === "draft" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => onEdit(req)}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400" title="Cancelar" onClick={() => handleCancel(req.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Solicitar gerente" onClick={() => handleRequestManager(req)}>
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Confirmar" onClick={() => onConfirm(req)}>
                            <ShieldCheck className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {(req.status === "requested" || req.status === "under_review") && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Confirmar com senha" onClick={() => onConfirm(req)}>
                          <ShieldCheck className="h-3 w-3" />
                        </Button>
                      )}
                      {req.status === "rejected" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver motivo" onClick={() => toast.info(req.rejectionReason || "Sem motivo registado.") }>
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      {req.status === "stale" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400" title="Atualizar funding" onClick={() => onRefreshFunding(req)}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                      {req.status === "confirmed" && (
                        <span className="text-[10px] text-emerald-400">✓</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
