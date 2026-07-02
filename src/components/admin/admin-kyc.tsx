"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScrollText, FileText, FileImage, IdCard, Camera, MapPin,
  CheckCircle2, XCircle, AlertTriangle, Clock, FileCheck2, Eye,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminKyc } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
import { PageHeader, EmptyState, SectionCard } from "@/components/shared";
import { StatusBadge } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import type { KycReview, KycDocument } from "@/types";

const docTypeMeta: Record<
  KycDocument["type"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  passport: { label: "Passport", icon: IdCard },
  id_card: { label: "ID Card", icon: IdCard },
  selfie: { label: "Selfie", icon: Camera },
  address_proof: { label: "Address Proof", icon: MapPin },
  article: { label: "Article of Incorporation", icon: FileText },
};

// Mock audit history (deterministic)
const auditHistory = [
  { id: "h1", merchant: "Quanta Pay", decision: "approved" as const, reviewer: "A. Morgan", timestamp: "2025-11-22T08:42:00Z" },
  { id: "h2", merchant: "Northwind", decision: "approved" as const, reviewer: "A. Morgan", timestamp: "2025-11-22T07:18:00Z" },
  { id: "h3", merchant: "Cobalt Digital", decision: "rejected" as const, reviewer: "J. Park", timestamp: "2025-11-21T16:51:00Z" },
  { id: "h4", merchant: "Vertex Commerce", decision: "approved" as const, reviewer: "J. Park", timestamp: "2025-11-21T11:09:00Z" },
  { id: "h5", merchant: "Atlas Supply", decision: "rejected" as const, reviewer: "A. Morgan", timestamp: "2025-11-20T19:32:00Z" },
  { id: "h6", merchant: "Meridian", decision: "approved" as const, reviewer: "A. Morgan", timestamp: "2025-11-20T09:55:00Z" },
];

export default function AdminKycPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useAdminKyc();
  const [previewDoc, setPreviewDoc] = React.useState<{ doc: KycDocument; review: KycReview } | null>(null);
  const [confirmDecision, setConfirmDecision] = React.useState<{ review: KycReview; decision: "approved" | "rejected" } | null>(null);

  const decisionMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      xpApi.admin.kycDecision(id, decision),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "kyc"] });
      qc.invalidateQueries({ queryKey: ["admin", "merchants"] });
      toast.success(
        vars.decision === "approved" ? "KYC approved" : "KYC rejected",
        {
          description:
            vars.decision === "approved"
              ? "Merchant account verified and unlocked."
              : "Submission rejected. Merchant notified.",
        }
      );
    },
    onError: () => toast.error("Decision could not be recorded"),
  });

  const queue = data?.data ?? [];
  const pending = queue.filter((k) => k.status === "pending");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="KYC Queue"
        description="Review merchant onboarding documents and risk flags."
        breadcrumbs={[{ label: "Admin" }, { label: "KYC Queue" }]}
        actions={
          <Badge variant="outline" className="gap-1.5 border-amber-500/25 bg-amber-500/12 px-3 py-1 text-xs font-semibold text-amber-400">
            <Clock className="h-3.5 w-3.5" /> {pending.length} pending review
          </Badge>
        }
      />

      {/* Approval queue */}
      <SectionCard
        title="Approval queue"
        description="Submissions awaiting first-line compliance review."
      >
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="Queue is clear"
            description="There are no pending KYC submissions right now. Great work."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pending.map((r) => (
              <KycReviewCard
                key={r.id}
                review={r}
                onView={(d) => setPreviewDoc({ doc: d, review: r })}
                onApprove={() => setConfirmDecision({ review: r, decision: "approved" })}
                onReject={() => setConfirmDecision({ review: r, decision: "rejected" })}
                pending={decisionMutation.isPending}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Audit history */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Recent decisions</h3>
            <p className="text-xs text-muted-foreground">Audit trail of approvals and rejections</p>
          </div>
          <ScrollText className="h-4 w-4 text-muted-foreground" />
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead>Merchant</TableHead>
              <TableHead>Decision</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditHistory.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{h.merchant}</TableCell>
                <TableCell>
                  {h.decision === "approved" ? (
                    <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Approved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-rose-500/25 bg-rose-500/12 text-rose-400">
                      <XCircle className="h-3 w-3" /> Rejected
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{h.reviewer}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {timeAgo(h.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Document preview */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl bg-background/95 p-0">
          <DialogHeader className="border-b border-border/60 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              {previewDoc?.doc.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {previewDoc && docTypeMeta[previewDoc.doc.type].label} ·{" "}
              {previewDoc?.review.merchantName} · {previewDoc?.review.merchantId}
            </DialogDescription>
          </DialogHeader>
          <div className="p-5">
            {previewDoc && <DocumentPreview doc={previewDoc.doc} review={previewDoc.review} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve / Reject confirm */}
      <AlertDialog
        open={!!confirmDecision}
        onOpenChange={(o) => !o && setConfirmDecision(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDecision?.decision === "approved" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              )}
              {confirmDecision?.decision === "approved"
                ? "Approve KYC submission?"
                : "Reject KYC submission?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDecision?.decision === "approved" ? (
                <>
                  You are about to approve the KYC submission for{" "}
                  <span className="font-semibold text-foreground">
                    {confirmDecision?.review.merchantName}
                  </span>
                  . The merchant will be marked verified and unlocked for live
                  processing. This decision is recorded in the audit log.
                </>
              ) : (
                <>
                  You are about to reject the KYC submission for{" "}
                  <span className="font-semibold text-foreground">
                    {confirmDecision?.review.merchantName}
                  </span>
                  . The merchant will be notified and may resubmit. This
                  decision is recorded in the audit log.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                confirmDecision?.decision === "approved"
                  ? "bg-emerald-500 text-white hover:bg-emerald-500/90"
                  : "bg-rose-500 text-white hover:bg-rose-500/90"
              )}
              disabled={decisionMutation.isPending}
              onClick={() => {
                if (confirmDecision) {
                  decisionMutation.mutate({
                    id: confirmDecision.review.id,
                    decision: confirmDecision.decision,
                  });
                  setConfirmDecision(null);
                }
              }}
            >
              {decisionMutation.isPending
                ? "Processing…"
                : confirmDecision?.decision === "approved"
                ? "Confirm approval"
                : "Confirm rejection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KycReviewCard({
  review,
  onView,
  onApprove,
  onReject,
  pending,
}: {
  review: KycReview;
  onView: (d: KycDocument) => void;
  onApprove: () => void;
  onReject: () => void;
  pending: boolean;
}) {
  return (
    <Card className="flex flex-col border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/12 text-xs font-semibold text-primary">
              {review.merchantName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{review.merchantName}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{review.merchantId}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {review.country}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Submitted {timeAgo(review.submittedAt)}</span>
        <StatusBadge status={review.status} />
      </div>

      {review.riskFlags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.riskFlags.map((flag) => (
            <Badge
              key={flag}
              variant="outline"
              className="gap-1 border-rose-500/25 bg-rose-500/12 text-rose-400"
            >
              <ShieldAlert className="h-3 w-3" /> {flag}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> No risk flags
          </Badge>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Documents ({review.documents.length})
        </p>
        {review.documents.map((d) => {
          const meta = docTypeMeta[d.type];
          const Icon = meta.icon;
          return (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-muted/60 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-medium">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {meta.label} · {d.pages}p · {(d.sizeKb / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => onView(d)}
              >
                <Eye className="h-3 w-3" /> View
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 gap-1.5 bg-emerald-500 text-white hover:bg-emerald-500/90"
          disabled={pending}
          onClick={onApprove}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
          disabled={pending}
          onClick={onReject}
        >
          <XCircle className="h-3.5 w-3.5" /> Reject
        </Button>
      </div>
    </Card>
  );
}

function DocumentPreview({ doc, review }: { doc: KycDocument; review: KycReview }) {
  const meta = docTypeMeta[doc.type];
  const Icon = meta.icon;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" /> {meta.label}
        </span>
        <span className="font-mono">{doc.pages} page(s) · {(doc.sizeKb / 1024).toFixed(2)} MB</span>
      </div>

      {/* Simulated PDF panel */}
      <div className="overflow-hidden rounded-lg border border-border/60 bg-background/60">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2">
          <div className="flex items-center gap-2">
            <FileImage className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-xs font-medium">{doc.name}</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">Page 1 of {doc.pages}</span>
        </div>
        <div className="relative aspect-[3/4] w-full bg-gradient-to-b from-zinc-100 to-zinc-200 p-6 dark:from-zinc-900 dark:to-zinc-950">
          <div className="mx-auto flex h-full max-w-md flex-col rounded border border-black/10 bg-white p-6 text-zinc-800 shadow-lg dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                  XPayments · Document Verification
                </p>
                <p className="mt-0.5 text-sm font-bold">{meta.label}</p>
              </div>
              <div className="grid h-8 w-8 place-items-center rounded bg-gradient-to-br from-primary to-primary/60 text-[10px] font-bold text-white">
                XP
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-[10px] font-semibold uppercase text-zinc-400">
                Account holder
              </div>
              <div className="h-3 w-3/4 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-1/2 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-[10px] font-semibold uppercase text-zinc-400">
                {meta.label} details
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-2 flex-1 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="aspect-square rounded bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700" />
              <div className="col-span-2 flex flex-col justify-center gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-2 rounded-sm bg-zinc-200 dark:bg-zinc-700" style={{ width: `${60 + i * 12}%` }} />
                ))}
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <span className="font-mono text-[9px] text-zinc-400">
                {review.merchantId} · ref {doc.id}
              </span>
              <span className="text-[9px] text-zinc-400">SHA-256 verified</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
          <span>Uploaded {timeAgo(review.submittedAt)}</span>
          <span>{formatNumber(doc.sizeKb)} KB</span>
        </div>
      </div>
    </div>
  );
}
