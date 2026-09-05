"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Pencil, Plus, Trash2, Webhook } from "lucide-react";
import { useWebhooks } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import type { StoreControlItem } from "@/types/vnext";
import type { Webhook as MerchantWebhook } from "@/types";

const EVENTS = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.processing",
  "payment_intent.canceled",
] as const;

export default function OrchestratedMerchantDelivery({ stores }: { stores: StoreControlItem[] }) {
  const { data: hooks = [], isLoading } = useWebhooks();
  const qc = useQueryClient();
  const storeIds = React.useMemo(() => new Set(stores.map((store) => store.id)), [stores]);
  const merchantHooks = React.useMemo(
    () => hooks.filter((hook) => Boolean(hook.storeId && storeIds.has(hook.storeId))),
    [hooks, storeIds],
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editHook, setEditHook] = React.useState<MerchantWebhook | null>(null);
  const [createdSecret, setCreatedSecret] = React.useState<{ store: string; value: string } | null>(null);
  const [storeId, setStoreId] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<string[]>([...EVENTS]);

  React.useEffect(() => {
    if (createOpen) {
      setStoreId(stores[0]?.id ?? "");
      setUrl("");
      setEvents([...EVENTS]);
    }
  }, [createOpen, stores]);

  React.useEffect(() => {
    if (!editHook) return;
    setStoreId(editHook.storeId ?? "");
    setUrl(editHook.url);
    setEvents(editHook.events ?? [...EVENTS]);
  }, [editHook]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["webhooks"] });

  const createMutation = useMutation({
    mutationFn: () => xpApi.webhooks.create({ storeId, url, events }),
    onSuccess: (created) => {
      refresh();
      setCreateOpen(false);
      if (created.secret) {
        setCreatedSecret({ store: created.storeCode ?? created.storeName ?? "Store", value: created.secret });
      }
      toast.success("Endpoint Merchant criado");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível criar o endpoint"),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editHook) throw new Error("Webhook não selecionado");
      return xpApi.webhooks.update(editHook.id, url, events);
    },
    onSuccess: () => {
      refresh();
      setEditHook(null);
      toast.success("Endpoint Merchant atualizado");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível atualizar o endpoint"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => xpApi.webhooks.remove(id),
    onSuccess: () => {
      refresh();
      toast.success("Endpoint Merchant removido");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível remover o endpoint"),
  });

  const toggleEvent = (event: string) =>
    setEvents((current) => current.includes(event) ? current.filter((item) => item !== event) : [...current, event]);

  const valid = Boolean(storeId && url.startsWith("https://") && events.length > 0);

  if (stores.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Merchant Delivery · ORCHESTRATED</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure o endpoint HTTPS que recebe notificações XPayments → Merchant. Estes endpoints não alteram os webhooks Stripe internos.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Novo endpoint Merchant
        </Button>
      </div>

      {createdSecret && (
        <Card className="border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="text-xs font-semibold text-emerald-300">Signing secret criado · {createdSecret.store}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Copie e guarde agora. Por segurança, a listagem normal não volta a expor o secret completo.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-black/30 px-2 py-1.5 font-mono text-xs">{createdSecret.value}</code>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(createdSecret.value).then(() => toast.success("Signing secret copiado"))}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : merchantHooks.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/50 p-5">
          <p className="text-sm font-medium">Nenhum endpoint Merchant configurado</p>
          <p className="mt-1 text-xs text-muted-foreground">Crie um endpoint por Store para receber succeeded, failed, processing e canceled.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {merchantHooks.map((hook) => (
            <Card key={hook.id} className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{hook.storeName ?? "Store"}</p>
                    <Badge variant="outline" className="font-mono text-[10px]">{hook.storeCode ?? "ORCHESTRATED"}</Badge>
                    <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-300">{hook.status}</Badge>
                  </div>
                  <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{hook.url}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditHook(hook)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => removeMutation.mutate(hook.id)} disabled={removeMutation.isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(hook.events ?? []).map((event) => <Badge key={event} variant="outline" className="font-mono text-[9px]">{event}</Badge>)}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Assinatura: <span className="font-mono">x-nexflowx-signature</span> · HMAC-SHA256</p>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen || Boolean(editHook)} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditHook(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editHook ? "Editar endpoint Merchant" : "Novo endpoint Merchant"}</DialogTitle>
            <DialogDescription>Entrega XPayments → Merchant. Não cria nem altera endpoints Stripe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Store ORCHESTRATED</Label>
              <Select value={storeId} onValueChange={setStoreId} disabled={Boolean(editHook)}>
                <SelectTrigger><SelectValue placeholder="Selecione a Store" /></SelectTrigger>
                <SelectContent>{stores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name} ({store.storeCode})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Endpoint HTTPS</Label>
              <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://api.merchant.com/webhooks/xpayments" />
            </div>
            <div className="space-y-2">
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
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditHook(null); }}>Cancelar</Button>
            <Button disabled={!valid || createMutation.isPending || updateMutation.isPending} onClick={() => editHook ? updateMutation.mutate() : createMutation.mutate()} className="gap-1.5">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar endpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
