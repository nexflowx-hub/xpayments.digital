"use client";

import * as React from "react";
import { Plus, ArrowUpRight } from "lucide-react";
import { usePayoutRequestsEnabled } from "@/hooks/queries";
import { PayoutRequestBuilder } from "./payout-request-builder";
import { PayoutRequestList } from "./payout-request-list";
import { PayoutConfirmationDialog } from "./payout-confirmation-dialog";
import { EmptyState } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PayoutRequest } from "@/types";

export function PayoutRequestPanel() {
  const { data: enabled, isLoading: checkingEnabled, isError: featureDisabled } = usePayoutRequestsEnabled();
  const [tab, setTab] = React.useState<"new" | "list">("list");
  const [editingRequest, setEditingRequest] = React.useState<PayoutRequest | undefined>();
  const [confirmRequest, setConfirmRequest] = React.useState<PayoutRequest | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // If feature check hasn't loaded yet
  if (checkingEnabled) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // If the feature is disabled, show nothing (not even an error)
  if (featureDisabled || enabled === undefined) {
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
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setTab("list"); setEditingRequest(undefined); }}
          className={tab === "list" ? "rounded-md bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary" : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"}
        >
          Payouts confirmados
        </button>
        <button
          onClick={() => { setTab("new"); setEditingRequest(undefined); }}
          className={tab === "new" ? "rounded-md bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary" : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"}
        >
          Novo pedido
        </button>
        <button
          onClick={() => setTab("list")}
          className={tab === "list" ? "rounded-md bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary" : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"}
        >
          Meus pedidos
        </button>
      </div>

      {/* Tab content */}
      {tab === "new" && (
        <PayoutRequestBuilder
          editingRequest={editingRequest}
          onSaved={handleSaved}
          onCancelled={() => { setTab("list"); setEditingRequest(undefined); }}
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
          onSuccess={() => { setConfirmOpen(false); setConfirmRequest(null); }}
        />
      )}
    </div>
  );
}
