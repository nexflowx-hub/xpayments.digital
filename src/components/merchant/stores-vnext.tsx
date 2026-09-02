"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store as StoreIcon,
  Globe,
  Settings2,
  Webhook,
  ShieldCheck,
  Copy,
  Eye,
  EyeOff,
  Pause,
  Play,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ServerCog,
} from "lucide-react";
import { useStoreControl, useWebhooksV2 } from "@/hooks/vnext";
import { useFinanceStores } from "@/hooks/queries";
import { vnextApi } from "@/lib/api/vnext";
import { PageHeader, ErrorState } from "@/components/shared";
import { FinanceCurrencySelector } from "@/components/shared/finance-currency-selector";
import { useFinanceCurrencyStore } from "@/stores/finance-currency";
import { StatusBadge } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import type { FinanceStore } from "@/types";
import type { StoreControlItem, WebhookV2 } from "@/types/vnext";

const EVENTS = [
  ["payment.succeeded", "Payment succeeded"],
  ["payment.failed", "Payment failed"],
  ["refund.created", "Refund created"],
  ["dispute.opened", "Dispute opened"],
  ["payout.created", "Payout created"],
] as const;

function money(value: number | undefined | null, currency: string) {
  return value === undefined || value === null ? "—" : formatCurrency(value, currency);
}

function modeTone(mode?: string | null) {
  if (mode === "OBSERVED") return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  if (mode === "ORCHESTRATED") return "border-violet-500/30 bg-violet-500/10 text-violet-300";
  return "border-border/60 bg-muted/30 text-muted-foreground";
}

function activationTone(state?: string | null) {
  if (state === "ACTIVE") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (state === "SHADOW") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (state === "DISABLED") return "border-rose-500/30 bg-rose-500/10 text-rose-300";
  return "border-border/60 bg-muted/30 text-muted-foreground";
}

export default function StoresVNextPage() {
  const t = useT();
  const financeCurrency = useFinanceCurrencyStore((s) => s.currency);
  const { data: stores = [], isLoading, isError, refetch } = useStoreControl();
  const { data: financeData } = useFinanceStores(financeCurrency);
  const [selected, setSelected] = React.useState<StoreControlItem | null>(null);

  const financeMap = React.useMemo(() => {
    const map = new Map<string, FinanceStore>();
    financeData?.stores?.forEach((item) => map.set(item.storeId, item));
    return map;
  }, [financeData]);

  const active = stores.filter((s) => s.status === "active").length;
  const observed = stores.filter((s) => s.integration.processingMode === "OBSERVED").length;
  const vnext = stores.filter((s) => s.integration.runtimeGeneration === "VNEXT").length;

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t("nav.stores")}
          description="Store Control Plane e integrações de processamento."
        />
        <ErrorState
          message="Não foi possível carregar o Store Control Plane."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.stores")}
        description="Gerencie processamento, provider, webhooks e estado operacional por Store."
        actions={
          <div className="flex items-center gap-2">
            <FinanceCurrencySelector />
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" /> Atualizar
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Stat label="Total de Stores" value={formatNumber(stores.length)} icon={StoreIcon} />
            <Stat label="Ativas" value={formatNumber(active)} icon={CheckCircle2} />
            <Stat label="VNext" value={formatNumber(vnext)} icon={ServerCog} />
            <Stat label="Observed" value={formatNumber(observed)} icon={ShieldCheck} />
          </>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store, index) => {
            const finance = financeMap.get(store.id);
            const integration = store.integration;

            return (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                whileHover={{ y: -3 }}
              >
                <Card className="group relative h-full overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <StoreIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{store.name}</p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{store.storeCode}</p>
                      </div>
                    </div>
                    <StatusBadge status={store.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={modeTone(integration.processingMode)}>
                      {integration.processingMode ?? "UNSET"}
                    </Badge>
                    <Badge variant="outline" className={activationTone(integration.activationState)}>
                      {integration.activationState ?? "LEGACY"}
                    </Badge>
                    <Badge variant="outline" className="border-border/60 bg-muted/30 text-muted-foreground">
                      {integration.runtimeGeneration}
                    </Badge>
                  </div>

                  {store.domain && (
                    <a
                      className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      href={`https://${store.domain}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Globe className="h-3 w-3" /> {store.domain}
                    </a>
                  )}

                  <div className="mt-4 rounded-lg border border-border/50 bg-background/30 p-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Provider</span>
                      <span className="font-medium uppercase">{integration.provider?.type ?? "—"}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Conta</span>
                      <span className="font-mono">{integration.provider?.accountRef ?? "—"}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Webhook sync</span>
                      <span className={integration.observer.syncStatus === "SYNCED" ? "text-emerald-300" : "text-muted-foreground"}>
                        {integration.observer.syncStatus ?? "—"}
                      </span>
                    </div>
                  </div>

                  {finance ? (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Metric label="Bruto" value={money(finance.gross, financeCurrency)} />
                      <Metric label="Líquido" value={money(finance.net, financeCurrency)} />
                      <Metric label="Pendente" value={money(finance.pending, financeCurrency)} />
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-border/60 py-4 text-center text-xs text-muted-foreground">
                      Sem atividade financeira registrada
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="rounded-md bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                      {store.currency}
                    </span>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSelected(store)}>
                      <Settings2 className="h-3.5 w-3.5" /> Gerenciar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <StoreManager store={selected} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="rounded-lg bg-primary/10 p-1.5 text-primary"><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-xs font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function StoreManager({
  store,
  open,
  onOpenChange,
}: {
  store: StoreControlItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!store) return null;

  const integration = store.integration;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="h-4 w-4 text-primary" /> {store.name}
          </DialogTitle>
          <DialogDescription>
            {store.storeCode} · Store Control Plane
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Processing" icon={ServerCog}>
            <InfoRow label="Runtime" value={integration.runtimeGeneration} />
            <InfoRow label="Mode" value={integration.processingMode ?? "—"} />
            <InfoRow label="Activation" value={integration.activationState ?? "—"} />
            <InfoRow label="Ledger" value={integration.connection ? (integration.connection.ledgerEnabled ? "ENABLED" : "DISABLED") : "—"} />
          </InfoCard>

          <InfoCard title="Provider Connection" icon={ShieldCheck}>
            <InfoRow label="Provider" value={integration.provider?.type?.toUpperCase() ?? "—"} />
            <InfoRow label="Account" value={integration.provider?.accountRef ?? "—"} mono />
            <InfoRow label="Alias" value={integration.connection?.alias ?? "—"} mono />
            <InfoRow label="Connection" value={integration.connection?.status ?? "—"} />
          </InfoCard>

          <InfoCard title="Observer" icon={Webhook}>
            <InfoRow label="Webhook management" value={integration.webhookManagement} />
            <InfoRow label="Remote endpoint" value={integration.observer.endpointId ?? "—"} mono />
            <InfoRow label="Remote sync" value={integration.observer.syncStatus ?? "—"} />
            <InfoRow label="Status" value={integration.observer.status ?? "—"} />
          </InfoCard>

          <InfoCard title="Lifecycle" icon={CheckCircle2}>
            <InfoRow label="Store" value={store.status} />
            <InfoRow label="Effective from" value={integration.effectiveFrom ? new Date(integration.effectiveFrom).toLocaleString() : "—"} />
            <InfoRow label="Legacy compatibility" value={integration.legacyCompatibility ? "ON" : "OFF"} />
            <InfoRow label="Currency" value={store.currency} />
          </InfoCard>
        </div>

        <div className="border-t border-border/60 pt-4">
          {integration.webhookManagement === "PROVIDER_DIRECT" ? (
            <ObservedWebhookManager store={store} />
          ) : integration.webhookManagement === "XPAYMENTS" ? (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 text-sm">
              <p className="font-medium text-violet-200">ORCHESTRATED Store</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Os endpoints desta Store serão geridos pelo Webhook Outbox V2 do XPayments. A entrega direta do provider não é usada.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
              <p className="font-medium text-amber-200">Legacy Store</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Esta Store continua no runtime legado. A configuração existente permanece intacta e somente leitura neste Control Plane.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="border-border/60 bg-background/30 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`max-w-[65%] break-all text-right ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

function ObservedWebhookManager({ store }: { store: StoreControlItem }) {
  const qc = useQueryClient();
  const { data: webhooks = [], isLoading } = useWebhooksV2(store.id);
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<string[]>(["payment.succeeded", "payment.failed"]);
  const [editing, setEditing] = React.useState<WebhookV2 | null>(null);
  const [lastSecret, setLastSecret] = React.useState("");
  const [revealed, setRevealed] = React.useState<Record<string, string>>({});

  const refresh = () => qc.invalidateQueries({ queryKey: ["webhooks", "v2"] });

  const createMutation = useMutation({
    mutationFn: () => vnextApi.webhooksV2.create({ storeId: store.id, url, events }),
    onSuccess: (created) => {
      setLastSecret(created.signingSecret);
      setUrl("");
      setEvents(["payment.succeeded", "payment.failed"]);
      refresh();
      toast.success("Webhook criado e sincronizado diretamente na Stripe");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Falha ao criar webhook"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { url?: string; events?: string[]; status?: "ACTIVE" | "PAUSED" } }) =>
      vnextApi.webhooksV2.update(id, payload),
    onSuccess: () => {
      refresh();
      setEditing(null);
      toast.success("Webhook sincronizado");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Falha ao atualizar webhook"),
  });

  const revealMutation = useMutation({
    mutationFn: (id: string) => vnextApi.webhooksV2.reveal(id),
    onSuccess: (data) => setRevealed((prev) => ({ ...prev, [data.id]: data.signingSecret })),
    onError: () => toast.error("Signing secret indisponível"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => vnextApi.webhooksV2.remove(id),
    onSuccess: () => {
      refresh();
      toast.success("Webhook removido da Stripe");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Falha ao remover webhook"),
  });

  const toggle = (event: string) => {
    setEvents((current) => current.includes(event) ? current.filter((item) => item !== event) : [...current, event]);
  };

  const startEdit = (webhook: WebhookV2) => {
    setEditing(webhook);
    setUrl(webhook.url);
    setEvents(webhook.events);
    setLastSecret("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setUrl("");
    setEvents(["payment.succeeded", "payment.failed"]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Webhook className="h-4 w-4 text-primary" /> Merchant webhooks
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Como esta Store está em OBSERVED, o XPayments cria e atualiza estes endpoints diretamente no provider. As credenciais do provider não são expostas.
        </p>
      </div>

      {lastSecret && (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-emerald-200">Signing secret</p>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{lastSecret}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(lastSecret)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <Card className="border-border/60 bg-background/30 p-4">
        <p className="mb-3 text-xs font-semibold">{editing ? "Editar endpoint" : "Novo endpoint"}</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>HTTPS endpoint</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://merchant.example/webhooks/xpayments" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {EVENTS.map(([id, label]) => (
              <label key={id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs">
                <Checkbox checked={events.includes(id)} onCheckedChange={() => toggle(id)} className="mt-0.5" />
                <span><code className="font-mono text-[11px]">{id}</code><span className="mt-0.5 block text-[10px] text-muted-foreground">{label}</span></span>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            wallet.updated é um evento do XPayments e não é provisionado diretamente numa Store OBSERVED.
          </p>
          <div className="flex justify-end gap-2">
            {editing && <Button size="sm" variant="outline" onClick={cancelEdit}>Cancelar</Button>}
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!url.startsWith("https://") || events.length === 0 || createMutation.isPending || updateMutation.isPending}
              onClick={() => editing
                ? updateMutation.mutate({ id: editing.id, payload: { url, events } })
                : createMutation.mutate()}
            >
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {editing ? "Salvar" : "Criar na Stripe"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : webhooks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 py-5 text-center text-xs text-muted-foreground">
            Nenhum merchant webhook configurado nesta Store.
          </div>
        ) : webhooks.map((webhook) => {
          const secret = revealed[webhook.id];
          const synced = webhook.remoteSyncStatus === "SYNCED";
          return (
            <Card key={webhook.id} className="border-border/60 bg-background/30 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={synced ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : ""}>
                      {webhook.remoteSyncStatus ?? webhook.status}
                    </Badge>
                    <Badge variant="outline">{webhook.status}</Badge>
                  </div>
                  <p className="mt-2 break-all font-mono text-[11px]">{webhook.url}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{webhook.remoteEndpointId ?? "—"}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {webhook.events.map((event) => <span key={event} className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{event}</span>)}
                  </div>
                  {secret && (
                    <div className="mt-2 flex items-center gap-2 rounded bg-muted/30 px-2 py-1.5">
                      <code className="min-w-0 flex-1 break-all text-[10px]">{secret}</code>
                      <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(secret)}><Copy className="h-3 w-3" /></Button>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-1">
                  <Button size="sm" variant="outline" title="Edit" onClick={() => startEdit(webhook)}>
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    title={secret ? "Hide secret" : "Reveal secret"}
                    onClick={() => secret
                      ? setRevealed((prev) => { const next = { ...prev }; delete next[webhook.id]; return next; })
                      : revealMutation.mutate(webhook.id)}
                  >
                    {secret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    title={webhook.status === "PAUSED" ? "Resume" : "Pause"}
                    onClick={() => updateMutation.mutate({
                      id: webhook.id,
                      payload: { status: webhook.status === "PAUSED" ? "ACTIVE" : "PAUSED" },
                    })}
                  >
                    {webhook.status === "PAUSED" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-300"
                    title="Delete"
                    onClick={() => window.confirm("Remover este endpoint também da Stripe?") && removeMutation.mutate(webhook.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
