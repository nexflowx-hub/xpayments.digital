"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Webhook,
  Plus,
  Pencil,
  Pause,
  Play,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Loader2,
  ShieldCheck,
  ServerCog,
  AlertTriangle,
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
import { toast } from "sonner";
import type { StoreControlItem, WebhookV2 } from "@/types/vnext";

const EVENTS = [
  { id: "payment.succeeded", label: "payment.succeeded", description: "Pagamento confirmado." },
  { id: "payment.failed", label: "payment.failed", description: "Pagamento recusado ou falhou." },
  { id: "refund.created", label: "refund.created", description: "Reembolso criado." },
  { id: "dispute.opened", label: "dispute.opened", description: "Disputa/chargeback aberto." },
  { id: "payout.created", label: "payout.created", description: "Payout criado no provider." },
] as const;

export default function WebhooksVNextPage() {
  const qc = useQueryClient();
  const { data: stores = [], isLoading: storesLoading, isError: storesError, refetch: refetchStores } = useStoreControl();
  const { data: webhooks = [], isLoading: hooksLoading, isError: hooksError, refetch: refetchHooks } = useWebhooksV2();

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

  const revealMutation = useMutation({
    mutationFn: (id: string) => vnextApi.webhooksV2.reveal(id),
    onSuccess: (data) => setSecret({ id: data.id, value: data.signingSecret }),
    onError: (error: { message?: string }) => toast.error(error?.message || "Signing secret indisponível"),
  });

  if (storesError || hooksError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Webhooks" description="Provider Direct V2 e entregas por Store." />
        <ErrorState
          message="Não foi possível carregar Webhooks V2."
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
        title="Webhooks"
        description="Gerencie endpoints por Store. Em modo OBSERVED, o XPayments sincroniza diretamente com o provider."
        actions={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
            disabled={observedStores.length === 0}
          >
            <Plus className="h-3.5 w-3.5" /> Novo endpoint
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Stores OBSERVED" value={observedStores.length} icon={ShieldCheck} />
        <SummaryCard label="Endpoints ativos" value={webhooks.filter((item) => item.status === "ACTIVE").length} icon={Webhook} />
        <SummaryCard label="Provider sync" value={webhooks.filter((item) => item.remoteSyncStatus === "SYNCED").length} icon={ServerCog} />
      </div>

      {orchestratedStores.length > 0 && (
        <Card className="border-violet-500/25 bg-violet-500/5 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            <div>
              <p className="text-sm font-medium">ORCHESTRATED</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {orchestratedStores.length} Store(s) usam processamento ORCHESTRATED. A entrega merchant via Outbox V2 será ativada separadamente; nenhum endpoint Stripe é alterado para estas Stores.
              </p>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <EmptyState
            icon={Webhook}
            title="Nenhum endpoint merchant V2"
            description="Os webhooks internos Observer já estão sincronizados. Crie aqui apenas endpoints que devem receber eventos na sua aplicação."
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
              revealing={revealMutation.isPending}
              changingStatus={statusMutation.isPending}
              removing={removeMutation.isPending}
              onReveal={() => revealMutation.mutate(webhook.id)}
              onHideSecret={() => setSecret((current) => current?.id === webhook.id ? null : current)}
              onEdit={() => setEditWebhook(webhook)}
              onPause={() => statusMutation.mutate({ id: webhook.id, status: "PAUSED" })}
              onResume={() => statusMutation.mutate({ id: webhook.id, status: "ACTIVE" })}
              onRemove={() => removeMutation.mutate(webhook.id)}
            />
          ))}
        </div>
      )}

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
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
      </div>
    </Card>
  );
}

function VNextWebhookCard({
  webhook,
  secret,
  revealing,
  changingStatus,
  removing,
  onReveal,
  onHideSecret,
  onEdit,
  onPause,
  onResume,
  onRemove,
}: {
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
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success("Signing secret copiado");
  };

  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{webhook.storeName}</p>
            <Badge variant="outline" className="font-mono text-[10px]">{webhook.storeCode}</Badge>
            <Badge variant="outline" className={webhook.status === "ACTIVE" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}>
              {webhook.status}
            </Badge>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">{webhook.remoteSyncStatus ?? "UNSYNCED"}</Badge>
          </div>

          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{webhook.url}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {webhook.events.map((event) => (
              <Badge key={event} variant="outline" className="border-primary/25 bg-primary/5 font-mono text-[10px] text-primary">{event}</Badge>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border/50 bg-background/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signing secret</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-black/30 px-2 py-1 font-mono text-xs text-zinc-300">
                {secret ?? (webhook.secretAvailable ? "whsec_••••••••••••" : "Unavailable")}
              </code>
              {secret ? (
                <>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onHideSecret}><EyeOff className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(secret)}><Copy className="h-3.5 w-3.5" /></Button>
                </>
              ) : webhook.secretAvailable ? (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onReveal} disabled={revealing}>
                  {revealing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:max-w-[250px] xl:justify-end">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
          {webhook.status === "ACTIVE" ? (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onPause} disabled={changingStatus}><Pause className="h-3.5 w-3.5" /> Pausar</Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onResume} disabled={changingStatus}><Play className="h-3.5 w-3.5" /> Retomar</Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="gap-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> Remover</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover endpoint?</AlertDialogTitle>
                <AlertDialogDescription>
                  O endpoint remoto será removido do provider e o signing secret cifrado será eliminado do XPayments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction className="bg-rose-600 text-white hover:bg-rose-600/90" onClick={onRemove} disabled={removing}>
                  {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover endpoint"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}

function WebhookEditorDialog({
  mode,
  open,
  onOpenChange,
  stores,
  webhook,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: StoreControlItem[];
  webhook?: WebhookV2 | null;
  onSaved: (secret?: { id: string; value: string } | null) => void;
}) {
  const [storeId, setStoreId] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<string[]>(["payment.succeeded", "payment.failed"]);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && webhook) {
      setStoreId(webhook.storeId);
      setUrl(webhook.url);
      setEvents(webhook.events);
    } else {
      setStoreId(stores[0]?.id ?? "");
      setUrl("");
      setEvents(["payment.succeeded", "payment.failed"]);
    }
  }, [open, mode, webhook, stores]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "create") {
        return vnextApi.webhooksV2.create({ storeId, url, events });
      }
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

  const toggleEvent = (event: string) => {
    setEvents((current) => current.includes(event) ? current.filter((item) => item !== event) : [...current, event]);
  };

  const valid = Boolean(storeId && url.startsWith("https://") && events.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo endpoint V2" : "Editar endpoint V2"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Para Stores OBSERVED, esta operação cria o webhook diretamente no provider e guarda o signing secret cifrado."
              : "URL, eventos e estado remoto permanecem sincronizados com o provider."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Store</Label>
            <Select value={storeId} onValueChange={setStoreId} disabled={mode === "edit"}>
              <SelectTrigger><SelectValue placeholder="Selecione a Store" /></SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>{store.name} ({store.storeCode})</SelectItem>
                ))}
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
              <label key={event.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <Checkbox checked={events.includes(event.id)} onCheckedChange={() => toggleEvent(event.id)} className="mt-0.5" />
                <div>
                  <code className="font-mono text-xs font-medium">{event.label}</code>
                  <p className="text-[11px] text-muted-foreground">{event.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="gap-1.5" onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ServerCog className="h-3.5 w-3.5" />}
            {mode === "create" ? "Criar e sincronizar" : "Guardar e sincronizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
