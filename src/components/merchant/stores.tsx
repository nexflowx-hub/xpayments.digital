"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Store as StoreIcon,
  Globe,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { useStores, useFinanceStores } from "@/hooks/queries";
import { PageHeader, ErrorState } from "@/components/shared";
import { StatusBadge } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { Store, FinanceStore } from "@/types";

const SUPPORT_WHATSAPP = "https://wa.me/5562994091930";
const HIDDEN_STORES = ["XPAYMENTS-TEST"];

function isHidden(name: string | undefined): boolean {
  if (!name) return false;
  const upper = name.toUpperCase();
  return HIDDEN_STORES.some((h) => upper.includes(h));
}

function dv(value: number | undefined | null, cur: string): string {
  return value === undefined || value === null ? "—" : formatCurrency(value, cur);
}

interface StoreWithFinance {
  store: Store;
  finance: FinanceStore | undefined;
}

export default function StoresPage() {
  const t = useT();
  const { data: storesData, isLoading: sLoading, isError: sError, refetch: sRefetch } = useStores();
  const { data: finStoresData } = useFinanceStores("EUR");

  const stores = React.useMemo(() => {
    const raw = storesData ?? [];
    return raw.filter((s) => !isHidden(s.name));
  }, [storesData]);

  const financeMap = React.useMemo(() => {
    const map = new Map<string, FinanceStore>();
    finStoresData?.stores?.forEach((fs) => map.set(fs.storeId, fs));
    return map;
  }, [finStoresData]);

  const enriched: StoreWithFinance[] = React.useMemo(() => {
    return stores.map((s) => ({
      store: s,
      finance: s.id ? financeMap.get(s.id) : undefined,
    }));
  }, [stores, financeMap]);

  const totalStores = enriched.length;
  const active = enriched.filter((e) => e.store.status === "active").length;
  const totalGross = enriched.reduce((sum, e) => sum + (e.finance?.gross ?? 0), 0);
  const totalNet = enriched.reduce((sum, e) => sum + (e.finance?.net ?? 0), 0);

  if (sError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("nav.stores")} description="Gerencie suas Stores e acompanhe dados financeiros por unidade." />
        <ErrorState message="Não foi possível carregar as Stores. O backend pode estar indisponível." onRetry={() => sRefetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.stores")}
        description="Gerencie suas Stores e acompanhe dados financeiros por unidade."
        actions={
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={SUPPORT_WHATSAPP} target="_blank" rel="noreferrer">
              <MessageCircle className="h-3.5 w-3.5" /> Solicitar nova Store
            </a>
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total de Stores</p>
                <div className="rounded-lg bg-primary/10 p-1.5 text-primary"><StoreIcon className="h-4 w-4" /></div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{formatNumber(totalStores)}</p>
            </Card>
            <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400"><CheckCircle2 className="h-4 w-4" /></div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{formatNumber(active)}</p>
            </Card>
            <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Vendas brutas totais</p>
                <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400"><StoreIcon className="h-4 w-4" /></div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{dv(totalGross, "EUR")}</p>
            </Card>
            <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Vendas líquidas totais</p>
                <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400"><CheckCircle2 className="h-4 w-4" /></div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{dv(totalNet, "EUR")}</p>
            </Card>
          </>
        )}
      </div>

      {/* Store cards grid */}
      {sLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-14 text-center">
          <div className="rounded-xl bg-muted/40 p-3">
            <StoreIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Nenhuma Store encontrada</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Contacte o suporte para solicitar a criação de uma nova Store.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" asChild>
            <a href={SUPPORT_WHATSAPP} target="_blank" rel="noreferrer">
              <MessageCircle className="h-3.5 w-3.5" /> Solicitar via WhatsApp
            </a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enriched.map((e, i) => {
            const { store: s, finance: f } = e;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -3 }}
              >
                <Card className="group relative overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-80" />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                        <StoreIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                        {s.domain && (
                          <a
                            href={`https://${s.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition hover:text-primary"
                          >
                            <Globe className="h-3 w-3" /> {s.domain}
                            <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                          </a>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  {f ? (
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Vendas brutas</p>
                        <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{dv(f.gross, "EUR")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Taxas</p>
                        <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{dv(f.fees, "EUR")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Vendas líquidas</p>
                        <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{dv(f.net, "EUR")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pendente</p>
                        <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{dv(f.pending, "EUR")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Produtos</p>
                        <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{formatNumber(s.products)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Receita</p>
                        <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{formatCurrency(s.revenue, s.currency)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Criada em</p>
                        <p className="mt-1 text-xs font-medium">{formatDate(s.createdAt)}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.currency}
                      </span>
                      {s.storeCode && (
                        <Badge variant="outline" className="border-border/60 bg-muted/30 text-[10px]">
                          {s.storeCode}
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" variant="outline" disabled className="gap-1.5 opacity-50">
                      Gerenciar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
