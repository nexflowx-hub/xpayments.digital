"use client";

import * as React from "react";
import {
  RefreshCw, Edit3, Trash2, Send, ShieldCheck, AlertTriangle, Eye, RotateCcw,
} from "lucide-react";
import { usePayoutRequests, useCancelPayoutRequest, useRequestPayoutManager } from "@/hooks/queries";
import { PayoutRequestStatusBadge } from "./payout-request-status-badge";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDateCivil } from "@/lib/utils";
import { toast } from "sonner";
import type { PayoutRequest } from "@/types";

interface PayoutRequestListProps {
  onEdit: (req: PayoutRequest) => void;
  onConfirm: (req: PayoutRequest) => void;
  onRefreshFunding: (req: PayoutRequest) => void;
}

export function PayoutRequestList({ onEdit, onConfirm, onRefreshFunding }: PayoutRequestListProps) {
  const { data: items, isLoading, isError, error, refetch, isFetching } = usePayoutRequests();
  const cancelMut = useCancelPayoutRequest();
  const reqManagerMut = useRequestPayoutManager();
  const t = useT();

  async function handleCancel(id: string) {
    try {
      await cancelMut.mutateAsync(id);
      toast.success(t("pr.payoutRegistered"));
    } catch {
      toast.error(t("pr.authorizationDenied"));
    }
  }

  async function handleRequestManager(req: PayoutRequest) {
    try {
      await reqManagerMut.mutateAsync({ id: req.id, expectedVersion: req.version });
      toast.success(t("pr.requestForwarded"));
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "PAYOUT_REQUEST_VERSION_CONFLICT") {
        toast.error(t("pr.versionConflict"));
        refetch();
      } else {
        toast.error(t("pr.authorizationDenied"));
      }
    }
  }

  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t("pr.myRequests")}</h3>
          <p className="text-xs text-muted-foreground">{t("pr.confirmedPayouts")}</p>
        </div>
        <div className="flex items-center gap-2">
          {items && <span className="text-[10px] text-muted-foreground">{items.length} {t("pr.allocationCount").toLowerCase()}</span>}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <p className="text-xs text-muted-foreground">{(error as { message?: string })?.message ?? t("pr.featureUnavailable")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>{t("common.save")}</Button>
        </div>
      ) : !items || items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-muted-foreground">{t("pr.noRequests")}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">{t("pr.createFirst")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 text-left text-xs text-muted-foreground">
                <TableHead className="text-xs font-medium">{t("pr.reference")}</TableHead>
                <TableHead className="text-xs font-medium">{t("pr.store")}</TableHead>
                <TableHead className="text-xs font-medium text-right">{t("pr.total")}</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium">Ver.</TableHead>
                <TableHead className="text-xs font-medium">{t("pr.allocationCount")}</TableHead>
                <TableHead className="text-xs font-medium">{t("pr.reference")}</TableHead>
                <TableHead className="text-xs font-medium">Criado</TableHead>
                <TableHead className="text-xs font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((req) => (
                <TableRow key={req.id} className="border-border/30">
                  <TableCell className="font-mono text-xs text-primary">{req.requestCode}</TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium">{req.store.name}</span>
                    <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{req.store.code}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums font-semibold">
                    {formatCurrency(req.requestedAmount, req.currency)}
                  </TableCell>
                  <TableCell><PayoutRequestStatusBadge status={req.status} /></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">v{req.version}</TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">{req.allocations.length}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{req.externalReference || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateCivil(req.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {req.status === "draft" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pr.saveDraft")} onClick={() => onEdit(req)}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400" title={t("common.delete")} onClick={() => handleCancel(req.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pr.requestManager")} onClick={() => handleRequestManager(req)}>
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pr.confirmPayout")} onClick={() => onConfirm(req)}>
                            <ShieldCheck className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {(req.status === "requested" || req.status === "under_review") && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pr.confirmPayout")} onClick={() => onConfirm(req)}>
                          <ShieldCheck className="h-3 w-3" />
                        </Button>
                      )}
                      {req.status === "rejected" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pr.rejected")} onClick={() => toast.info((req as unknown as { rejectionReason?: string }).rejectionReason || "—")}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      {req.status === "stale" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400" title={t("pr.updateFunding")} onClick={() => onRefreshFunding(req)}>
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
