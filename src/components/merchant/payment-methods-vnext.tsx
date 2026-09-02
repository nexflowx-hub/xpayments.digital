"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Store as StoreIcon,
  XCircle,
} from "lucide-react";
import { useStoreControl } from "@/hooks/vnext";
import { vnextApi } from "@/lib/api/vnext";
import { PageHeader, ErrorState } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { StoreControlItem, StorePaymentMethod, StorePaymentMethodsResponse } from "@/types/vnext";

type FilterState = "ALL" | "ACTIVE" | "DISABLED" | "UNAVAILABLE";

function statusTone(status: StorePaymentMethod["status"]) {
  if (status === "ACTIVE") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "DISABLED") return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
  if (status === "LOCKED") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-rose-500/30 bg-rose-500/10 text-rose-300";
}

function statusIcon(status: StorePaymentMethod["status"]) {
  if (status === "ACTIVE") return CheckCircle2;
  if (status === "LOCKED") return LockKeyhole;
  if (status === "DISABLED") return XCircle;
  return AlertTriangle;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function StorePaymentMethodsPanel({
  store,
  embedded = false,
}: {
  store: StoreControlItem;
  embedded?: boolean;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<FilterState>("ALL");

  const isVNextStripe =
    store.integration.runtimeGeneration === "VNEXT" &&
    store.integration.provider?.type?.toLowerCase() === "stripe";

  const query = useQuery({
    queryKey: ["store-payment-methods", store.id],
    queryFn: () => vnextApi.paymentMethods.list(store.id),
    enabled: isVNextStripe,
    retry: false,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ methodId, enabled }: { methodId: string; enabled: boolean }) =>
      vnextApi.paymentMethods.update(store.id, methodId, { enabled }),
    onSuccess: (data, variables) => {
      qc.setQueryData(["store-payment-methods", store.id], data);
      toast.success(`${variables.methodId} ${variables.enabled ? "ativado" : "desativado"} no provider`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || "Não foi possível atualizar o método de pagamento");
      qc.invalidateQueries({ queryKey: ["store-payment-methods", store.id] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!query.data) throw new Error("Payment Methods ainda não carregados");
      const targets = query.data.methods.filter((method) => method.editable && method.enabled !== enabled);
      let latest: StorePaymentMethodsResponse = query.data;
      for (const method of targets) {
        latest = await vnextApi.paymentMethods.update(store.id, method.id, { enabled });
      }
      return { data: latest, enabled, changed: targets.length };
    },
    onSuccess: ({ data, enabled, changed }) => {
      qc.setQueryData(["store-payment-methods", store.id], data);
      toast.success(
        enabled
          ? `${changed} métodos enviados para ON na Stripe`
          : `${changed} métodos enviados para OFF na Stripe`,
        {
          description: enabled
            ? "Métodos não elegíveis podem permanecer UNAVAILABLE mesmo com preferência ON."
            : "A configuração efetiva foi relida da Stripe.",
        },
      );
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || "A operação em massa não foi concluída");
      qc.invalidateQueries({ queryKey: ["store-payment-methods", store.id] });
    },
  });

  if (!isVNextStripe) {
    return (
      <Card className="border-border/60 bg-background/30 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-muted/50 p-2 text-muted-foreground"><CreditCard className="h-4 w-4" /></div>
          <div>
            <p className="text-sm font-medium">Payment Methods</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gestão dinâmica disponível para Stores VNext ligadas à Stripe. Stores Legacy permanecem somente leitura e providers adicionais serão ligados pelo mesmo contrato.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
            <div>
              <p className="text-sm font-medium text-amber-200">Payment Methods API indisponível</p>
              <p className="mt-1 text-xs text-muted-foreground">
                A Store e o restante Control Plane continuam operacionais. Ative o endpoint VNext de Payment Method Configuration no backend para carregar a configuração Stripe em tempo real.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => query.refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Tentar
          </Button>
        </div>
      </Card>
    );
  }

  const data = query.data;
  const needle = normalizeSearch(search);
  const methods = data.methods.filter((method) => {
    const matchesFilter = filter === "ALL" || method.status === filter || (filter === "UNAVAILABLE" && method.status === "LOCKED");
    const matchesSearch = !needle || `${method.id} ${method.label} ${method.category}`.toLowerCase().includes(needle);
    return matchesFilter && matchesSearch;
  });

  const active = data.methods.filter((method) => method.status === "ACTIVE").length;
  const disabled = data.methods.filter((method) => method.status === "DISABLED").length;
  const unavailable = data.methods.filter((method) => method.status === "UNAVAILABLE" || method.status === "LOCKED").length;
  const busy = mutation.isPending || bulkMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={embedded ? "text-sm font-semibold" : "text-base font-semibold"}>Payment Methods</h3>
            <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-300">STRIPE</Badge>
            {data.isDefault && <Badge variant="outline">Default config</Badge>}
            <Badge variant="outline" className={data.livemode ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : ""}>
              {data.livemode ? "LIVE" : "TEST"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.configurationName ?? "Payment Method Configuration"} · {data.configurationId ?? "sem configuração remota"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => bulkMutation.mutate(true)}
            disabled={busy || data.methods.every((method) => !method.editable || method.enabled)}
          >
            {bulkMutation.isPending && bulkMutation.variables === true ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Ativar todos
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={busy || data.methods.every((method) => !method.editable || !method.enabled)}
            onClick={() => window.confirm("Desativar todos os métodos editáveis desta Store? Isso pode impedir pagamentos até reativá-los.") && bulkMutation.mutate(false)}
          >
            {bulkMutation.isPending && bulkMutation.variables === false ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Desativar todos
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => query.refetch()} disabled={query.isFetching || busy}>
            {query.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Atualizar Stripe
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Ativos" value={active} tone="text-emerald-300" />
        <Metric label="Desativados" value={disabled} tone="text-zinc-300" />
        <Metric label="Indisponíveis" value={unavailable} tone="text-rose-300" />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar card, BLIK, MB WAY, PayPal..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["ALL", "ACTIVE", "DISABLED", "UNAVAILABLE"] as FilterState[]).map((value) => (
            <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>
              {value === "ALL" ? "Todos" : value === "ACTIVE" ? "Ativos" : value === "DISABLED" ? "Desativados" : "Indisponíveis"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {methods.map((method) => {
          const Icon = statusIcon(method.status);
          const pending = mutation.isPending && mutation.variables?.methodId === method.id;
          return (
            <Card key={method.id} className="border-border/60 bg-background/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <p className="truncate text-sm font-medium">{method.label}</p>
                  </div>
                  <code className="mt-1 block truncate text-[10px] text-muted-foreground">{method.id}</code>
                </div>
                <Badge variant="outline" className={statusTone(method.status)}>{method.status}</Badge>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{method.category}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    preference={method.preference} · available={method.available ? "true" : "false"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  <Switch
                    checked={method.enabled}
                    disabled={!method.editable || pending || bulkMutation.isPending}
                    onCheckedChange={(checked) => mutation.mutate({ methodId: method.id, enabled: checked })}
                    aria-label={`${method.enabled ? "Desativar" : "Ativar"} ${method.label}`}
                  />
                </div>
              </div>

              {!method.editable && (
                <p className="mt-2 text-[10px] text-amber-300">Esta configuração não pode ser alterada por esta conta.</p>
              )}
              {method.reason && <p className="mt-2 text-[10px] text-muted-foreground">{method.reason}</p>}
            </Card>
          );
        })}
      </div>

      {methods.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">Nenhum método corresponde ao filtro atual.</div>
      )}

      {store.integration.processingMode === "OBSERVED" && (
        <div className="flex items-start gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-muted-foreground">
          <SlidersHorizontal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
          <span>
            OBSERVED: esta configuração governa métodos dinâmicos da conta Stripe. Um checkout externo que envie explicitamente <code className="font-mono">payment_method_types</code> pode impor a sua própria lista. Métodos com preferência ON podem continuar UNAVAILABLE até a Stripe considerar a conta/contexto elegível.
          </span>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="border-border/60 bg-background/30 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </Card>
  );
}

export default function PaymentMethodsVNextPage() {
  const { data: stores = [], isLoading, isError, refetch } = useStoreControl();

  const stripeStores = React.useMemo(
    () => stores.filter((store) =>
      store.integration.runtimeGeneration === "VNEXT" &&
      store.integration.provider?.type?.toLowerCase() === "stripe"
    ),
    [stores],
  );

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Payment Methods" description="Métodos de pagamento ativos, desativados e indisponíveis por Store." />
        <ErrorState message="Não foi possível carregar o Store Control Plane." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payment Methods"
        description="Controle central dos métodos de pagamento configurados no provider, sem expor credenciais Stripe no browser."
        actions={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar Stores
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-4"><p className="text-xs text-muted-foreground">Stores VNext Stripe</p><p className="mt-1 text-2xl font-semibold">{stripeStores.length}</p></Card>
        <Card className="border-border/60 bg-card/60 p-4"><p className="text-xs text-muted-foreground">OBSERVED</p><p className="mt-1 text-2xl font-semibold">{stripeStores.filter((store) => store.integration.processingMode === "OBSERVED").length}</p></Card>
        <Card className="border-border/60 bg-card/60 p-4"><p className="text-xs text-muted-foreground">ORCHESTRATED</p><p className="mt-1 text-2xl font-semibold">{stripeStores.filter((store) => store.integration.processingMode === "ORCHESTRATED").length}</p></Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-xl" />)}</div>
      ) : stripeStores.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/40 p-8 text-center">
          <StoreIcon className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Nenhuma Store VNext Stripe</p>
          <p className="mt-1 text-xs text-muted-foreground">Assim que uma Store Stripe entrar no VNext, os métodos aparecem automaticamente aqui.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {stripeStores.map((store) => (
            <Card key={store.id} className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">{store.name}</h2></div>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{store.storeCode} · {store.integration.provider?.accountRef ?? "—"}</p>
                </div>
                <div className="flex gap-1.5"><Badge variant="outline">{store.integration.processingMode ?? "UNSET"}</Badge><Badge variant="outline">{store.integration.activationState ?? "—"}</Badge></div>
              </div>
              <StorePaymentMethodsPanel store={store} embedded />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}