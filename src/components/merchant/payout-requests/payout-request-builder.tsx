"use client";

import * as React from "react";
import {
  ArrowLeft, ArrowRight, Save, Send, ShieldCheck, Store, CalendarClock, Loader2, RefreshCw,
} from "lucide-react";
import { useFinanceStores, usePayoutFundingOptions, useCreatePayoutRequest, useUpdatePayoutRequest, useRequestPayoutManager } from "@/hooks/queries";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDateCivil } from "@/lib/utils";
import { toast } from "sonner";
import type { PayoutFundingOption, PayoutRequestAllocation, PayoutRequest } from "@/types";

const STEPS = ["store", "releases", "reference"] as const;

function mapError(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "PAYOUT_REQUESTS_DISABLED": return "";
    case "PAYOUT_REQUEST_OUTDATED": return t("pr.outdated");
    case "PAYOUT_REQUEST_VERSION_CONFLICT": return t("pr.versionConflict");
    case "PAYOUT_APPROVAL_RATE_LIMITED": return t("pr.rateLimited");
    case "PAYOUT_APPROVAL_NOT_CONFIGURED": return t("pr.approvalNotConfigured");
    default: return t("pr.authorizationDenied");
  }
}

interface PayoutRequestBuilderProps {
  editingRequest?: PayoutRequest;
  onSaved: (req: PayoutRequest) => void;
  onCancelled: () => void;
  onManagerRequested: (req: PayoutRequest) => void;
  onConfirmRequested: (req: PayoutRequest) => void;
}

export function PayoutRequestBuilder({ editingRequest, onSaved, onCancelled, onManagerRequested, onConfirmRequested }: PayoutRequestBuilderProps) {
  const t = useT();
  const [step, setStep] = React.useState(0);
  const [storeId, setStoreId] = React.useState(editingRequest?.store.id ?? "");
  const [externalRef, setExternalRef] = React.useState(editingRequest?.externalReference ?? "");
  const [notes, setNotes] = React.useState(editingRequest?.notes ?? "");
  const [selected, setSelected] = React.useState<Map<string, { option: PayoutFundingOption; amount: number }>>(new Map());

  const { data: storesRes, isLoading: storesLoading } = useFinanceStores("EUR");
  const { data: fundingOptions, isLoading: fundingLoading, isError: fundingError, error: fundingErrorObj } = usePayoutFundingOptions(storeId || null);
  const createMut = useCreatePayoutRequest();
  const updateMut = useUpdatePayoutRequest();
  const requestManagerMut = useRequestPayoutManager();

  const stores = storesRes?.stores ?? [];
  const isSaving = createMut.isPending || updateMut.isPending || requestManagerMut.isPending;

  // Rebuild selected map when editing and funding options load
  React.useEffect(() => {
    if (!editingRequest || !fundingOptions) return;
    const map = new Map<string, { option: PayoutFundingOption; amount: number }>();
    for (const alloc of editingRequest.allocations) {
      const opt = fundingOptions.find(
        (o) => o.releaseDate === alloc.releaseDate && o.gateway === alloc.provider,
      );
      if (opt) {
        const key = `${opt.releaseDate}|${opt.gateway}`;
        map.set(key, { option: opt, amount: alloc.amount });
      }
    }
    if (map.size > 0) {
      setSelected(map);
    }
  }, [editingRequest?.id, fundingOptions]);

  const totalSelected = React.useMemo(
    () => Array.from(selected.values()).reduce((sum, v) => sum + v.amount, 0),
    [selected],
  );

  function toggleOption(option: PayoutFundingOption) {
    const key = `${option.releaseDate}|${option.gateway}`;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, { option, amount: option.remainingAmount });
      }
      return next;
    });
  }

  function updateAmount(key: string, amount: number, max: number) {
    if (amount < 0) return;
    if (amount > max) return;
    setSelected((prev) => {
      const next = new Map(prev);
      const entry = next.get(key);
      if (entry) next.set(key, { ...entry, amount });
      return next;
    });
  }

  function buildAllocations(): Omit<PayoutRequestAllocation, "id" | "snapshotAvailableAmount" | "snapshotMovementCount" | "position" | "metadata">[] {
    return Array.from(selected.entries()).map(([, v]) => ({
      releaseDate: v.option.releaseDate,
      provider: v.option.gateway,
      amount: v.amount,
    }));
  }

  async function saveDraft(): Promise<PayoutRequest | null> {
    const allocations = buildAllocations();
    if (allocations.length === 0) return null;
    if (editingRequest) {
      return updateMut.mutateAsync({
        id: editingRequest.id,
        payload: {
          expectedVersion: editingRequest.version,
          storeId,
          currency: "EUR",
          externalReference: externalRef || undefined,
          notes: notes || undefined,
          allocations,
        },
      });
    }
    return createMut.mutateAsync({
      storeId,
      currency: "EUR",
      externalReference: externalRef || undefined,
      notes: notes || undefined,
      allocations,
    });
  }

  async function handleSave() {
    try {
      const res = await saveDraft();
      if (res) {
        onSaved(res);
        toast.success(t("pr.payoutRegistered"));
      }
    } catch (e) {
      const code = (e as { code?: string })?.code;
      const msg = mapError(code, t);
      if (msg) toast.error(msg);
    }
  }

  async function handleRequestManager() {
    try {
      let req = await saveDraft();
      if (!req) return;
      req = await requestManagerMut.mutateAsync({ id: req.id, expectedVersion: req.version });
      toast.success(t("pr.requestForwarded"));
      onManagerRequested(req);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      const msg = mapError(code, t);
      if (msg) toast.error(msg);
    }
  }

  async function handleConfirmPayout() {
    try {
      const req = await saveDraft();
      if (!req) return;
      onConfirmRequested(req);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      const msg = mapError(code, t);
      if (msg) toast.error(msg);
    }
  }

  const fundingDisabledCode = (fundingErrorObj as { code?: string })?.code;

  const providerStatusMap: Record<string, { label: string; cls: string }> = {
    available: { label: t("pr.providerAvailable"), cls: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
    pending: { label: t("pr.providerPending"), cls: "border-sky-500/25 bg-sky-500/12 text-sky-400" },
    unknown: { label: t("pr.providerUnknown"), cls: "border-border bg-muted text-muted-foreground" },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => i <= step && setStep(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                i === step ? "bg-primary/12 text-primary" : i < step ? "text-foreground cursor-pointer hover:bg-muted/60" : "text-muted-foreground",
              )}
              disabled={i > step}
            >
              <span className={cn("grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold", i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground")}>
                {i < step ? "✓" : i + 1}
              </span>
              {t(`pr.${s}`)}
            </button>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border/60" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Store selection */}
      {step === 0 && (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("pr.selectStore")}</h3>
          </div>
          {storesLoading ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : stores.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t("pr.noStores")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((s) => (
                <button
                  key={s.storeId}
                  onClick={() => { setStoreId(s.storeId); setSelected(new Map()); }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition",
                    storeId === s.storeId
                      ? "border-primary/40 bg-primary/8"
                      : "border-border/40 bg-background/40 hover:border-primary/20",
                  )}
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {s.storeCode.slice(-2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{s.storeName}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{s.storeCode}</p>
                  </div>
                  {storeId === s.storeId && <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button size="sm" disabled={!storeId} onClick={() => setStep(1)} className="gap-1.5">
              {t("common.save")} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 1: Funding options */}
      {step === 1 && (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("pr.releases")}</h3>
            </div>
            {selected.size > 0 && (
              <Badge variant="outline" className="border-primary/40 bg-primary/8 text-primary text-[11px]">
                {selected.size} · {formatCurrency(totalSelected, "EUR")}
              </Badge>
            )}
          </div>

          {fundingDisabledCode === "PAYOUT_REQUESTS_DISABLED" ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t("pr.featureUnavailable")}</p>
          ) : fundingLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : !fundingOptions || fundingOptions.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t("pr.noReleases")}</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Gateway</th>
                      <th className="px-3 py-2 font-medium">Store</th>
                      <th className="px-3 py-2 text-right font-medium">{t("pr.total")}</th>
                      <th className="px-3 py-2 text-right font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Provider</th>
                      <th className="px-3 py-2 text-right font-medium">{t("pr.amountToUse")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundingOptions.map((opt) => {
                      const key = `${opt.releaseDate}|${opt.gateway}`;
                      const sel = selected.get(key);
                      const pStatus = providerStatusMap[opt.providerStatus] ?? providerStatusMap.unknown;
                      return (
                        <tr key={key} className={cn("border-b border-border/20 transition hover:bg-muted/20", sel && "bg-primary/5")}>
                          <td className="px-3 py-2.5 text-xs">{formatDateCivil(opt.releaseDate)}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{opt.gateway}</td>
                          <td className="px-3 py-2.5 text-xs">
                            <p className="font-medium">{opt.storeName}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{opt.storeCode}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums font-semibold">{formatCurrency(opt.remainingAmount, "EUR")}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">{opt.movementCount}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className={cn("text-[10px]", pStatus.cls)}>{pStatus.label}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {sel ? (
                                <input
                                  type="number"
                                  min={0}
                                  max={opt.remainingAmount}
                                  step={0.01}
                                  value={sel.amount}
                                  onChange={(e) => updateAmount(key, parseFloat(e.target.value) || 0, opt.remainingAmount)}
                                  className="w-28 rounded-md border border-border/60 bg-background/80 px-2 py-1 text-right font-mono text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/40"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                              <button
                                onClick={() => toggleOption(opt)}
                                className={cn(
                                  "grid h-5 w-5 place-items-center rounded border text-[10px] transition",
                                  sel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40",
                                )}
                              >
                                {sel ? "✓" : ""}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" disabled={selected.size === 0} onClick={() => setStep(2)} className="gap-1.5">
                  {t("common.save")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Step 2: Reference & notes + actions */}
      {step === 2 && (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-semibold">{t("pr.reference")}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("pr.externalRef")}</label>
              <Input
                placeholder="FAT-2026-0042"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("pr.notes")}</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mt-5 rounded-lg border border-border/40 bg-background/40 p-4">
            <p className="text-xs font-semibold">{t("pr.myRequests")}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">{t("pr.allocationCount")}</span>
              <span className="text-right font-mono tabular-nums">{selected.size}</span>
              <span className="text-muted-foreground">{t("pr.total")}</span>
              <span className="text-right font-mono tabular-nums font-semibold">{formatCurrency(totalSelected, "EUR")}</span>
            </div>
          </div>

          {/* Actions — 3 separate buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={onCancelled}>{t("common.cancel")}</Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving || selected.size === 0} className="gap-1.5">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Save className="h-3.5 w-3.5" /> {t("pr.saveDraft")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRequestManager} disabled={isSaving || selected.size === 0} className="gap-1.5">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Send className="h-3.5 w-3.5" /> {t("pr.requestManager")}
            </Button>
            <Button size="sm" onClick={handleConfirmPayout} disabled={isSaving || selected.size === 0} className="gap-1.5">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <ShieldCheck className="h-3.5 w-3.5" /> {t("pr.confirmPayout")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
