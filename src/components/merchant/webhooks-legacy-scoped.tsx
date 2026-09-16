"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Webhook, Plus, Pencil, Trash2, Loader2, Store, Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { useWebhooks, useStores } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
import { revealWebhookSecret } from "@/lib/api/webhook-secrets";
import { PageHeader, EmptyState } from "@/components/shared";
import { StatusBadge } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Webhook as WebhookType } from "@/types";

const EVENTS = [
  "payment.succeeded",
  "payment.failed",
  "payout.created",
  "refund.created",
  "dispute.opened",
  "wallet.updated",
] as const;

export default function WebhooksLegacyScopedPage({ allowedStoreIds }: { allowedStoreIds: string[] }) {
  const allowed = React.useMemo(() => new Set(allowedStoreIds), [allowedStoreIds]);
  const { data: stores = [], isLoading: storesLoading } = useStores();
  const { data: hooks = [], isLoading: hooksLoading } = useWebhooks();
  const qc = useQueryClient();

  const legacyStores = React.useMemo(
    () => stores.filter((store) => allowed.has(store.id)),
    [stores, allowed],
  );

  const legacyHooks = React.useMemo(
    () => hooks.filter((hook) => Boolean(hook.storeId && allowed.has(hook.storeId))),
    [hooks, allowed],
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editWebhook, setEditWebhook] = React.useState<WebhookType | null>(null);
  const [revealedSecret, setRevealedSecret] = React.useState<{ id: string; value: string } | null>(null);
  const [storeId, setStoreId] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<string[]>(["payment.succeeded", "payment.failed"]);

  React.useEffect(() => {
    if (createOpen) {
      setStoreId(legacyStores[0]?.id ?? "");
      setUrl("");
      setEvents(["payment.succeeded", "payment.failed"]);
    }
  }, [createOpen, legacyStores]);

  React.useEffect(() => {
    if (editWebhook) {
      setStoreId(editWebhook.storeId ?? "");
      setUrl(editWebhook.url);
      setEvents(editWebhook.events ?? []);
    }
  }, [editWebhook]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["webhooks"] });

  const revealMutation = useMutation({
    mutationFn: (id: string) => revealWebhookSecret(id),
    onSuccess: (data) => {
      setRevealedSecret({ id: data.id, value: data.secret });
      toast.success("Signing secret revelado");
    },
    onError: (error: { message?: string }) =>
      toast.error(error?.message || "Não foi possível revelar o signing secret"),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!allowed.has(storeId)) throw new Error("STORE_MODE_MISMATCH");
      return xpApi.webhooks.create({ storeId, url, events });
    },
    onSuccess: (created) => {
      refresh();
      setCreateOpen(false);
      if (created.secret) {
        setRevealedSecret({ id: created.id, value: created.secret });
        toast.success("Webhook criado. Signing secret disponível para copiar.");
      } else {
        toast.success("Webhook Legacy criado");
      }
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível criar o webhook"),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editWebhook?.storeId || !allowed.has(editWebhook.storeId)) throw new Error("STORE_MODE_MISMATCH");
      return xpApi.webhooks.update(editWebhook.id, url, events);
    },
    onSuccess: () => {
      refresh();
      setEditWebhook(null);
      toast.success("Webhook Legacy atualizado");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível atualizar o webhook"),
  });

  const removeMutation = useMutation({
    mutationFn: (webhook: WebhookType) => {
      if (!webhook.storeId || !allowed.has(webhook.storeId)) throw new Error("STORE_MODE_MISMATCH");
      return xpApi.webhooks.remove(webhook.id);
    },
    onSuccess: (_, webhook) => {
      refresh();
      setRevealedSecret((current) => current?.id === webhook.id ? null : current);
      toast.success("Webhook Legacy removido");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível remover o webhook"),
  });

  const toggleEvent = (event: string) => {
    setEvents((current) => current.includes(event) ? current.filter((item) => item !== event) : [...current, event]);
  };

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success("Signing secret XPayments copiado");
    } catch {
      toast.error("Não foi possível copiar o signing secret");
    }
  };

  const loading = storesLoading || hooksLoading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Webhooks"
        description="Endpoints Merchant Delivery assinados pelo XPayments, separados por Store."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)} disabled={legacyStores.length === 0}>
            <Plus className="h-3.5 w-3.5" /> Novo endpoint
          </Button>
        }
      />

      <Card className="border-primary/20 bg-primary/[0.04] p-4 text-xs text-muted-foreground">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Signing secret XPayments → Merchant</p>
            <p>
              O secret é ocultado por padrão e só é carregado quando clicar em Revelar. Use-o apenas no backend do seu sistema para validar a assinatura HMAC do header <code className="font-mono">x-nexflowx-signature</code>. Nunca o exponha no browser.
            </p>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}
        </div>
      ) : legacyHooks.length === 0 ? (
        <Card className="border-border/60 bg-card/60 p-5">
          <EmptyState
            icon={Webhook}
            title="Nenhum webhook configurado"
            description="Crie um endpoint HTTPS para receber notificações assinadas do XPayments."
            action={legacyStores.length > 0 ? <Button size="sm" onClick={() => setCreateOpen(true)}>Criar endpoint</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {legacyHooks.map((hook) => {
            const store = legacyStores.find((item) => item.id === hook.storeId);
            const currentSecret = revealedSecret?.id === hook.id ? revealedSecret.value : null;
            const revealing = revealMutation.isPending && revealMutation.variables === hook.id;
            return (
              <Card key={hook.id} className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{store?.name ?? hook.storeName ?? "Store"}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{store?.storeCode ?? hook.storeCode ?? "STORE"}</Badge>
                      <StatusBadge status={hook.status} />
                    </div>
                    <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{hook.url}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(hook.events ?? []).map((event) => <Badge key={event} variant="outline" className="font-mono text-[10px]">{event}</Badge>)}
                    </div>

                    <div className="mt-4 rounded-xl border border-border/50 bg-background/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium">Signing secret</p>
                          <p className="text-[10px] text-muted-foreground">XPayments → Merchant · HMAC-SHA256</p>
                        </div>
                        <Badge variant="outline" className="text-[9px]">SENSITIVE</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded bg-black/30 px-2 py-1.5 font-mono text-xs text-zinc-300">
                          {currentSecret ?? "••••••••••••••••••••••••••••••••"}
                        </code>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={currentSecret ? "Ocultar signing secret" : "Revelar signing secret"}
                          onClick={() => {
                            if (currentSecret) {
                              setRevealedSecret(null);
                            } else {
                              revealMutation.mutate(hook.id);
                            }
                          }}
                          disabled={revealing}
                        >
                          {revealing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : currentSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={currentSecret ? "Copiar signing secret" : "Revele o secret antes de copiar"}
                          disabled={!currentSecret}
                          onClick={() => currentSecret && copySecret(currentSecret)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditWebhook(hook)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="gap-1.5 text-rose-400"><Trash2 className="h-3.5 w-3.5" /> Remover</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover webhook?</AlertDialogTitle>
                          <AlertDialogDescription>Este endpoint deixará de receber novas notificações desta Store.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-rose-600 text-white" onClick={() => removeMutation.mutate(hook)} disabled={removeMutation.isPending}>
                            {removeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <LegacyEditor
        open={createOpen || Boolean(editWebhook)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditWebhook(null);
          }
        }}
        mode={editWebhook ? "edit" : "create"}
        stores={legacyStores}
        storeId={storeId}
        setStoreId={setStoreId}
        url={url}
        setUrl={setUrl}
        events={events}
        toggleEvent={toggleEvent}
        saving={createMutation.isPending || updateMutation.isPending}
        onSave={() => editWebhook ? updateMutation.mutate() : createMutation.mutate()}
      />
    </div>
  );
}

function LegacyEditor({
  open,
  onOpenChange,
  mode,
  stores,
  storeId,
  setStoreId,
  url,
  setUrl,
  events,
  toggleEvent,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  stores: Array<{ id: string; name: string; storeCode?: string }>;
  storeId: string;
  setStoreId: (value: string) => void;
  url: string;
  setUrl: (value: string) => void;
  events: string[];
  toggleEvent: (value: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo webhook" : "Editar webhook"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "O XPayments gera automaticamente um signing secret exclusivo para este endpoint."
              : "Atualize a URL e os eventos. O signing secret atual não é alterado."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Store</Label>
            <Select value={storeId} onValueChange={setStoreId} disabled={mode === "edit"}>
              <SelectTrigger><SelectValue placeholder="Selecione a Store" /></SelectTrigger>
              <SelectContent>
                {stores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name} {store.storeCode ? `(${store.storeCode})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Endpoint HTTPS</Label>
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://api.merchant.com/xpayments/events" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Eventos</Label>
            {EVENTS.map((event) => (
              <label key={event} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                <Checkbox checked={events.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                <code className="font-mono text-xs">{event}</code>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={!storeId || !url.startsWith("https://") || events.length === 0 || saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
