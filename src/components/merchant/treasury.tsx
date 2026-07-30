"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Wallet as WalletIcon, TrendingUp, ArrowDownLeft, ArrowRightLeft,
  CalendarClock, Send, Building2, RefreshCw, AlertTriangle,
} from "lucide-react";
import {
  useFinanceOverview, useFinanceReleases, usePayoutStatements, useFinanceStores,
} from "@/hooks/queries";
import { PageHeader, fadeUp } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDateCivil, formatNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n";

function dv(value: number | undefined | null, cur: string): string {
  return value === undefined || value === null ? "—" : formatCurrency(value, cur);
}

/** Inline error banner for a single section */
function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
      <p className="flex-1 text-xs text-rose-400">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" className="h-7 text-xs text-rose-400 hover:text-rose-300" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export default function TreasuryPage() {
  const t = useT();
  const cur = "EUR";

  const { data: overview, isLoading: oLoading, isError: oError, refetch: oRefetch } = useFinanceOverview(cur);
  const { data: releases, isLoading: rLoading, isError: rError, refetch: rRefetch } = useFinanceReleases(cur);
  const { data: payouts, isLoading: pLoading, isError: pError, refetch: pRefetch } = usePayoutStatements(cur);
  const { data: finStores, isLoading: sLoading, isError: sError, refetch: sRefetch } = useFinanceStores(cur);

  const refreshAll = () => { oRefetch(); rRefetch(); pRefetch(); sRefetch(); };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.treasury")}
        description="Liquidez, liberações, payouts e visão por Store."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={refreshAll}>
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        }
      />

      {/* ---- Section 1: Wallet + Sales summary (from Overview) ---- */}
      {oError ? (
        <SectionError message="Não foi possível carregar o resumo financeiro." onRetry={() => oRefetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {oLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <>
              <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Saldo total</p>
                  <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                    <WalletIcon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{dv(overview?.wallet?.balance, cur)}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{dv(overview?.wallet?.pending, cur)} pendente</p>
              </Card>
              <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Disponível</p>
                  <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{dv(overview?.wallet?.available, cur)}</p>
              </Card>
              <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Vendas brutas acumuladas</p>
                  <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{dv(overview?.sales?.allTime?.gross, cur)}</p>
              </Card>
              <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Taxas registradas</p>
                  <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-400">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{dv(overview?.sales?.allTime?.fees, cur)}</p>
              </Card>
              <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Saldo operacional atual</p>
                  <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{dv(overview?.sales?.allTime?.net, cur)}</p>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ---- Section 2: Payouts summary ---- */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Resumo de payouts</h3>
        </div>
        {pLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : pError ? (
          <SectionError message="Erro ao carregar payouts." onRetry={() => pRefetch()} />
        ) : payouts?.summary ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total pago</p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums">{dv(payouts.summary.paidAmount, cur)}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{payouts.summary.paidCount} pagamento{payouts.summary.paidCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Agendado</p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums">{dv(payouts.summary.scheduledAmount, cur)}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{payouts.summary.scheduledCount} agendado{payouts.summary.scheduledCount !== 1 ? "s" : ""}</p>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">Sem dados de payout.</p>
        )}
      </Card>

      {/* ---- Section 3: Releases calendar (from Releases) ---- */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Calendário de liberações</h3>
            <p className="text-xs text-muted-foreground">Próximas liberações previstas pelo backend.</p>
          </div>
          {releases?.summary && (
            <Badge variant="outline" className="border-border/60 bg-muted/30">
              Total líquido: {dv(releases.summary.totalNet, cur)}
            </Badge>
          )}
        </div>
        {rLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rError ? (
          <SectionError message="Erro ao carregar liberações." onRetry={() => rRefetch()} />
        ) : releases?.items && releases.items.length > 0 ? (
          <div className="flex flex-col gap-2">
            {releases.items.map((r, i) => {
              const overdue = r.status === "overdue";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-4 py-3 transition hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "rounded-lg p-1.5",
                      overdue ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                    )}>
                      <CalendarClock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold tabular-nums">{dv(r.amount, cur)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.movementCount} movimento{r.movementCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        overdue
                          ? "border-rose-500/25 bg-rose-500/12 text-rose-400"
                          : "border-amber-500/25 bg-amber-500/12 text-amber-400"
                      )}
                    >
                      {overdue ? "Atrasado" : "Esperado"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDateCivil(r.date)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">Nenhuma liberação encontrada.</p>
        )}
      </Card>

      {/* ---- Section 4: Store overview (from Stores) ---- */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Visão por Store</h3>
            <p className="text-xs text-muted-foreground">Dados financeiros por unidade de venda.</p>
          </div>
          <Badge variant="outline" className="border-border/60 bg-muted/30">
            {finStores?.stores?.length ?? 0} stores
          </Badge>
        </div>
        {sLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : sError ? (
          <SectionError message="Erro ao carregar dados por Store." onRetry={() => sRefetch()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Store</th>
                  <th className="pb-2 text-right font-medium">Vendas brutas</th>
                  <th className="pb-2 text-right font-medium">Taxas</th>
                  <th className="pb-2 text-right font-medium">Vendas líquidas</th>
                  <th className="pb-2 text-right font-medium">Pendente</th>
                  <th className="pb-2 text-right font-medium">Saldo operacional</th>
                </tr>
              </thead>
              <tbody>
                {finStores?.stores && finStores.stores.length > 0 ? (
                  finStores.stores.map((s) => (
                    <tr key={s.storeId} className="border-b border-border/30 transition hover:bg-muted/30">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                            {s.storeCode.slice(-2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{s.storeName}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{s.storeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums">{dv(s.gross, cur)}</td>
                      <td className="py-3 text-right font-mono tabular-nums">{dv(s.fees, cur)}</td>
                      <td className="py-3 text-right font-mono tabular-nums">{dv(s.net, cur)}</td>
                      <td className="py-3 text-right font-mono tabular-nums">{dv(s.pending, cur)}</td>
                      <td className="py-3 text-right font-mono tabular-nums">{dv(s.operationalBalance, cur)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">Nenhuma store encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---- Section 5: Recent payouts (from Payout Statements) ---- */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Payouts recentes</h3>
          <p className="text-xs text-muted-foreground">Últimos extratos de pagamento processados e agendados.</p>
        </div>
        {pLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : pError ? (
          <SectionError message="Erro ao carregar payouts recentes." onRetry={() => pRefetch()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Extrato</th>
                  <th className="pb-2 font-medium">Stores</th>
                  <th className="pb-2 text-right font-medium">Valor</th>
                  <th className="pb-2 font-medium">Agendado</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts?.items && payouts.items.length > 0 ? (
                  payouts.items.slice(0, 10).map((p) => {
                    const statusCls: Record<string, string> = {
                      paid: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400",
                      scheduled: "border-amber-500/25 bg-amber-500/12 text-amber-400",
                      draft: "border-border bg-muted/40 text-muted-foreground",
                      cancelled: "border-rose-500/25 bg-rose-500/12 text-rose-400",
                    };
                    const statusLabel: Record<string, string> = {
                      paid: "Pago",
                      scheduled: "Agendado",
                      draft: "Rascunho",
                      cancelled: "Cancelado",
                    };
                    return (
                      <tr key={p.id} className="border-b border-border/30 transition hover:bg-muted/30">
                        <td className="py-3 font-mono text-xs text-primary">{p.statementCode}</td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {p.allocations?.map((a) => a.storeName).join(", ") || "—"}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">{dv(p.amount, cur)}</td>
                        <td className="py-3 text-xs text-muted-foreground">{formatDateCivil(p.scheduledFor)}</td>
                        <td className="py-3">
                          <Badge variant="outline" className={cn("text-[10px]", statusCls[p.status] ?? statusCls.draft)}>
                            {statusLabel[p.status] ?? p.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">Nenhum payout encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Generated at footer */}
      {overview?.generatedAt && (
        <p className="text-center text-[10px] text-muted-foreground">
          Dados gerados em {formatDateCivil(overview.generatedAt)} · Fuso: {overview.timezone || "UTC"}
        </p>
      )}
    </div>
  );
}
