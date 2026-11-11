"use client";

import * as React from "react";
import { Activity, ArrowDownUp, CircleAlert, Eye, RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ObserverSource = {
  id: string;
  sourceCode: string;
  storeId: string;
  accountId: string | null;
  provider: string;
  mode: string;
  status: string;
  store: { name: string; currency: string };
};
type SummaryRow = {
  sourceCode: string;
  currency: string;
  status: string;
  count: number;
  amountMinor: string;
  amount: string;
  receivedMinor: string;
  received: string;
};
type ObserverEvent = {
  id: string;
  sourceCode: string;
  eventId: string;
  eventType: string;
  objectId: string | null;
  objectType: string | null;
  status: string | null;
  currency: string | null;
  amountMinor: string | null;
  amount: string | null;
  stripeCreatedAt: string;
  receivedAt: string;
};
type Envelope<T> = { success: boolean; data: T };

function formatMinor(minor: bigint, currency: "GBP" | "EUR"): string {
  const units = Number(minor) / 100;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency", currency, minimumFractionDigits: 2
  }).format(units);
}

const sourceLabel = (source: ObserverSource) =>
  source.store?.name || (source.sourceCode === "humanimpact" ? "HumanImpact" : "VivaChurch");

export default function ObserverDashboard() {
  const [sources, setSources] = React.useState<ObserverSource[]>([]);
  const [sourceCode, setSourceCode] = React.useState("");
  const [currency, setCurrency] = React.useState<"GBP" | "EUR">("GBP");
  const [summary, setSummary] = React.useState<SummaryRow[]>([]);
  const [events, setEvents] = React.useState<ObserverEvent[]>([]);
  const [sourcesLoading, setSourcesLoading] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [revision, refresh] = React.useReducer((value: number) => value + 1, 0);

  React.useEffect(() => {
    let cancelled = false;
    setSourcesLoading(true);
    api.get<Envelope<ObserverSource[]>>("observer/sources")
      .then(({ data }) => {
        if (cancelled) return;
        const list = data.data ?? [];
        setSources(list);
        setSourceCode(current => list.some(source => source.sourceCode === current)
          ? current : list[0]?.sourceCode ?? "");
        setError("");
      })
      .catch(() => { if (!cancelled) setError("Não foi possível obter as fontes Observer. Verifique a API e a sessão."); })
      .finally(() => { if (!cancelled) setSourcesLoading(false); });
    return () => { cancelled = true; };
  }, [revision]);

  React.useEffect(() => {
    if (!sourceCode) {
      setSummary([]);
      setEvents([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      api.get<Envelope<SummaryRow[]>>("observer/summary", { params: { sourceCode, currency } }),
      api.get<Envelope<ObserverEvent[]>>("observer/events", { params: { sourceCode, currency, limit: 50 } })
    ]).then(([s, e]) => {
      if (cancelled) return;
      setSummary(s.data.data ?? []);
      setEvents(e.data.data ?? []);
    }).catch(() => {
      if (!cancelled) setError("Falha a consultar eventos Observer. Confirme que a migração e a API estão ativas.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sourceCode, currency, revision]);

  const completed = summary.filter(row => row.status === "succeeded");
  const amount = completed.reduce((sum, row) => sum + BigInt(row.receivedMinor || "0"), 0n);
  const successfulCount = completed.reduce((sum, row) => sum + row.count, 0);
  const otherCount = summary.filter(row => row.status !== "succeeded")
    .reduce((sum, row) => sum + row.count, 0);
  const selectedSource = sources.find(source => source.sourceCode === sourceCode);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary">
            <Eye className="h-4 w-4" /> Stripe / Read-only observability
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Fluxos Observer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhamento das contas Stripe do cliente, sem capturas, transferências ou movimentos na wallet XPAYMENTS.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => refresh()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/50 p-3">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span className="text-xs text-muted-foreground">Observer — valores informativos, não são saldos disponíveis nem payouts.</span>
      </div>

      {error && (
        <Card className="flex items-center gap-3 border-amber-500/30 bg-amber-500/5 p-4">
          <CircleAlert className="h-5 w-5 shrink-0 text-amber-500" />
          <span className="text-sm">{error}</span>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {sources.map(source => (
            <Button
              key={source.id}
              type="button"
              variant={sourceCode === source.sourceCode ? "default" : "outline"}
              size="sm"
              onClick={() => setSourceCode(source.sourceCode)}
            >
              {sourceLabel(source)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {(["GBP", "EUR"] as const).map(code => (
            <Button
              key={code}
              type="button"
              variant={currency === code ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrency(code)}
            >{code === "GBP" ? "£ GBP" : "€ EUR"}</Button>
          ))}
        </div>
      </div>

      {!sourcesLoading && sources.length === 0 && !error && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Sem fontes Stripe Observer atribuídas a esta conta.
        </Card>
      )}

      {selectedSource && (
        <div className="text-xs text-muted-foreground">
          Store: <span className="font-medium text-foreground">{sourceLabel(selectedSource)}</span>
          {" · "}Conta: {selectedSource.accountId || "Aguardando associação"}
          {" · "}Estado: {selectedSource.status}
          {" · "}Principal: GBP | Secundária: EUR
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-5">
          <p className="mb-2 text-xs text-muted-foreground">Volume recebido em PaymentIntents concluídos</p>
          <p className="text-2xl font-semibold tabular-nums">{loading ? "…" : formatMinor(amount, currency)}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Bruto observado, não liquidado ou reconciliado</p>
        </Card>
        <Card className="border-border/60 bg-card/60 p-5">
          <p className="mb-2 text-xs text-muted-foreground">Pagamentos concluídos</p>
          <p className="text-2xl font-semibold tabular-nums">{loading ? "…" : successfulCount}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">PaymentIntents com estado succeeded</p>
        </Card>
        <Card className="border-border/60 bg-card/60 p-5">
          <p className="mb-2 text-xs text-muted-foreground">Outros estados de pagamento</p>
          <div className="flex items-center gap-2"><ArrowDownUp className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold tabular-nums">{loading ? "…" : otherCount}</p>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Pendentes, falhados ou cancelados</p>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/60 bg-card/60">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 p-5">
          <div>
            <h2 className="text-sm font-semibold">Eventos Stripe</h2>
            <p className="text-xs text-muted-foreground">Últimos 50 eventos assinados recebidos, filtrados por store e moeda</p>
          </div>
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="border-b border-border/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Data UTC</th>
                <th className="px-5 py-3 font-medium">Evento</th>
                <th className="px-5 py-3 font-medium">Objeto Stripe</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id} className="border-b border-border/30 last:border-0">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{new Date(event.stripeCreatedAt).toLocaleString("pt-PT", { timeZone: "UTC" })}</td>
                  <td className="px-5 py-3 font-medium">{event.eventType}</td>
                  <td className="max-w-[170px] truncate px-5 py-3 font-mono text-[11px] text-muted-foreground" title={event.objectId ?? ""}>{event.objectId ?? "—"}</td>
                  <td className="px-5 py-3">{event.status ?? "—"}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">{event.amount ?? "—"} {event.currency ?? ""}</td>
                </tr>
              ))}
              {!loading && events.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Ainda não existem eventos para esta store e moeda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">
        Valores baseados em notificações recebidas. Reembolsos, disputas e payouts aparecem no histórico mas não são compensados neste resumo.
        Stripe continua a ser a fonte oficial para saldos, taxas e liquidações.
      </p>
    </div>
  );
}
