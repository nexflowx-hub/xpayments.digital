"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, CreditCard, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { elementsApi } from "@/lib/api/elements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type StoreOption = { id: string; name: string; storeCode?: string };

export function StripeElementsConfigCard({ stores }: { stores: StoreOption[] }) {
  const [storeId, setStoreId] = React.useState(stores[0]?.id ?? "");
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!storeId && stores[0]?.id) setStoreId(stores[0].id);
  }, [storeId, stores]);

  const query = useQuery({
    queryKey: ["stripe-elements-config", storeId],
    queryFn: () => elementsApi.config(storeId),
    enabled: Boolean(storeId),
    staleTime: 30_000,
  });

  const config = query.data;
  const key = config?.publishableKey ?? "";
  const masked = key ? `${key.slice(0, 12)}••••${key.slice(-6)}` : "—";

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success("Publishable key copiada");
  };

  return (
    <Card className="border-sky-500/20 bg-sky-500/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-300"><CreditCard className="h-4 w-4" /></div>
            <div>
              <h3 className="text-sm font-semibold">Stripe Elements compatibility</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Opcional para Merchants que mantêm Stripe.js / Payment Element no próprio frontend.</p>
            </div>
            <Badge variant="outline" className="border-sky-500/25 bg-sky-500/10 text-[10px] text-sky-300">ADVANCED</Badge>
          </div>
          <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-3 text-xs leading-5 text-muted-foreground">
            <p><strong className="text-foreground">xp_test_ / xp_live_</strong> é segredo server-side e nunca deve ir para o browser.</p>
            <p className="mt-1"><strong className="text-foreground">pk_test_ / pk_live_</strong> é a publishable key usada por Stripe.js e pode ser exposta no frontend. Se preferir não expor o provider, use Checkout XPay Embedded.</p>
          </div>
        </div>

        <div className="w-full lg:w-[360px]">
          <Select value={storeId} onValueChange={(value) => { setStoreId(value); setVisible(false); }}>
            <SelectTrigger><SelectValue placeholder="Selecionar Store" /></SelectTrigger>
            <SelectContent>{stores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name} ({store.storeCode ?? store.id.slice(0, 8)})</SelectItem>)}</SelectContent>
          </Select>

          <div className="mt-3 rounded-xl border border-border/60 bg-card/60 p-3">
            {query.isLoading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> A carregar configuração…</div>
            ) : query.isError ? (
              <p className="text-xs text-rose-400">Não foi possível carregar a configuração Elements.</p>
            ) : config?.available && key ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Publishable key · {config.environment}</span>
                  <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-[9px] text-emerald-300"><ShieldCheck className="mr-1 h-3 w-3" /> Browser-safe</Badge>
                </div>
                <code className="mt-2 block break-all rounded-lg bg-black/20 px-2.5 py-2 font-mono text-xs">{visible ? key : masked}</code>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{visible ? "Hide" : "View"}</Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => copy(key)}><Copy className="h-3.5 w-3.5" /> Copy</Button>
                </div>
              </>
            ) : (
              <div className="text-xs leading-5 text-muted-foreground">
                <p className="font-medium text-foreground">Elements não disponível nesta Store.</p>
                <p className="mt-1">{config?.reason === "ACTIVE_ROUTE_NOT_STRIPE" ? "A rota ativa não é Stripe. Use Checkout XPay Embedded." : config?.reason === "PUBLISHABLE_KEY_NOT_CONFIGURED" ? "O Gateway Stripe não possui publishable key configurada." : "A Store ainda não possui uma rota Stripe ativa."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
