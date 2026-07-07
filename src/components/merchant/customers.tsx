"use client";

import * as React from "react";
import {
  Users, Crown, ShoppingBag, Wallet as WalletIcon, Search, Mail,
  MapPin, TrendingUp, Star, X, Activity,
} from "lucide-react";
import { useCustomers, useTransactions } from "@/hooks/queries";
import { PageHeader, StatCard } from "@/components/shared";
import { StatusBadge, MethodBadge, Sparkline } from "@/components/shared/badges";
import { DonutChart, BarTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency, formatNumber, timeAgo, initials, cn,
} from "@/lib/utils";
import type { Customer } from "@/types";

const segmentConfig: Record<Customer["segment"], { label: string; className: string }> = {
  vip:     { label: "VIP",     className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
  regular: { label: "Regular", className: "border-sky-500/25 bg-sky-500/12 text-sky-400" },
  new:     { label: "New",     className: "border-violet-500/25 bg-violet-500/12 text-violet-400" },
  at_risk: { label: "At risk", className: "border-rose-500/25 bg-rose-500/12 text-rose-400" },
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function ltvSpark(seed: number): number[] {
  const arr: number[] = [];
  let v = 30;
  for (let i = 0; i < 20; i++) {
    const noise = Math.sin(seed + i * 1.3) * 8;
    v += 1.4 + noise * 0.6;
    arr.push(Math.max(1, v));
  }
  return arr;
}

export default function CustomersPage() {
  const { data: customersRes, isLoading } = useCustomers();
  const { data: txPage } = useTransactions({ page: 1, pageSize: 200, sortBy: "createdAt", sortDir: "desc" });

  const customers: Customer[] = customersRes ?? [];
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Customer | null>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const stats = React.useMemo(() => {
    const totalLtv = customers.reduce((s, c) => s + c.ltv, 0);
    const totalOrders = customers.reduce((s, c) => s + c.orders, 0);
    const avgOrder = totalOrders ? totalLtv / totalOrders : 0;
    const vip = customers.filter((c) => c.segment === "vip").length;
    return { total: customers.length, totalLtv, avgOrder, vip };
  }, [customers]);

  const segmentData = React.useMemo(() => {
    const groups: Record<Customer["segment"], number> = { vip: 0, regular: 0, new: 0, at_risk: 0 };
    customers.forEach((c) => { groups[c.segment]++; });
    return [
      { name: "VIP", value: groups.vip },
      { name: "Regular", value: groups.regular },
      { name: "New", value: groups.new },
      { name: "At risk", value: groups.at_risk },
    ];
  }, [customers]);

  const topByLtv = React.useMemo(
    () => customers.slice().sort((a, b) => b.ltv - a.ltv).slice(0, 7).map((c) => ({ name: c.name, value: c.ltv })),
    [customers]
  );

  const customerTx = React.useMemo(() => {
    if (!selected || !txPage) return [];
    return txPage.data.filter((t) => t.customer === selected.name || t.customerEmail === selected.email);
  }, [selected, txPage]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Lifetime value, segment and behaviour across your customer base."
        actions={<Button variant="outline" size="sm" className="gap-1.5"><Search className="h-3.5 w-3.5" /> Export</Button>}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !customersRes ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Total customers" value={stats.total} icon={Users} accent="blue" format={(n) => formatNumber(n)} />
            <StatCard label="Total LTV" value={stats.totalLtv} icon={WalletIcon} accent="green" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="Avg order" value={stats.avgOrder} icon={ShoppingBag} accent="violet" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
            <StatCard label="VIP customers" value={stats.vip} icon={Crown} accent="amber" format={(n) => formatNumber(n)} />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Segment distribution</h3>
            <p className="text-xs text-muted-foreground">Customer count by segment</p>
          </div>
          {!customersRes ? <Skeleton className="h-56 w-full" /> : (
            <DonutChart data={segmentData} height={240} formatter={(v) => formatNumber(v)} />
          )}
        </Card>
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Top customers by LTV</h3>
              <p className="text-xs text-muted-foreground">Highest lifetime value</p>
            </div>
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
          {!customersRes ? <Skeleton className="h-56 w-full" /> : (
            <BarTrend
              data={topByLtv}
              dataKey="value"
              xKey="name"
              color="oklch(0.78 0.16 78)"
              height={240}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
            />
          )}
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Customer directory</h3>
            <Badge variant="outline" className="ml-1.5">{filtered.length}</Badge>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, country…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead className="px-5 text-xs font-medium text-muted-foreground">Customer</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Country</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Segment</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">Orders</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">Avg order</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">LTV</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={8} className="px-5"><Skeleton className="my-2 h-7" /></TableCell></TableRow>
                  ))
                : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      No customers match your search.
                    </TableCell>
                  </TableRow>
                ) : filtered.slice(0, 25).map((c) => {
                  const seg = segmentConfig[c.segment];
                  return (
                    <TableRow
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="cursor-pointer border-border/40 px-5 transition hover:bg-muted/30"
                    >
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border/60">
                            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">{initials(c.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">{c.country}</TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={cn("gap-1", seg.className)}>
                          {c.segment === "vip" && <Star className="h-3 w-3" />}
                          {seg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs tabular-nums">{c.orders}</TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs tabular-nums">{formatCurrency(c.avgOrder, "EUR", { compact: true })}</TableCell>
                      <TableCell className="py-3 text-right font-mono text-sm font-semibold tabular-nums">{formatCurrency(c.ltv, "EUR", { compact: true })}</TableCell>
                      <TableCell className="py-3"><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="py-3 text-right text-xs text-muted-foreground">{timeAgo(c.lastSeen)}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="border-b border-border/60 pr-10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border/60">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(selected.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-base">{selected.name}</SheetTitle>
                    <SheetDescription className="font-mono text-[11px]">{selected.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-5 p-5">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">LTV</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{formatCurrency(selected.ltv, "EUR", { compact: true })}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Orders</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{formatNumber(selected.orders)}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg order</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{formatCurrency(selected.avgOrder, "EUR", { compact: true })}</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{selected.country}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{selected.email}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Star className="h-3.5 w-3.5" /> Segment</span>
                    <Badge variant="outline" className={cn(segmentConfig[selected.segment].className)}>{segmentConfig[selected.segment].label}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Activity className="h-3.5 w-3.5" /> Status</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <span className="text-muted-foreground">First seen</span>
                    <span className="font-medium">{new Date(selected.firstSeen).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                </div>

                {/* LTV trend */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" /> LTV trend
                  </h4>
                  <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                    <Sparkline data={ltvSpark(hashStr(selected.id))} color="oklch(0.62 0.21 258)" height={48} />
                  </div>
                </div>

                <Separator className="bg-border/40" />

                {/* Purchase history */}
                <div>
                  <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <ShoppingBag className="h-3.5 w-3.5" /> Purchase history
                  </h4>
                  {customerTx.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
                      No captured payments linked to this customer.
                    </div>
                  ) : (
                    <ol className="flex flex-col gap-2">
                      {customerTx.slice(0, 8).map((t) => (
                        <li key={t.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-primary">{t.reference}</span>
                              <StatusBadge status={t.status} />
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <MethodBadge method={t.method} />
                              <span className="text-[10px] text-muted-foreground">{timeAgo(t.createdAt)}</span>
                            </div>
                          </div>
                          <span className="font-mono text-sm font-semibold tabular-nums">{formatCurrency(t.amount, t.currency)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
