"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  Palette,
  RefreshCw,
  Save,
  Search,
  Settings2,
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type {
  StoreControlItem,
  StorePaymentMethod,
  StorePaymentMethods,
  UpdateCheckoutBrandingPayload,
} from "@/types/vnext";

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

function CheckoutBrandingPanel({ store }: { store: StoreControlItem }) {
  const qc = useQueryClient();
  const detail = useQuery({
    queryKey: ["merchant-store-detail", store.id],
    queryFn: () => vnextApi.storeControl.merchantDetail(store.id),
    staleTime: 30_000,
  });

  const [displayName, setDisplayName] = React.useState(store.name);
  const [logoUrl, setLogoUrl] = React.useState("");
  const [primaryColor, setPrimaryColor] = React.useState("#111111");
  const [mode, setMode] = React.useState<"light" | "dark" | "system">("light");

  React.useEffect(() => {
    const branding = detail.data?.checkoutBranding;
    if (!branding) return;
    setDisplayName(branding.checkoutDisplayName || store.name);
    setLogoUrl(branding.logoUrl || "");
    setPrimaryColor(branding.primaryColor || "#111111");
    setMode(branding.mode || "light");
  }, [detail.data, store.name]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateCheckoutBrandingPayload) =>
      vnextApi.storeControl.updateCheckoutBranding(store.id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["merchant-store-detail", store.id] });
      toast.success("Checkout atualizado", {
        description: `${data.checkoutBranding.checkoutDisplayName} será usado nas próximas sessões e sessões carregadas novamente.`,
      });
    },
    onError: (error: { message?: string }) =>
      toast.error(error?.message || "Não foi possível guardar o branding do Checkout"),
  });

  const valid =
    displayName.trim().length >= 2 &&
    /^#[0-9a-fA-F]{6}$/.test(primaryColor) &&
    (!logoUrl.trim() || /^https:\/\//i.test(logoUrl.trim()));

  const save = () => mutation.mutate({
    checkoutDisplayName: displayName.trim(),
    primaryColor,
    mode,
    logoUrl: logoUrl.trim() || null,
    autoReturnSeconds: 3,
  });

  return (
    <Card className="relative overflow-hidden border-border/60 bg-background/30 p-4 sm:p-5">
      <div
        className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Checkout Branding</h3>
              <Badge variant="outline">PUBLIC</Badge>
            </div>
            <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
              Personalize o nome mostrado ao cliente, logo, cor e tema. O nome interno da Store e o Store Code permanecem inalterados.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" disabled={!valid || mutation.isPending || detail.isLoading} onClick={save}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Guardar Checkout
          </Button>
        </div>

        {detail.isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nome público no Checkout</Label>
                <Input
                  value={displayName}
                  maxLength={80}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Minha Loja"
                />
                <p className="text-[10px] text-muted-foreground">
                  Nome interno: <span className="font-mono">{store.name}</span> · não será alterado.
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Logo HTTPS</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={logoUrl}
                    onChange={(event) => setLogoUrl(event.target.value)}
                    placeholder="https://merchant.example/logo.svg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Cor principal</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-background p-1"
                    aria-label="Cor principal do checkout"
                  />
                  <Input value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="font-mono" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tema</Label>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as "light" | "dark" | "system")}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">Sistema do cliente</option>
                </select>
              </div>
            </div>

            <div
              className={`relative overflow-hidden rounded-[24px] border p-4 shadow-sm ${mode === "dark" ? "border-zinc-700 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-950"}`}
            >
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5">
                    <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: primaryColor }}>
                    {displayName.slice(0, 2).toUpperCase() || "XP"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{displayName || "Checkout"}</p>
                  <p className={`text-[10px] ${mode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>Secure checkout · {store.currency}</p>
                </div>
              </div>
              <div className={`mt-4 rounded-2xl border p-3 ${mode === "dark" ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"}`}>
                <div className="h-2 w-20 rounded-full bg-current opacity-10" />
                <div className="mt-3 h-9 rounded-xl" style={{ backgroundColor: `${primaryColor}18` }} />
              </div>
              <p className={`mt-3 text-[9px] ${mode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                Preview · idioma e métodos adaptam-se automaticamente ao cliente.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
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
      let latest: StorePaymentMethods = query.data;
      for (const method of targets) {
        latest = await vnextApi.paymentMethods.update(store.id, method.id, { enabled });
      }
      return { data: latest, enabled, changed: targets.length };
    },
    onSuccess: ({ data, enabled, changed }) => {
      qc.setQueryData(["store-payment-methods", store.id], data);
      toast.success(enabled ? `${changed} métodos enviados para ON` : `${changed} métodos enviados para OFF`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || "A operação em massa não foi concluída");
      qc.invalidateQueries({ queryKey: ["store-payment-methods", store.id] });
    },
  });

  return (
    <div className="space-y-5">
      <CheckoutBrandingPanel store={store} />

      {!isVNextStripe ? (
        <Card className="border-border/60 bg-background/30 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted/50 p-2 text-muted-foreground"><CreditCard className="h-4 w-4" /></div>
            <div>
              <p className="text-sm font-medium">Payment Methods</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Branding do Checkout está disponível. A gestão dinâmica dos métodos requer uma Store VNext ligada à Stripe.
              </p>
            </div>
          </div>
        </Card>
      ) : query.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}
          </div>
        </div>
      ) : query.isError || !query.data ? (
        <Card className="border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
              <div>
                <p className="text-sm font-medium text-amber-200">Payment Methods API indisponível</p>
                <p className="mt-1 text-xs text-muted-foreground">O restante da Store e o Checkout Branding continuam operacionais.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
        </Card>
      ) : (
        <PaymentMethodsControl
          store={store}
          data={query.data}
          embedded={embedded}
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          mutation={mutation}
          bulkMutation={bulkMutation}
          refetch={() => query.refetch()}
          isFetching={query.isFetching}
        />
      )}
    </div>
  );
}

function PaymentMethodsControl({
  store,
  data,
  embedded,
  search,
  setSearch,
  filter,
  setFilter,
  mutation,
  bulkMutation,
  refetch,
  isFetching,
}: {
  store: StoreControlItem;
  data: StorePaymentMethods;
  embedded: boolean;
  search: string;
  setSearch: (value: string) => void;
  filter: FilterState;
  setFilter: (value: FilterState) => void;
  mutation: any;
  bulkMutation: any;
  refetch: () => void;
  isFetching: boolean;
}) {
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
    <Card className="border-border/60 bg-background/30 p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h3 className={embedded ? "text-sm font-semibold" : "text-base font-semibold"}>Payment Methods</h3>
              <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-300">STRIPE</Badge>
              <Badge variant="outline" className={data.livemode ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : ""}>
                {data.livemode ? "LIVE" : "TEST"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ative ou desative métodos no provider. O card “Mais opções” do Checkout usa esta elegibilidade dinâmica.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => bulkMutation.mutate(true)} disabled={busy}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Ativar todos</Button>
            <Button size="sm" variant="outline" onClick={refetch} disabled={isFetching || busy}>
              {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
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
              <Card key={method.id} className="border-border/60 bg-card/40 p-4">
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
                    <p className="mt-0.5 text-[10px] text-muted-foreground">available={method.available ? "true" : "false"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Switch
                      checked={method.enabled}
                      disabled={!method.editable || pending || bulkMutation.isPending}
                      onCheckedChange={(checked) => mutation.mutate({ methodId: method.id, enabled: checked })}
                    />
                  </div>
                </div>
                {method.reason && <p className="mt-2 text-[10px] text-muted-foreground">{method.reason}</p>}
              </Card>
            );
          })}
        </div>

        {methods.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">Nenhum método corresponde ao filtro atual.</div>
        )}

        <p className="text-[10px] leading-5 text-muted-foreground">
          {store.storeCode} · Preferência no provider não garante elegibilidade em todos os países/moedas. O Stripe Payment Element filtra os métodos aplicáveis no momento do pagamento.
        </p>
      </div>
    </Card>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="border-border/60 bg-card/40 p-3">
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
    [stores]
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
        description="Checkout Branding + métodos de pagamento configurados no provider por Store."
        actions={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar Stores
          </Button>
        }
      />

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
