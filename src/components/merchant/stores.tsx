"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Loader2, Palette, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import StoresVNextPage from "./stores-vnext";
import { useStoreControl } from "@/hooks/vnext";
import { vnextApi } from "@/lib/api/vnext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function StoresPage() {
  return (
    <div className="space-y-8">
      <CheckoutBrandingManager />
      <StoresVNextPage />
    </div>
  );
}

function CheckoutBrandingManager() {
  const qc = useQueryClient();
  const { data: stores = [], isLoading } = useStoreControl();
  const orchestratedStores = React.useMemo(
    () => stores.filter((store) => store.integration.processingMode === "ORCHESTRATED"),
    [stores]
  );
  const [storeId, setStoreId] = React.useState("");

  React.useEffect(() => {
    if (!storeId && orchestratedStores.length > 0) setStoreId(orchestratedStores[0].id);
  }, [orchestratedStores, storeId]);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["merchant-store-checkout-branding", storeId],
    queryFn: () => vnextApi.storeControl.merchantDetail(storeId),
    enabled: Boolean(storeId),
  });

  const [displayName, setDisplayName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [primaryColor, setPrimaryColor] = React.useState("#111111");
  const [mode, setMode] = React.useState<"light" | "dark" | "system">("light");
  const [autoReturnSeconds, setAutoReturnSeconds] = React.useState(3);

  React.useEffect(() => {
    if (!detail) return;
    const branding = detail.checkoutBranding;
    setDisplayName(branding.checkoutDisplayName || detail.name || "");
    setLogoUrl(branding.logoUrl || detail.logoUrl || "");
    setPrimaryColor(branding.primaryColor || "#111111");
    setMode(branding.mode || "light");
    setAutoReturnSeconds(
      Number.isFinite(Number(branding.autoReturnSeconds))
        ? Math.min(10, Math.max(0, Number(branding.autoReturnSeconds)))
        : 3
    );
  }, [detail]);

  const saveMutation = useMutation({
    mutationFn: () =>
      vnextApi.storeControl.updateCheckoutBranding(storeId, {
        checkoutDisplayName: displayName.trim(),
        primaryColor,
        mode,
        logoUrl: logoUrl.trim() || null,
        autoReturnSeconds,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchant-store-checkout-branding", storeId] });
      qc.invalidateQueries({ queryKey: ["store-control"] });
      toast.success("Branding do Checkout atualizado");
    },
    onError: (error: { message?: string }) =>
      toast.error(error?.message || "Não foi possível atualizar o Checkout"),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (orchestratedStores.length === 0) return null;

  const selectedStore = orchestratedStores.find((store) => store.id === storeId);
  const colorValid = /^#[0-9a-fA-F]{6}$/.test(primaryColor);
  const logoValid = !logoUrl.trim() || /^https:\/\//i.test(logoUrl.trim());
  const valid = displayName.trim().length >= 2 && colorValid && logoValid;

  return (
    <Card className="relative overflow-hidden border-violet-500/20 bg-card/70 p-5 shadow-[0_26px_80px_-55px_rgba(99,102,241,.75)] backdrop-blur-xl sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[.18em]">Checkout Experience</span>
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">Identidade pública do Checkout</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Personalize o nome apresentado ao comprador, logo, cor e aparência. O nome interno da Store continua reservado à operação XPayments.
            </p>
          </div>

          <div className="min-w-[240px]">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Store</Label>
            <select
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary/50"
            >
              {orchestratedStores.map((store) => (
                <option key={store.id} value={store.id}>{store.name} · {store.storeCode}</option>
              ))}
            </select>
          </div>
        </div>

        {detailLoading || !detail ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome público" hint="Pode ser diferente do nome interno da Store.">
                <Input
                  value={displayName}
                  maxLength={80}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Marca apresentada ao comprador"
                  className="rounded-xl"
                />
              </Field>

              <Field label="Logo HTTPS" hint="URL pública segura. Deixe vazio para usar monograma.">
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={logoUrl}
                    onChange={(event) => setLogoUrl(event.target.value)}
                    placeholder="https://.../logo.svg"
                    className="rounded-xl pl-9"
                  />
                </div>
                {!logoValid && <p className="mt-1 text-[10px] text-rose-400">Utilize uma URL HTTPS.</p>}
              </Field>

              <Field label="Cor principal" hint="Usada em botões, estados e detalhes do Checkout.">
                <div className="flex gap-2">
                  <input
                    aria-label="Cor principal"
                    type="color"
                    value={colorValid ? primaryColor : "#111111"}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-xl border border-border/60 bg-background p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="rounded-xl font-mono"
                    maxLength={7}
                  />
                </div>
                {!colorValid && <p className="mt-1 text-[10px] text-rose-400">Formato esperado: #RRGGBB</p>}
              </Field>

              <Field label="Aparência" hint="Pode seguir o sistema do comprador.">
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as "light" | "dark" | "system")}
                  className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary/50"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </Field>

              <Field label="Retorno automático" hint="0 desativa. Até 10 segundos após confirmação.">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={autoReturnSeconds}
                    onChange={(event) => setAutoReturnSeconds(Math.min(10, Math.max(0, Number(event.target.value) || 0)))}
                    className="w-24 rounded-xl"
                  />
                  <span className="text-xs text-muted-foreground">segundos</span>
                </div>
              </Field>
            </div>

            <div className="rounded-[24px] border border-border/55 bg-background/45 p-4">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
                <Palette className="h-3.5 w-3.5" /> Preview
              </p>
              <div className="mt-4 overflow-hidden rounded-[22px] border border-border/50 bg-card shadow-xl">
                <div className="flex items-center gap-3 border-b border-border/40 p-4">
                  {logoUrl && logoValid ? (
                    <img src={logoUrl} alt="Preview" className="h-9 w-14 object-contain" />
                  ) : (
                    <div className="grid h-9 w-9 place-items-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: colorValid ? primaryColor : "#111111" }}>
                      {(displayName || selectedStore?.name || "XP").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{displayName || selectedStore?.name}</p>
                    <p className="text-[9px] text-muted-foreground">Pagamento seguro</p>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <div className="h-14 rounded-2xl border border-border/45 bg-muted/25" />
                  <div className="h-10 rounded-2xl" style={{ backgroundColor: colorValid ? primaryColor : "#111111" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button
            className="gap-2 rounded-xl"
            disabled={!valid || saveMutation.isPending || detailLoading}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar identidade do Checkout
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      <p className="text-[9.5px] leading-4 text-muted-foreground/70">{hint}</p>
    </div>
  );
}
