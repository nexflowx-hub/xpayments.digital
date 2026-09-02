"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Webhook, Plus, Pencil, Trash2, Loader2, Store, Copy, Eye, EyeOff } from "lucide-react";
import { useWebhooks, useStores } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
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
  const [secretVisible, setSecretVisible] = React.useState<string | null>(null);
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

  const createMutation = useMutation({
    mutationFn: () => {
      if (!allowed.has(storeId)) throw new Error("STORE_MODE_MISMATCH");
      return xpApi.webhooks.create({ storeId, url, events });
    },
    onSuccess: () => {
      refresh();
      setCreateOpen(false);
      toast.success("Webhook Legacy criado");
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
    onSuccess: () => {
      refresh();
      toast.success("Webhook Legacy removido");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível remover o webhook"),
  });

  const toggleEvent = (event: string) => {
    setEvents((current) => current.includes(event) ? current.filter((item) => item !== event) : [...current, event]);
  };

  const loading = storesLoading || hooksLoading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Webhooks Legacy"
        description="Compatibilidade com Stores ainda não migradas para o Store Control Plane VNext."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)} disabled={legacyStores.length === 0}>
            <Plus className="h-3.5 w-3.5" /> Novo endpoint Legacy
          </Button>
        }
      />

      <Card className="border-amber-500/25 bg-amber-500/5 p-4 text-xs text-muted-foreground">
        Esta superfície só permite operações nas {legacyStores.length} Store(s) identificadas como LEGACY. Stores VNEXT/OBSERVED estão bloqueadas deste CRUD por design.
      </Card>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}
        </div>
      ) : legacyHooks.length === 0 ? (
        <Card className="border-border/60 bg-card/60 p-5">
          <EmptyState
            icon={Webhook}
            title="Nenhum webhook Legacy"
            description="As Stores Legacy deste Merchant não têm endpoints configurados neste CRUD."
            action={legacyStores.length > 0 ? <Button size="sm" onClick={() => setCreateOpen(true)}>Criar endpoint</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {legacyHooks.map((hook) => {
            const store = legacyStores.find((item) => item.id === hook.storeId);
            const visible = secretVisible === hook.id;
            return (
              <Card key={hook.id} className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{store?.name ?? hook.storeName ?? "Legacy Store"}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{store?.storeCode ?? hook.storeCode ?? "LEGACY"}</Badge>
                      <StatusBadge status={hook.status} />
                    </div>
                    <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{hook.url}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(hook.events ?? []).map((event) => <Badge key={event} variant="outline" className="font-mono text-[10px]">{event}</Badge>)}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded bg-black/30 px-2 py-1 font-mono text-xs text-zinc-300">
                        {visible ? hook.secret : "whsec_••••••••••••"}
                      </code>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSecretVisible(visible ? null : hook.id)}>
                        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigator.clipboard.writeText(hook.secret).then(() => toast.success("Signing secret copiado"))}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
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
                          <AlertDialogTitle>Remover webhook Legacy?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação usa o CRUD Legacy atual e afeta somente a Store Legacy selecionada.</AlertDialogDescription>
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
          <DialogTitle>{mode === "create" ? "Novo webhook Legacy" : "Editar webhook Legacy"}</DialogTitle>
          <DialogDescription>O Store Mode foi validado antes desta operação; apenas Stores LEGACY aparecem neste formulário.</DialogDescription>
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
