"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw, FileText, Building2,
  ArrowRightLeft,
} from "lucide-react";
import {
  useReleases, usePayouts, useFinancialMovements, useFinancialByStore, useStores,
  useFinancialSummary,
} from "@/hooks/queries";
import { PageHeader, ErrorState, EmptyState, fadeUp } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  ReleaseStatus, PayoutStatus,
  FinancialMovementType, StoreFinancials, FinancialFilters,
} from "@/types";

const TABS = ["resumo", "liberacoes", "saidas", "movimentos", "por-store"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  resumo: "Resumo",
  liberacoes: "Liberações",
  saidas: "Saídas e Payouts",
  movimentos: "Movimentos",
  "por-store": "Por Store",
};

const RELEASE_STATUS_MAP: Record<ReleaseStatus, { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
  expected: { label: "Esperado", cls: "border-blue-500/25 bg-blue-500/12 text-blue-400" },
  partially_released: { label: "Parcial", cls: "border-violet-500/25 bg-violet-500/12 text-violet-400" },
  released: { label: "Liberado", cls: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
  held: { label: "Retido", cls: "border-rose-500/25 bg-rose-500/12 text-rose-400" },
  reconciliation: { label: "Reconciliação", cls: "border-orange-500/25 bg-orange-500/12 text-orange-400" },
};

const PAYOUT_STATUS_MAP: Record<PayoutStatus, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "border-border bg-muted/40 text-muted-foreground" },
  scheduled: { label: "Agendado", cls: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
  paid: { label: "Pago", cls: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
  cancelled: { label: "Cancelado", cls: "border-rose-500/25 bg-rose-500/12 text-rose-400" },
};

const MOVEMENT_TYPE_MAP: Record<FinancialMovementType, { label: string; icon: typeof ArrowDownLeft; color: string }> = {
  sale: { label: "Venda", icon: ArrowDownLeft, color: "text-emerald-400" },
  fee: { label: "Taxa", icon: ArrowRightLeft, color: "text-rose-400" },
  refund: { label: "Reembolso", icon: ArrowUpRight, color: "text-amber-400" },
  chargeback: { label: "Chargeback", icon: ArrowUpRight, color: "text-rose-400" },
  release: { label: "Liberação", icon: ArrowDownLeft, color: "text-blue-400" },
  payout: { label: "Payout", icon: ArrowUpRight, color: "text-amber-400" },
  payout_cancel: { label: "Payout Cancel.", icon: ArrowRightLeft, color: "text-muted-foreground" },
  adjustment: { label: "Ajuste", icon: ArrowRightLeft, color: "text-violet-400" },
};

function dv(value: number | undefined | null, cur: string): string {
  return value === undefined || value === null ? "—" : formatCurrency(value, cur);
}

export default function FinancialFlow() {
  const [tab, setTab] = React.useState<Tab>("resumo");
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [storeFilter, setStoreFilter] = React.useState("");

  const { data: stores } = useStores();
  const storeList = stores ?? [];

  const baseFilters: FinancialFilters = React.useMemo(() => ({
    page,
    limit: 20,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(storeFilter ? { storeId: storeFilter } : {}),
  }), [page, statusFilter, storeFilter]);

  const releases = useReleases(tab === "liberacoes" ? baseFilters : undefined);
  const payouts = usePayouts(tab === "saidas" ? baseFilters : undefined);
  const movements = useFinancialMovements(tab === "movimentos" ? baseFilters : undefined);
  const byStore = useFinancialByStore(tab === "por-store" ? {} : undefined);

  const cur = "EUR";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fluxo Financeiro"
        description="Liberações, payouts, movimentos e visão por Store."
        actions={<Button variant="outline" size="sm" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Atualizar</Button>}
      />

      {/* Tabs */}
      <motion.div {...fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card/60 p-1 backdrop-blur-xl">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
        {(tab === "liberacoes" || tab === "saidas" || tab === "movimentos") && (
          <div className="flex items-center gap-2">
            <Select value={storeFilter} onValueChange={(v) => { setStoreFilter(v === "_all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Todas as Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas as Stores</SelectItem>
                {storeList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "_all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                {tab === "liberacoes" && (Object.keys(RELEASE_STATUS_MAP) as ReleaseStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{RELEASE_STATUS_MAP[s].label}</SelectItem>
                ))}
                {tab === "saidas" && (Object.keys(PAYOUT_STATUS_MAP) as PayoutStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{PAYOUT_STATUS_MAP[s].label}</SelectItem>
                ))}
                {tab === "movimentos" && (Object.keys(MOVEMENT_TYPE_MAP) as FinancialMovementType[]).map((s) => (
                  <SelectItem key={s} value={s}>{MOVEMENT_TYPE_MAP[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </motion.div>

      {/* Tab Content */}
      {tab === "resumo" && <ResumoTab />}
      {tab === "liberacoes" && (
        <DataTable
          loading={releases.isLoading}
          error={releases.isError}
          refetch={releases.refetch}
          data={releases.data?.data}
          total={releases.data?.meta?.total}
          page={page}
          onPage={setPage}
          emptyIcon={FileText}
          emptyTitle="Nenhuma liberação"
          emptyDesc="As liberações aparecerão aqui quando houver vendas confirmadas."
          columns={[
            { key: "storeName", label: "Store" },
            { key: "expectedDate", label: "Data prevista", render: (v: string) => formatDate(v) },
            { key: "grossAmount", label: "Bruto", render: (v: number) => dv(v, cur) },
            { key: "fees", label: "Taxas", render: (v: number) => dv(v, cur) },
            { key: "netAmount", label: "Líquido", render: (v: number) => dv(v, cur) },
            { key: "releasedAmount", label: "Liberado", render: (v: number) => dv(v, cur) },
            { key: "remainingAmount", label: "Restante", render: (v: number) => dv(v, cur) },
            { key: "status", label: "Status", render: (v: ReleaseStatus) => {
              const s = RELEASE_STATUS_MAP[v];
              return s ? <Badge variant="outline" className={s.cls}>{s.label}</Badge> : v;
            }},
          ]}
        />
      )}
      {tab === "saidas" && (
        <DataTable
          loading={payouts.isLoading}
          error={payouts.isError}
          refetch={payouts.refetch}
          data={payouts.data?.data}
          total={payouts.data?.meta?.total}
          page={page}
          onPage={setPage}
          emptyIcon={ArrowRightLeft}
          emptyTitle="Nenhum payout"
          emptyDesc="Os payouts aparecerão aqui quando forem criados."
          columns={[
            { key: "number", label: "N.º" },
            { key: "storeNames", label: "Stores", render: (v: string[] | undefined) => v?.join(", ") ?? "—" },
            { key: "amount", label: "Valor", render: (v: number) => dv(v, cur) },
            { key: "currency", label: "Moeda" },
            { key: "scheduledDate", label: "Prevista", render: (v: string) => formatDate(v) },
            { key: "paidDate", label: "Efetiva", render: (v: string | undefined) => v ? formatDate(v) : "—" },
            { key: "status", label: "Status", render: (v: PayoutStatus) => {
              const s = PAYOUT_STATUS_MAP[v];
              return s ? <Badge variant="outline" className={s.cls}>{s.label}</Badge> : v;
            }},
            { key: "reference", label: "Ref." },
          ]}
        />
      )}
      {tab === "movimentos" && (
        <DataTable
          loading={movements.isLoading}
          error={movements.isError}
          refetch={movements.refetch}
          data={movements.data?.data}
          total={movements.data?.meta?.total}
          page={page}
          onPage={setPage}
          emptyIcon={FileText}
          emptyTitle="Nenhum movimento"
          emptyDesc="Os movimentos financeiros aparecerão aqui."
          columns={[
            { key: "createdAt", label: "Data", render: (v: string) => formatDate(v) },
            { key: "type", label: "Tipo", render: (v: FinancialMovementType) => {
              const m = MOVEMENT_TYPE_MAP[v];
              if (!m) return v;
              const Icon = m.icon;
              return <span className={cn("inline-flex items-center gap-1", m.color)}><Icon className="h-3 w-3" />{m.label}</span>;
            }},
            { key: "description", label: "Descrição" },
            { key: "storeName", label: "Store", render: (v: string | undefined) => v ?? "—" },
            { key: "amount", label: "Valor", render: (v: number) => dv(v, cur) },
            { key: "balanceAfter", label: "Saldo após", render: (v: number | undefined) => dv(v, cur) },
          ]}
        />
      )}
      {tab === "por-store" && <ByStoreTab data={byStore.data} loading={byStore.isLoading} error={byStore.isError} refetch={byStore.refetch} />}
    </div>
  );
}

/* ---------- Resumo Tab ---------- */
function ResumoTab() {
  const { data: s, isLoading, isError, refetch } = useFinancialSummary();
  const cur = s?.currency ?? "EUR";
  const fmt = (n: number) => formatCurrency(n, cur);

  if (isError) return <ErrorState message="Erro ao carregar resumo financeiro." onRetry={() => refetch()} />;

  const rows = [
    { label: "Vendas brutas (mês)", value: s?.grossMonth },
    { label: "Taxas (mês)", value: s?.feesMonth },
    { label: "Vendas líquidas (mês)", value: s?.netMonth },
    { label: "Pendente de liberação", value: s?.pending },
    { label: "Wallet total", value: s?.walletTotal },
    { label: "Disponível", value: s?.available },
    { label: "Saídas previstas", value: s?.scheduledPayouts },
    { label: "Disponível projetado", value: s?.projectedAvailable },
    { label: "Total já pago", value: s?.totalPaid },
  ];

  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <h3 className="mb-4 text-sm font-semibold">Resumo Financeiro</h3>
      {isLoading || !s ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border/30">
                  <td className="py-3 text-muted-foreground">{r.label}</td>
                  <td className="py-3 text-right font-mono font-semibold tabular-nums">{dv(r.value, fmt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ---------- By Store Tab ---------- */
function ByStoreTab({ data, loading, error, refetch }: { data: StoreFinancials[] | undefined; loading: boolean; error: boolean; refetch: () => void }) {
  if (error) return <ErrorState message="Erro ao carregar dados por Store." onRetry={() => refetch()} />;

  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <h3 className="mb-4 text-sm font-semibold">Distribuição por Store</h3>
      {loading || !data ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhuma Store" description="Dados por Store aparecerão aqui." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Store</th>
                <th className="pb-2 text-right font-medium">Bruto</th>
                <th className="pb-2 text-right font-medium">Taxas</th>
                <th className="pb-2 text-right font-medium">Líquido</th>
                <th className="pb-2 text-right font-medium">Pendente</th>
                <th className="pb-2 text-right font-medium">Liberado</th>
                <th className="pb-2 text-right font-medium">Payouts Prev.</th>
                <th className="pb-2 text-right font-medium">Payouts Feitos</th>
                <th className="pb-2 text-right font-medium">Saldo Op.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((sf) => (
                <tr key={sf.storeId} className="border-b border-border/30 transition hover:bg-muted/30">
                  <td className="py-3">
                    <p className="font-medium">{sf.storeName}</p>
                    {sf.storeCode && <p className="text-[10px] text-muted-foreground">{sf.storeCode}</p>}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums">{dv(sf.gross, sf.currency)}</td>
                  <td className="py-3 text-right font-mono tabular-nums">{dv(sf.fees, sf.currency)}</td>
                  <td className="py-3 text-right font-mono tabular-nums">{dv(sf.net, sf.currency)}</td>
                  <td className="py-3 text-right font-mono tabular-nums">{dv(sf.pending, sf.currency)}</td>
                  <td className="py-3 text-right font-mono tabular-nums">{dv(sf.released, sf.currency)}</td>
                  <td className="py-3 text-right font-mono tabular-nums">{dv(sf.scheduledPayouts, sf.currency)}</td>
                  <td className="py-3 text-right font-mono tabular-nums">{dv(sf.paidPayouts, sf.currency)}</td>
                  <td className="py-3 text-right font-mono tabular-nums">{dv(sf.operationalBalance, sf.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ---------- Generic DataTable ---------- */
interface ColDef {
  key: string;
  label: string;
  render?: (value: unknown, row?: unknown) => React.ReactNode;
}

function DataTable({
  loading, error, refetch, data, total, page, onPage,
  emptyIcon: EmptyIcon, emptyTitle, emptyDesc, columns,
}: {
  loading: boolean;
  error: boolean;
  refetch: () => void;
  data: unknown[] | undefined;
  total?: number;
  page: number;
  onPage: (p: number) => void;
  emptyIcon: React.ComponentType;
  emptyTitle: string;
  emptyDesc?: string;
  columns: ColDef[];
}) {
  if (error) return <ErrorState message="Erro ao carregar dados." onRetry={() => refetch()} />;

  const totalPages = total ? Math.ceil(total / 20) : 1;
  const items = data ?? [];

  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  {columns.map((col) => (
                    <th key={col.key} className="pb-2 font-medium">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={i} className="border-b border-border/30 transition hover:bg-muted/30">
                    {columns.map((col) => (
                      <td key={col.key} className="py-2.5">
                        {col.render
                          ? col.render((row as Record<string, unknown>)[col.key], row)
                          : String((row as Record<string, unknown>)[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{total} registos · Página {page} de {totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Próximo</Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
