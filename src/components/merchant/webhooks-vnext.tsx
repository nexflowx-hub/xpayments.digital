"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  ServerCog,
  ShieldCheck,
  Trash2,
  Webhook,
} from "lucide-react";
import { PageHeader, EmptyState, ErrorState } from "@/components/shared";
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
import { useStoreControl, useWebhooksV2 } from "@/hooks/vnext";
import { vnextApi } from "@/lib/api/vnext";
import { xpApi } from "@/lib/api/xpApi";
import { toast } from "sonner";
import type { ApiKey } from "@/types";
import type { StoreControlItem, WebhookV2 } from "@/types/vnext";

const OBSERVED_STRIPE_EVENTS = [
  { id: "checkout.session.completed", description: "Checkout concluído." },
  { id: "checkout.session.async_payment_succeeded", description: "Pagamento assíncrono do Checkout confirmado." },
  { id: "checkout.session.async_payment_failed", description: "Pagamento assíncrono do Checkout falhou." },
  { id: "checkout.session.expired", description: "Checkout expirado." },
  { id: "payment_intent.succeeded", description: "PaymentIntent confirmado." },
  { id: "payment_intent.payment_failed", description: "PaymentIntent falhou." },
  { id: "charge.refunded", description: "Charge reembolsada." },
  { id: "charge.dispute.created", description: "Disputa criada." },
  { id: "charge.dispute.closed", description: "Disputa encerrada." },
  { id: "refund.created", description: "Refund criado." },
] as const;

const DEFAULT_OBSERVED_EVENTS = OBSERVED_STRIPE_EVENTS.map((event) => event.id);

export default function WebhooksVNextPage() {
  const qc = useQueryClient();
  const { data: stores = [], isLoading: storesLoading, isError: storesError, refetch: refetchStores } = useStoreControl();
  const { data: webhooks = [], isLoading: hooksLoading, isError: hooksError, refetch: refetchHooks } = useWebhooksV2();
  const { data: apiKeys = [], isLoading: apiKeysLoading } = useQuery({
    queryKey: ["api-keys", "vnext-webhooks"],
    queryFn: () => xpApi.apiKeys.list(),
    select: (data) => data ?? [],
  });

  const observedStores = React.useMemo(
    () => stores.filter((store) =>
      store.status === "active" &&
      store.integration.runtimeGeneration === "VNEXT" &&
      store.integration.processingMode === "OBSERVED" &&
      store.integration.webhookManagement === "PROVIDER_DIRECT"
    ),
    [stores],
  );

  const orchestratedStores = React.useMemo(
    () => stores.filter((store) =>
      store.integration.runtimeGeneration === "VNEXT" &&
      store.integration.processingMode === "ORCHESTRATED"
    ),
    [stores],
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editWebhook, setEditWebhook] = React.useState<WebhookV2 | null>(null);
  const [secret, setSecret] = React.useState<{ id: string; value: string } | null>(null);
  const [revealedApiKey, setRevealedApiKey] = React.useState<{ id: string; value: string } | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["webhooks", "v2"] });
    qc.invalidateQueries({ queryKey: ["store-control"] });
  };

  const removeMutation = useMutation({
    mutationFn: (id: string) => vnextApi.webhooksV2.remove(id),
    onSuccess: () => {
      refresh();
      toast.success("Webhook removido no XPayments e no provider");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível remover o webhook"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "PAUSED" }) =>
      vnextApi.webhooksV2.update(id, { status }),
    onSuccess: (_, variables) => {
      refresh();
      toast.success(variables.status === "ACTIVE" ? "Webhook retomado" : "Webhook pausado");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível alterar o webhook"),
  });

  const revealWebhookMutation = useMutation({
    mutationFn: (id: string) => vnextApi.webhooksV2.reveal(id),
    onSuccess: (data) => setSecret({ id: data.id, value: data.signingSecret }),
    onError: (error: { message?: string }) => toast.error(error?.message || "Signing secret indisponível"),
  });

  const revealApiKeyMutation = useMutation({
    mutationFn: (id: string) => xpApi.apiKeys.reveal(id),
    onSuccess: (data) => setRevealedApiKey({ id: data.id, value: data.fullKey }),
    onError: (error: { message?: string }) => toast.error(error?.message || "API key indisponível"),
  });

  if (storesError || hooksError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Webhooks" description="Provider Direct V2 e entregas por Store." />
        <ErrorState
          message="Não foi possível carregar o Store Control Plane."
          onRetry={() => {
            refetchStores();
            refetchHooks();
          }}
        />
      </div>
    );
  }

  const loading = storesLoading || hooksLoading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Webhooks & API"
        description="OBSERVED usa eventos Stripe nativos e Provider Direct. ORCHESTRATED expõe apenas API Keys XPAYMENTS."
        actions={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
            disabled={observedStores.length === 0}
          >
            <Plus className="h-3.5 w-3.5" /> Novo endpoint OBSERVED
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Stores OBSERVED" value={observedStores.length} icon={ShieldCheck} />
        <SummaryCard label="Webhooks ativos" value={webhooks.filter((item) => item.status === "ACTIVE").length} icon={Webhook} />
        <SummaryCard label="Observer SYNCED" value={observedStores.filter((store) => store.integration.observer.syncStatus === "SYNCED").length} icon={ServerCog} />
      </div>

      {observedStores.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">OBSERVED · Stripe Provider Direct</h2>
            <p className="mt-1 text-xs text-muted-foreground">Cada Store precisa de Provider Connection, Observer XPAYMENTS remoto e sync validado antes de operar.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {observedStores.map((store) => <ObservedReadinessCard key={store.id} store={store} />)}
          </div>
        </div>
      )}

      {orchestratedStores.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">ORCHESTRATED · XPAYMENTS API</h2>
            <p className="mt-1 text-xs text-muted-foreground">Nenhuma credencial Stripe é apresentada neste modo. As integrações usam API Keys XPAYMENTS por Store.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {orchestratedStores.map((store) => (
              <OrchestratedApiKeysCard
                key={store.id}
                store={store}
                keys={apiKeys.filter((key) => key.storeId === store.id)}
                loading={apiKeysLoading}
                revealed={revealedApiKey}
                revealing={revealApiKeyMutation.isPending}
                onReveal={(id) => revealApiKeyMutation.mutate(id)}
                onHide={() => setRevealedApiKey(null)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Merchant Webhooks · OBSERVED</h2>
          <p className="mt-1 text-xs text-muted-foreground">Novos endpoints usam os 10 eventos Stripe reais por defeito. O signing secret pode ser revelado e copiado depois da criação.</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-xl" />)}
          </div>
        ) : webhooks.length === 0 ? (
          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
            <EmptyState
              icon={Webhook}
              title="Nenhum endpoint merchant V2"
              description="Os Observers internos não aparecem nesta lista. Crie aqui apenas endpoints destinados à aplicação do Merchant."
              action={observedStores.length > 0 ? (
                <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Criar endpoint
                </Button>
              ) : undefined}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {webhooks.map((webhook) => (
              <VNextWebhookCard
                key={webhook.id}
                webhook={webhook}
                secret={secret?.id === webhook.id ? secret.value : null}
                revealing={revealWebhookMutation.isPending}
                changingStatus={statusMutation.isPending}
                removing={removeMutation.isPending}
                onReveal={() => revealWebhookMutation.mutate(webhook.id)}
                onHideSecret={() => setSecret((current) => current?.id === webhook.id ? null : current)}
                onEdit={() => setEditWebhook(webhook)}
                onPause={() => statusMutation.mutate({ id: webhook.id, status: "PAUSED" })}
                onResume={() => statusMutation.mutate({ id: webhook.id, status: "ACTIVE" })}
                onRemove={() => removeMutation.mutate(webhook.id)}
              />
            ))}
          </div>
        )}
      </div>

      <WebhookEditorDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        stores={observedStores}
        onSaved={(createdSecret) => {
          refresh();
          if (createdSecret) setSecret(createdSecret);
        }}
      />

      <WebhookEditorDialog
        mode="edit"
        open={Boolean(editWebhook)}
        onOpenChange={(open) => !open && setEditWebhook(null)}
        stores={observedStores}
        webhook={editWebhook}
        onSaved={() => {
          refresh();
          setEditWebhook(null);
        }}
      />
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
      </div>
    </Card>
  );
}

function ObservedReadinessCard({ store }: { store: StoreControlItem }) {
  const ready = Boolean(
    store.integration.connection?.status === "active" &&
    store.integration.connection?.ledgerEnabled &&
    store.integration.observer.endpointId &&
    store.integration.observer.syncStatus === "SYNCED" &&
    store.integration.observer.status === "ACTIVE"
  );

  return (
    <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{store.name}</p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{store.storeCode}</p>
        </div>
        <Badge variant="outline" className={ready ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}>{ready ? "READY" : "NOT READY"}</Badge>
      </div>
      <div className="mt-4 space-y-2 text-xs">
        <Row label="Stripe account" value={store.integration.provider?.accountRef ?? "—"} mono />
        <Row label="Connection" value={store.integration.connection?.status ?? "—"} />
        <Row label="Ledger" value={store.integration.connection?.ledgerEnabled ? "ENABLED" : "DISABLED"} />
        <Row label="Observer endpoint" value={store.integration.observer.endpointId ?? "MISSING"} mono />
        <Row label="Observer sync" value={store.integration.observer.syncStatus ?? "MISSING"} />
      </div>
    </Card>
  );
}

function OrchestratedApiKeysCard({
  store,
  keys,
  loading,
  revealed,
  revealing,
  onReveal,
  onHide,
}: {
  store: StoreControlItem;
  keys: ApiKey[];
  loading: boolean;
  revealed: { id: string; value: string } | null;
  revealing: boolean;
  onReveal: (id: string) => void;
  onHide: () => void;
}) {
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success("API key XPAYMENTS copiada");
  };

  return (
    <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold">{store.name}</p><p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{store.storeCode}</p></div>
        <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-300">ORCHESTRATED</Badge>
      </div>
      <div className="mt-4 space-y-2">
        {loading ? <Skeleton className="h-16 w-full" /> : keys.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">Nenhuma API Key XPAYMENTS associada a esta Store.</div>
        ) : keys.map((key) => {
          const full = revealed?.id === key.id ? revealed.value : null;
          return (
            <div key={key.id} className="rounded-lg border border-border/50 bg-background/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{key.name}</p>
                  <code className="mt-1 block truncate text-[11px] text-muted-foreground">{full ?? key.keyPreview ?? `${key.prefix}••••${key.lastFour}`}</code>
                </div>
                <div className="flex gap-1">
                  {full ? (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onHide}><EyeOff className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(full)}><Copy className="h-3.5 w-3.5" /></Button>
                    </>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onReveal(key.id)} disabled={revealing}>
                      {revealing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">{key.scopes.map((scope) => <Badge key={scope} variant="outline" className="font-mono text-[9px]">{scope}</Badge>)}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className={`max-w-[65%] break-all text-right ${mono ? "font-mono" : "font-medium"}`}>{value}</span></div>;
}

function VNextWebhookCard({ webhook, secret, revealing, changingStatus, removing, onReveal, onHideSecret, onEdit, onPause, onResume, onRemove }: {
  webhook: WebhookV2;
  secret: string | null;
  revealing: boolean;
  changingStatus: boolean;
  removing: boolean;
  onReveal: () => void;
  onHideSecret: () => void;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
  onRemove: () => void;
}) {
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast.success("Signing secret copiado"); };

  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{webhook.storeName}</p>
            <Badge variant="outline" className="font-mono text-[10px]">{webhook.storeCode}</Badge>
            <Badge variant="outline">{webhook.status}</Badge>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">{webhook.remoteSyncStatus ?? "UNSYNCED"}</Badge>
          </div>
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{webhook.url}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{webhook.events.map((event) => <Badge key={event} variant="outline" className="font-mono text-[10px]">{event}</Badge>)}</div>
          <div className="mt-4 rounded-lg border border-border/50 bg-background/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signing secret</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-black/30 px-2 py-1 font-mono text-xs text-zinc-300">{secret ?? (webhook.secretAvailable ? "whsec_••••••••••••" : "Unavailable")}</code>
              {secret ? (
                <><Button size="icon" variant="ghost" className="h-7 w-7" onClick={onHideSecret}><EyeOff className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(secret)}><Copy className="h-3.5 w-3.5" /></Button></>
              ) : webhook.secretAvailable ? (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onReveal} disabled={revealing}>{revealing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}</Button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 xl:max-w-[260px] xl:justify-end">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
          {webhook.status === "ACTIVE" ? <Button size="sm" variant="outline" className="gap-1.5" onClick={onPause} disabled={changingStatus}><Pause className="h-3.5 w-3.5" /> Pausar</Button> : <Button size="sm" variant="outline" className="gap-1.5" onClick={onResume} disabled={changingStatus}><Play className="h-3.5 w-3.5" /> Retomar</Button>}
          <AlertDialog>
            <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="gap-1.5 text-rose-400"><Trash2 className="h-3.5 w-3.5" /> Remover</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Remover endpoint?</AlertDialogTitle><AlertDialogDescription>O endpoint remoto será removido do provider e o signing secret cifrado será eliminado do XPayments.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onRemove} disabled={removing}>{removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover endpoint"}</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}

function WebhookEditorDialog({ mode, open, onOpenChange, stores, webhook, onSaved }: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: StoreControlItem[];
  webhook?: WebhookV2 | null;
  onSaved: (secret?: { id: string; value: string } | null) => void;
}) {
  const [storeId, setStoreId] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<string[]>(DEFAULT_OBSERVED_EVENTS);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && webhook) {
      setStoreId(webhook.storeId);
      setUrl(webhook.url);
      setEvents(webhook.events);
    } else {
      setStoreId(stores[0]?.id ?? "");
      setUrl("");
      setEvents([...DEFAULT_OBSERVED_EVENTS]);
    }
  }, [open, mode, webhook, stores]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "create") return vnextApi.webhooksV2.create({ storeId, url, events });
      if (!webhook) throw new Error("Webhook não selecionado");
      return vnextApi.webhooksV2.update(webhook.id, { url, events });
    },
    onSuccess: (data) => {
      if (mode === "create" && "signingSecret" in data) {
        onSaved({ id: data.id, value: data.signingSecret });
        toast.success("Endpoint criado e sincronizado no provider");
      } else {
        onSaved(null);
        toast.success("Endpoint atualizado no provider");
      }
      onOpenChange(false);
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível sincronizar o endpoint"),
  });

  const toggleEvent = (event: string) => setEvents((current) => current.includes(event) ? current.filter((item) => item !== event) : [...current, event]);
  const valid = Boolean(storeId && url.startsWith("https://") && events.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo endpoint OBSERVED" : "Editar endpoint OBSERVED"}</DialogTitle>
          <DialogDescription>Os eventos abaixo são enviados à Stripe com os nomes nativos, sem tradução intermédia.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Store</Label>
            <Select value={storeId} onValueChange={setStoreId} disabled={mode === "edit"}>
              <SelectTrigger><SelectValue placeholder="Selecione a Store" /></SelectTrigger>
              <SelectContent>{stores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name} ({store.storeCode})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5"><Label>Endpoint HTTPS</Label><Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://api.merchant.com/stripe/events" /></div>
          <div className="flex items-center justify-between"><Label>Eventos Stripe</Label><Button type="button" size="sm" variant="ghost" onClick={() => setEvents([...DEFAULT_OBSERVED_EVENTS])}>Selecionar 10/10</Button></div>
          <div className="grid gap-2">
            {OBSERVED_STRIPE_EVENTS.map((event) => (
              <label key={event.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <Checkbox checked={events.includes(event.id)} onCheckedChange={() => toggleEvent(event.id)} className="mt-0.5" />
                <div><code className="font-mono text-xs font-medium">{event.id}</code><p className="text-[11px] text-muted-foreground">{event.description}</p></div>
              </label>
            ))}
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-muted-foreground"><AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-amber-300" />`checkout.session.completed` e `payment_intent.succeeded` podem representar o mesmo pagamento. O Finance Core deve continuar a deduplicar semanticamente antes de qualquer lançamento financeiro.</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="gap-1.5" onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>{mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}{mode === "create" ? "Criar e sincronizar" : "Guardar e sincronizar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
