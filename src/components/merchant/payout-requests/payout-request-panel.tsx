"use client";

import * as React from "react";
import { Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { usePayoutRequestsEnabled } from "@/hooks/queries";
import { PayoutRequestBuilder } from "./payout-request-builder";
import { PayoutRequestList } from "./payout-request-list";
import { PayoutConfirmationDialog } from "./payout-confirmation-dialog";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PayoutRequest } from "@/types";

export function PayoutRequestPanel() {
  const { isEnabled, isLoading, isFeatureDisabled, isOtherError, error, refetch } = usePayoutRequestsEnabled();
  const t = useT();
  const [tab, setTab] = React.useState<"new" | "list">("list");
  const [editingRequest, setEditingRequest] = React.useState<PayoutRequest | undefined>();
  const [confirmRequest, setConfirmRequest] = React.useState<PayoutRequest | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Feature disabled — show discreet info card
  if (isFeatureDisabled) {
    return (
      <Card className="border-border/40 bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground">{t("pr.featureUnavailable")}</p>
      </Card>
    );
  }

  // Other errors (network, auth, server) — show compact error with retry
  if (isOtherError) {
    return (
      <Card className="border-rose-500/20 bg-rose-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div className="flex-1">
            <p className="text-xs font-medium text-rose-300">{t("pr.featureUnavailable")}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{(error as { message?: string })?.message ?? ""}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    );
  }

  // Not enabled (data is undefined) — shouldn't happen after loading without error, but guard
  if (!isEnabled) {
    return null;
  }

  function handleSaved(req: PayoutRequest) {
    setEditingRequest(undefined);
    setTab("list");
  }

  function handleEdit(req: PayoutRequest) {
    setEditingRequest(req);
    setTab("new");
  }

  function handleConfirm(req: PayoutRequest) {
    setConfirmRequest(req);
    setConfirmOpen(true);
  }

  function handleRefreshFunding() {
    setTab("new");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs — only two: Meus pedidos + Novo pedido */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setTab("list"); setEditingRequest(undefined); }}
          className={tab === "list" ? "rounded-md bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary" : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"}
        >
          {t("pr.myRequests")}
        </button>
        <button
          onClick={() => { setTab("new"); setEditingRequest(undefined); }}
          className={tab === "new" ? "rounded-md bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary" : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"}
        >
          <Plus className="mr-1 inline h-3 w-3" />{t("pr.newRequest")}
        </button>
      </div>

      {/* Tab content */}
      {tab === "new" && (
        <PayoutRequestBuilder
          editingRequest={editingRequest}
          onSaved={handleSaved}
          onCancelled={() => { setTab("list"); setEditingRequest(undefined); }}
          onManagerRequested={handleSaved}
          onConfirmRequested={(req) => { setTab("list"); handleConfirm(req); }}
        />
      )}

      {tab === "list" && (
        <PayoutRequestList
          onEdit={handleEdit}
          onConfirm={handleConfirm}
          onRefreshFunding={handleRefreshFunding}
        />
      )}

      {/* Confirmation dialog */}
      {confirmRequest && (
        <PayoutConfirmationDialog
          request={confirmRequest}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onSuccess={() => { /* keep open, user clicks Fechar */ }}
        />
      )}
    </div>
  );
}
