"use client";

import * as React from "react";
import {
  ShieldCheck, Loader2, CheckCircle2, Eye, EyeOff, AlertTriangle,
} from "lucide-react";
import {
  usePreviewPayoutConfirmation,
  useVerifyPayoutManager,
  useConfirmPayoutRequest,
} from "@/hooks/queries";
import { useT } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDateCivil } from "@/lib/utils";
import { toast } from "sonner";
import type { PayoutRequest, PayoutConfirmationPreview } from "@/types";

function mapConfirmError(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "PAYOUT_CHALLENGE_EXPIRED": return t("pr.challengeExpired");
    case "PAYOUT_REQUEST_OUTDATED": return t("pr.outdated");
    case "PAYOUT_REQUEST_VERSION_CONFLICT": return t("pr.versionConflict");
    case "PAYOUT_APPROVAL_DENIED": return t("pr.authorizationDenied");
    case "PAYOUT_APPROVAL_RATE_LIMITED": return t("pr.rateLimited");
    case "PAYOUT_INSUFFICIENT_BALANCE": return t("pr.insufficientBalance");
    case "PAYOUT_ALREADY_CONFIRMED": return t("pr.alreadyConfirmed");
    case "PAYOUT_APPROVAL_NOT_CONFIGURED": return t("pr.approvalNotConfigured");
    default: return t("pr.authorizationDenied");
  }
}

interface PayoutConfirmationDialogProps {
  request: PayoutRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PayoutConfirmationDialog({ request, open, onOpenChange, onSuccess }: PayoutConfirmationDialogProps) {
  const t = useT();
  const [password, setPassword] = React.useState("");
  const [bankConfirmed, setBankConfirmed] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [preview, setPreview] = React.useState<PayoutConfirmationPreview | null>(null);
  const [phase, setPhase] = React.useState<"idle" | "previewing" | "preview" | "verifying" | "confirming" | "done">("idle");
  const [confirmingRef, setConfirmingRef] = React.useState(false);

  const previewMut = usePreviewPayoutConfirmation();
  const verifyMut = useVerifyPayoutManager();
  const confirmMut = useConfirmPayoutRequest();

  // Reset all state on close
  React.useEffect(() => {
    if (!open) {
      setPassword("");
      setBankConfirmed(false);
      setShowPassword(false);
      setPreview(null);
      setPhase("idle");
      setConfirmingRef(false);
    }
  }, [open]);

  async function handlePreview() {
    setPhase("previewing");
    try {
      const res = await previewMut.mutateAsync({ id: request.id, expectedVersion: request.version });
      setPreview(res);
      setPhase("preview");
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "PAYOUT_ALREADY_CONFIRMED") {
        toast.info(t("pr.alreadyConfirmed"));
        setPhase("done");
        onSuccess();
      } else {
        toast.error(mapConfirmError(code, t));
      }
      setPhase("idle");
    }
  }

  async function handleVerifyAndConfirm() {
    if (!preview || !password) return;
    setPhase("verifying");
    setConfirmingRef(true);
    try {
      const verifyRes = await verifyMut.mutateAsync({
        id: request.id,
        payload: { challengeId: preview.challengeId, approvalPassword: password, bankTransferConfirmed: bankConfirmed },
      });
      if (!verifyRes.confirmationReady) {
        toast.error(t("pr.authorizationDenied"));
        setPhase("preview");
        setPassword("");
        return;
      }
      setPhase("confirming");
      try {
        await confirmMut.mutateAsync({
          id: request.id,
          challengeId: preview.challengeId,
          bankTransferConfirmed: bankConfirmed,
        });
        setPhase("done");
        toast.success(t("pr.payoutConfirmed"));
        onSuccess();
      } catch (e2) {
        const code = (e2 as { code?: string })?.code;
        if (code === "PAYOUT_ALREADY_CONFIRMED") {
          setPhase("done");
          toast.success(t("pr.payoutConfirmed"));
          onSuccess();
        } else {
          toast.error(mapConfirmError(code, t));
          setPhase("preview");
        }
      } finally {
        setPassword("");
      }
    } catch (e) {
      const code = (e as { code?: string })?.code;
      toast.error(mapConfirmError(code, t));
      setPhase("preview");
      setPassword("");
    } finally {
      setConfirmingRef(false);
    }
  }

  const isBusy = phase === "previewing" || phase === "verifying" || phase === "confirming";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isBusy) onOpenChange(v); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t("pr.confirmPayout")}
          </DialogTitle>
          <DialogDescription>{t("pr.authorizationAndRegister")}</DialogDescription>
        </DialogHeader>

        {phase === "done" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-emerald-500/12 p-4"><CheckCircle2 className="h-8 w-8 text-emerald-400" /></div>
            <div className="text-center">
              <p className="text-sm font-semibold">{t("pr.payoutConfirmed")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("pr.payoutRegistered")}</p>
            </div>
            <Button size="sm" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          </div>
        ) : phase === "idle" ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-xs">
              <div className="grid grid-cols-2 gap-1.5">
                <span className="text-muted-foreground">{t("pr.store")}</span>
                <span className="text-right font-medium">{request.store.name}</span>
                <span className="text-muted-foreground">{t("pr.reference")}</span>
                <span className="text-right font-mono text-xs text-primary">{request.requestCode}</span>
                <span className="text-muted-foreground">{t("pr.total")}</span>
                <span className="text-right font-mono font-semibold tabular-nums">{formatCurrency(request.requestedAmount, request.currency)}</span>
                <span className="text-muted-foreground">Currency</span>
                <span className="text-right">{request.currency}</span>
                {request.externalReference && (
                  <>
                    <span className="text-muted-foreground">{t("pr.externalRef")}</span>
                    <span className="text-right">{request.externalReference}</span>
                  </>
                )}
                <span className="text-muted-foreground">{t("pr.allocationCount")}</span>
                <span className="text-right">{request.allocations.length}</span>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
              <p className="font-semibold">{t("pr.irreversibleWarning")}</p>
            </div>
            <Button className="w-full gap-1.5" onClick={handlePreview} disabled={isBusy}>
              {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("pr.confirmPayout")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {preview && (
              <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-xs">
                <div className="grid grid-cols-2 gap-1.5">
                  <span className="text-muted-foreground">{t("pr.store")}</span>
                  <span className="text-right font-medium">{preview.request.store.name}</span>
                  <span className="text-muted-foreground">{t("pr.reference")}</span>
                  <span className="text-right font-mono text-xs text-primary">{preview.request.requestCode}</span>
                  <span className="text-muted-foreground">{t("pr.total")}</span>
                  <span className="text-right font-mono font-semibold tabular-nums">{formatCurrency(preview.request.requestedAmount, preview.request.currency)}</span>
                </div>
                {preview.allocations.length > 0 && (
                  <div className="mt-2 border-t border-border/30 pt-2">
                    <p className="mb-1 font-medium">{t("pr.releases")}</p>
                    {preview.allocations.map((a, i) => (
                      <div key={i} className="flex justify-between py-0.5">
                        <span className="text-muted-foreground">{formatDateCivil(a.releaseDate)} · {a.provider}</span>
                        <span className="font-mono tabular-nums">{formatCurrency(a.amount, preview.request.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
              <p>{t("pr.xpNoTransfer")}</p>
            </div>
            <label className="flex items-start gap-2.5 rounded-lg border border-border/40 p-3 transition hover:bg-muted/20 cursor-pointer">
              <input
                type="checkbox"
                checked={bankConfirmed}
                onChange={(e) => setBankConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span className="text-xs leading-relaxed">{t("pr.bankTransferExecuted")}</span>
            </label>

            {preview?.approvalPasswordRequired && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("pr.managerPassword")}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    data-form-type="other"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 w-full rounded-md border border-border/60 bg-background/80 px-3 pr-9 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setPhase("idle"); setPassword(""); }} disabled={isBusy}>{t("common.cancel")}</Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!bankConfirmed || (preview?.approvalPasswordRequired && !password) || isBusy || confirmingRef}
                onClick={() => handleVerifyAndConfirm()}
              >
                {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <ShieldCheck className="h-3.5 w-3.5" /> {t("pr.authorizationAndRegister")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
