"use client";

import * as React from "react";
import {
  Search, Download, FileSpreadsheet, Receipt, ShieldAlert,
  Clock, User, Globe, Server, Hash, X, Filter, RefreshCw,
} from "lucide-react";
import { useTransactions } from "@/hooks/queries";
import { PageHeader, ErrorState } from "@/components/shared";
import { StatusBadge, MethodBadge, JsonViewer } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious,
  PaginationNext, PaginationLink, PaginationEllipsis,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency, formatDate, timeAgo, cn,
} from "@/lib/utils";
import { CURRENCIES, PAYMENT_METHODS, COUNTRY_LIST } from "@/config";
import type { DataTableFilters, Transaction } from "@/types";
import { toast } from "sonner";

const PAGE_SIZE = 10;
const GATEWAYS = ["xpayments", "stripe-rail", "adyen", "checkout", "wise"];
const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "succeeded", label: "Succeeded" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "disputed", label: "Disputed" },
  { value: "authorized", label: "Authorized" },
];

function RiskPill({ score }: { score: number }) {
  const tone =
    score < 30 ? "text-emerald-400 bg-emerald-500/12 border-emerald-500/25"
    : score < 60 ? "text-amber-400 bg-amber-500/12 border-amber-500/25"
    : "text-rose-400 bg-rose-500/12 border-rose-500/25";
  return (
    <span className={cn("inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md border px-1.5 font-mono text-xs font-medium tabular-nums", tone)}>
      {score}
    </span>
  );
}

function PageButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <PaginationItem>
      <PaginationLink isActive={active} onClick={(e) => { e.preventDefault(); onClick(); }} href="#" size="icon">
        {children}
      </PaginationLink>
    </PaginationItem>
  );
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("...");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("...");
  out.push(total);
  return out;
}

export default function PaymentsPage() {
  const [filters, setFilters] = React.useState<DataTableFilters>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const { data, isLoading, isFetching, isError, refetch } = useTransactions(filters);
  const [selected, setSelected] = React.useState<Transaction | null>(null);

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  function update<K extends keyof DataTableFilters>(key: K, value: DataTableFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }
  function gotoPage(p: number) {
    setFilters((f) => ({ ...f, page: Math.min(Math.max(1, p), totalPages) }));
  }

  const pageList = buildPageList(page, totalPages);

  if (isError) return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payments" description="Every payment across every gateway, currency and channel." />
      <ErrorState message="Failed to load transactions. The backend may be unreachable." onRetry={() => refetch()} />
    </div>
  );
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments"
        description="Every payment across every gateway, currency and channel."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast("Export started", { description: "CSV export queued — you'll get an email shortly." })}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast("Export started", { description: "Excel export queued — you'll get an email shortly." })}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel
            </Button>
          </>
        }
      />

      {/* Filters bar */}
      <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference, customer, email…"
              className="pl-9"
              value={filters.search ?? ""}
              onChange={(e) => update("search", e.target.value || undefined)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filters.status ?? "all"} onValueChange={(v) => update("status", v)}>
              <SelectTrigger size="sm" className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.currency ?? "all"} onValueChange={(v) => update("currency", v)}>
              <SelectTrigger size="sm" className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All currencies</SelectItem>
                {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.method ?? "all"} onValueChange={(v) => update("method", v)}>
              <SelectTrigger size="sm" className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {PAYMENT_METHODS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.country ?? "all"} onValueChange={(v) => update("country", v)}>
              <SelectTrigger size="sm" className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {COUNTRY_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.gateway ?? "all"} onValueChange={(v) => update("gateway", v)}>
              <SelectTrigger size="sm" className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All gateways</SelectItem>
                {GATEWAYS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            {(filters.search || filters.status || filters.currency || filters.method || filters.country || filters.gateway) && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
                onClick={() => setFilters({ page: 1, pageSize: PAGE_SIZE, sortBy: "createdAt", sortDir: "desc" })}>
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Transactions</h3>
            <Badge variant="outline" className="ml-1.5">{total} total</Badge>
            {isFetching && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <span className="text-xs text-muted-foreground">
            {total === 0 ? "No results" : `Showing ${showingFrom}–${showingTo} of ${total}`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead className="px-5 text-xs font-medium text-muted-foreground">Reference</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Customer</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Method</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">Amount</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Currency</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-center text-xs font-medium text-muted-foreground">Risk</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Gateway</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9} className="px-5"><Skeleton className="my-2 h-7" /></TableCell>
                    </TableRow>
                  ))
                : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      No transactions match your filters.
                    </TableCell>
                  </TableRow>
                ) : rows.map((t) => (
                  <TableRow
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer border-border/40 px-5 transition hover:bg-muted/30"
                  >
                    <TableCell className="px-5 py-3 font-mono text-xs text-primary">{t.reference}</TableCell>
                    <TableCell className="py-3">
                      <p className="text-sm font-medium">{t.customer}</p>
                      <p className="text-[11px] text-muted-foreground">{t.country}</p>
                    </TableCell>
                    <TableCell className="py-3"><MethodBadge method={t.method} /></TableCell>
                    <TableCell className="py-3 text-right font-mono text-sm tabular-nums">
                      {formatCurrency(t.amount, t.currency)}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{t.currency}</TableCell>
                    <TableCell className="py-3"><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="py-3 text-center"><RiskPill score={t.riskScore} /></TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{t.gateway}</TableCell>
                    <TableCell className="py-3 text-right text-xs text-muted-foreground">
                      {formatDate(t.createdAt, { withTime: true })}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 px-5 py-3 sm:flex-row">
            <span className="text-xs text-muted-foreground">
              Showing {showingFrom}–{showingTo} of {total}
            </span>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page > 1) gotoPage(page - 1); }}
                    className={cn(page === 1 && "pointer-events-none opacity-40")}
                  />
                </PaginationItem>
                {pageList.map((p, i) =>
                  p === "..." ? (
                    <PaginationItem key={`e${i}`}><PaginationEllipsis /></PaginationItem>
                  ) : (
                    <PageButton key={p} active={p === page} onClick={() => gotoPage(p)}>{p}</PageButton>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page < totalPages) gotoPage(page + 1); }}
                    className={cn(page === totalPages && "pointer-events-none opacity-40")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="border-b border-border/60 pr-10">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{selected.reference}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <SheetTitle className="text-lg">Payment details</SheetTitle>
                <SheetDescription>
                  Captured on {formatDate(selected.createdAt, { withTime: true })} · {selected.gateway}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-5 p-5">
                {/* Amount breakdown */}
                <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <p className="text-xs text-muted-foreground">Total captured</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                    {formatCurrency(selected.amount, selected.currency)}
                  </p>
                  <Separator className="my-3 bg-border/40" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Processing fee</span>
                    <span className="font-mono text-foreground/80">−{formatCurrency(selected.fee, selected.currency)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Net settlement</span>
                    <span className="font-mono font-medium text-emerald-400">
                      {formatCurrency(selected.amount - selected.fee, selected.currency)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>EUR equivalent</span>
                    <span className="font-mono text-foreground/80">{formatCurrency(selected.amountEur, "EUR")}</span>
                  </div>
                </div>

                {/* Customer info */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <User className="h-3.5 w-3.5" /> Customer
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{selected.customer}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-mono text-xs">{selected.customerEmail}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                      <span className="text-muted-foreground">Country</span>
                      <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-muted-foreground" />{selected.country}</span>
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Method</p>
                    <p className="mt-1 text-sm font-medium"><MethodBadge method={selected.method} /></p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><Server className="h-3 w-3" /> Gateway</p>
                    <p className="mt-1 text-sm font-medium">{selected.gateway}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><ShieldAlert className="h-3 w-3" /> Risk score</p>
                    <p className="mt-1 text-sm font-medium"><RiskPill score={selected.riskScore} /></p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Created</p>
                    <p className="mt-1 text-sm font-medium">{timeAgo(selected.createdAt)}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Event timeline
                  </h4>
                  <ol className="relative flex flex-col gap-3 border-l border-border/60 pl-4">
                    {(selected.events ?? []).map((ev) => (
                      <li key={ev.id} className="relative">
                        <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{ev.label}</p>
                            {ev.detail && <p className="text-xs text-muted-foreground">{ev.detail}</p>}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{formatDate(ev.createdAt, { withTime: true })}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Metadata */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" /> Metadata
                  </h4>
                  <JsonViewer data={selected.metadata ?? {}} className="text-[11px]" />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
