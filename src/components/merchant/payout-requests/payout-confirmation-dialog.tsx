"use client";

import * as React from "react";
import {
  ShieldCheck, AlertTriangle, Loader2, CheckCircle2, Eye, EyeOff, X,
} from "lucide-react";
import {
  usePreviewPayoutConfirmation,
  useVerifyPayoutManager,
  useConfirmPayoutRequest,
} from "@/hooks/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDateCivil } from "@/lib/utils";
import { toast } from "sonner";
import type { PayoutRequest, PayoutConfirmationPreview } from "@/types";

function mapConfirmError(code: string | undefined): string {
  switch (code) {
    case "PAYOUT_CHALLENGE_EXPIRED": return "A confirmação expirou. Gere um novo preview.";
    case "PAYOUT_REQUEST_OUTDATED": return "As liberações ou o pedido mudaram. Atualize os dados e gere uma nova confirmação.";
    case "PAYOUT_REQUEST_VERSION_CONFLICT": return "Este pedido foi alterado noutra sessão. Atualizámos os dados disponíveis.";
    case "PAYOUT_APPROVAL_DENIED": return "Autorização inválida.";
    case "PAYOUT_APPROVAL_RATE_LIMITED": return "Muitas tentativas de autorização. Aguarde antes de tentar novamente.";
    case "PAYOUT_INSUFFICIENT_BALANCE": return "A wallet já não possui saldo suficiente para este payout.";
    case "PAYOUT_ALREADY_CONFIRMED": return "Este payout já foi confirmado.";
    case "PAYOUT_APPROVAL_NOT_CONFIGURED": return "A confirmação administrativa está temporariamente indisponível.";
    default: return "Ocorreu um erro durante a confirmação.";
  }
}

interface PayoutConfirmationDialogProps {
  request: PayoutRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (statementCode?: string) => void;
}

export function PayoutConfirmationDialog({ request, open, onOpenChange, onSuccess }: PayoutConfirmationDialogProps) {
  const [password, setPassword] = React.useState("");
  const [bankConfirmed, setBankConfirmed] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [preview, setPreview] = React.useState<PayoutConfirmationPreview | null>(null);
  const [phase, setPhase] = React.useState<"idle" | "previewing" | "preview" | "verifying" | "confirming" | "done">("idle");
  const [confirmingRef, setConfirmingRef] = React.useState(false);

  const previewMut = usePreviewPayoutConfirmation();
  const verifyMut = useVerifyPayoutManager();
  const confirmMut = useConfirmPayoutRequest();

  // Clear password on close
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
        toast.info("Este payout já foi confirmado.");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(mapConfirmError(code));
      }
      setPhase("idle");
    }
  }

  async function handleVerifyAndConfirm() {
    if (!preview || !password) return;
    setPhase("verifying");
    try {
      const verifyRes = await verifyMut.mutateAsync({
        id: request.id,
        payload: { challengeId: preview.challengeId, approvalPassword: password, bankTransferConfirmed: bankConfirmed },
      });
      if (!verifyRes.confirmationReady) {
        toast.error("Autorização inválida.");
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
        setPassword("");
        setPhase("done");
        toast.success("Payout confirmado com sucesso.");
        onSuccess();
      } catch (e2) {
        const code = (e2 as { code?: string })?.code;
        if (code === "PAYOUT_ALREADY_CONFIRMED") {
          setPhase("done");
          toast.success("Payout confirmado.");
          onSuccess();
        } else {
          toast.error(mapConfirmError(code));
          setPhase("preview");
          setPassword("");
        }
      }
    } catch (e) {
      const code = (e as { code?: string })?.code;
      toast.error(mapConfirmError(code));
      setPhase("preview");
      setPassword("");
    }
  }

  const isBusy = phase === "previewing" || phase === "verifying" || phase === "confirming";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isBusy) onOpenChange(v); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Confirmar payout
          </DialogTitle>
          <DialogDescription>Revisão final antes do registo contabilístico.</DialogDescription>
        </DialogHeader>

        {phase === "done" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-emerald-500/12 p-4"><CheckCircle2 className="h-8 w-8 text-emerald-400" /></div>
            <div className="text-center">
              <p className="text-sm font-semibold">Payout confirmado</p>
              <p className="mt-1 text-xs text-muted-foreground">O payout foi registado e a wallet debitada.</p>
            </div>
            <Button size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        ) : phase === "idle" ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-xs">
              <div className="grid grid-cols-2 gap-1.5">
                <span className="text-muted-foreground">Store</span>
                <span className="text-right font-medium">{request.storeName || request.storeCode}</span>
                <span className="text-muted-foreground">Valor</span>
                <span className="text-right font-mono font-semibold tabular-nums">{formatCurrency(request.amount, request.currency)}</span>
                <span className="text-muted-foreground">Moeda</span>
                <span className="text-right">{request.currency}</span>
                {request.externalReference && (
                  <>
                    <span className="text-muted-foreground">Referência</span>
                    <span className="text-right">{request.externalReference}</span>
                  </>
                )}
                <span className="text-muted-foreground">Allocações</span>
                <span className="text-right">{request.allocations.length}</span>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
              <p className="font-semibold">Aviso de irreversibilidade contabilística</p>
              <p className="mt-1">Esta operação debita a wallet e regista o payout. Não pode ser revertida pela interface.</p>
            </div>
            <Button className="w-full gap-1.5" onClick={handlePreview} disabled={isBusy}>
              {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Gerar confirmação
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {preview && (
              <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-xs">
                <div className="grid grid-cols-2 gap-1.5">
                  <span className="text-muted-foreground">Store</span>
                  <span className="text-right font-medium">{preview.storeName}</span>
                  <span className="text-muted-foreground">Valor</span>
                  <span className="text-right font-mono font-semibold tabular-nums">{formatCurrency(preview.amount, request.currency)}</span>
                  <span className="text-muted-foreground">Wallet disponível</span>
                  <span className="text-right font-mono tabular-nums">{formatCurrency(preview.wallet.available, request.currency)}</span>
                </div>
                {preview.allocations.length > 0 && (
                  <div className="mt-2 border-t border-border/30 pt-2">
                    <p className="mb-1 font-medium">Liberações selecionadas</p>
                    {preview.allocations.map((a, i) => (
                      <div key={i} className="flex justify-between py-0.5">
                        <span className="text-muted-foreground">{formatDateCivil(a.releaseDate)} · {a.provider}</span>
                        <span className="font-mono tabular-nums">{formatCurrency(a.amount, request.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bank transfer attestation */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
              <p>A XPayments não inicia a transferência bancária. Esta confirmação apenas regista contabilisticamente o payout e debita a wallet do merchant.</p>
            </div>
            <label className="flex items-start gap-2.5 rounded-lg border border-border/40 p-3 transition hover:bg-muted/20 cursor-pointer">
              <input
                type="checkbox"
                checked={bankConfirmed}
                onChange={(e) => setBankConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span className="text-xs leading-relaxed">
                Confirmo que a transferência bancária correspondente já foi executada fora da XPayments.
              </span>
            </label>

            {/* Password */}
            {preview?.approvalPasswordRequired && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Senha do gerente/admin</label>
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
              <Button variant="outline" size="sm" onClick={() => { setPhase("idle"); setPassword(""); }} disabled={isBusy}>Cancelar</Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!bankConfirmed || (preview?.approvalPasswordRequired && !password) || isBusy || confirmingRef}
                onClick={() => { setConfirmingRef(true); handleVerifyAndConfirm(); }}
              >
                {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <ShieldCheck className="h-3.5 w-3.5" /> Autorizar e registar payout
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
