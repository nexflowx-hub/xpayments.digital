"use client";

import * as React from "react";
import {
  Users,
  Crown,
  ShoppingBag,
  Search,
  Mail,
  MapPin,
  Star,
  X,
  Phone,
  Clock3,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Coins,
} from "lucide-react";
import { useCustomers } from "@/hooks/queries";
import { PageHeader, StatCard } from "@/components/shared";
import { StatusBadge } from "@/components/shared/badges";
import { DonutChart, BarTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  formatNumber,
  formatDateFull,
  timeAgo,
  initials,
  cn,
} from "@/lib/utils";
import type { Customer } from "@/types";
import { useT } from "@/lib/i18n";

type CustomerSegment = "vip" | "regular" | "new" | "at_risk";

interface CurrencyMetric {
  currency: string;
  orders: number;
  ltv: number;
  avgOrder: number;
  succeeded: number;
  failed: number;
  refunded: number;
  lastPaymentAt?: string | null;
}

type CustomerV2 = Customer & {
  phone?: string;
  normalizedEmail?: string;
  normalizedPhone?: string;
  lastPaymentAt?: string | null;
  totalSucceeded?: number;
  totalFailed?: number;
  totalRefunded?: number;
  metricsByCurrency?: Record<string, CurrencyMetric>;
};

const segmentConfig: Record<CustomerSegment, { label: string; className: string }> = {
  vip: {
    label: "VIP",
    className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400",
  },
  regular: {
    label: "Regular",
    className: "border-sky-500/25 bg-sky-500/12 text-sky-400",
  },
  new: {
    label: "New",
    className: "border-violet-500/25 bg-violet-500/12 text-violet-400",
  },
  at_risk: {
    label: "At risk",
    className: "border-rose-500/25 bg-rose-500/12 text-rose-400",
  },
};

function safeName(customer: CustomerV2) {
  return customer.name?.trim() || customer.email || "Customer";
}

function metrics(customer: CustomerV2): CurrencyMetric[] {
  return Object.values(customer.metricsByCurrency ?? {})
    .map((metric) => ({
      currency: String(metric.currency || "").toUpperCase(),
      orders: Number(metric.orders ?? 0),
      ltv: Number(metric.ltv ?? 0),
      avgOrder: Number(metric.avgOrder ?? 0),
      succeeded: Number(metric.succeeded ?? 0),
      failed: Number(metric.failed ?? 0),
      refunded: Number(metric.refunded ?? 0),
      lastPaymentAt: metric.lastPaymentAt ?? null,
    }))
    .filter((metric) => metric.currency)
    .sort((a, b) => b.orders - a.orders || a.currency.localeCompare(b.currency));
}

function currenciesLabel(customer: CustomerV2) {
  const values = metrics(customer).map((metric) => metric.currency);
  return values.length ? values.join(" · ") : "—";
}

export default function CustomersPage() {
  const t = useT();
  const { data: customersRes, isLoading } = useCustomers();
  const customers = (customersRes ?? []) as CustomerV2[];

  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<CustomerV2 | null>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.toLowerCase();

    return customers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.phone,
        customer.country,
        customer.normalizedPhone,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [customers, query]);

  const stats = React.useMemo(() => {
    const paying = customers.filter((customer) => customer.orders > 0).length;
    const repeat = customers.filter((customer) => customer.orders >= 2).length;
    const totalOrders = customers.reduce((sum, customer) => sum + customer.orders, 0);
    const vip = customers.filter((customer) => customer.segment === "vip").length;

    return {
      total: customers.length,
      paying,
      repeat,
      totalOrders,
      vip,
    };
  }, [customers]);

  const segmentData = React.useMemo(() => {
    const groups: Record<CustomerSegment, number> = {
      vip: 0,
      regular: 0,
      new: 0,
      at_risk: 0,
    };

    customers.forEach((customer) => {
      const segment = customer.segment as CustomerSegment;
      if (segment in groups) groups[segment] += 1;
    });

    return [
      { name: "VIP", value: groups.vip },
      { name: "Regular", value: groups.regular },
      { name: "New", value: groups.new },
      { name: "At risk", value: groups.at_risk },
    ];
  }, [customers]);

  const topByOrders = React.useMemo(
    () =>
      customers
        .slice()
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 7)
        .map((customer) => ({
          name: safeName(customer),
          value: customer.orders,
        })),
    [customers]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.customers")}
        description="Customer identity, payment history and currency-aware behaviour across your business."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Search className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !customersRes ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total customers"
              value={stats.total}
              icon={Users}
              accent="blue"
              format={formatNumber}
            />
            <StatCard
              label="Paying customers"
              value={stats.paying}
              icon={CheckCircle2}
              accent="green"
              format={formatNumber}
            />
            <StatCard
              label="Repeat customers"
              value={stats.repeat}
              icon={Crown}
              accent="amber"
              format={formatNumber}
            />
            <StatCard
              label="Successful orders"
              value={stats.totalOrders}
              icon={ShoppingBag}
              accent="violet"
              format={formatNumber}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Segment distribution</h3>
            <p className="text-xs text-muted-foreground">Lifecycle and recurrence segments</p>
          </div>
          {!customersRes ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <DonutChart data={segmentData} height={240} formatter={formatNumber} />
          )}
        </Card>

        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Top customers by successful orders</h3>
              <p className="text-xs text-muted-foreground">
                Ranking by recurrence without mixing currencies
              </p>
            </div>
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
          {!customersRes ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <BarTrend
              data={topByOrders}
              dataKey="value"
              xKey="name"
              color="oklch(0.78 0.16 78)"
              height={240}
              formatter={formatNumber}
            />
          )}
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Customer directory</h3>
            <Badge variant="outline" className="ml-1.5">{filtered.length}</Badge>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone or country…"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead className="px-5 text-xs">Customer</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Segment</TableHead>
                <TableHead className="text-right text-xs">Orders</TableHead>
                <TableHead className="text-xs">Currencies</TableHead>
                <TableHead className="text-xs">Last payment</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8} className="px-5">
                      <Skeleton className="my-2 h-7" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No customers match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(0, 100).map((customer) => {
                  const segment = customer.segment as CustomerSegment;
                  const segmentStyle = segmentConfig[segment] ?? segmentConfig.new;
                  const name = safeName(customer);

                  return (
                    <TableRow
                      key={customer.id}
                      onClick={() => setSelected(customer)}
                      className="cursor-pointer border-border/40 transition hover:bg-muted/30"
                    >
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border/60">
                            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                              {initials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {customer.phone || "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={cn("gap-1", segmentStyle.className)}>
                          {segment === "vip" && <Star className="h-3 w-3" />}
                          {segmentStyle.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs tabular-nums">
                        {formatNumber(customer.orders)}
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {currenciesLabel(customer)}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {customer.lastPaymentAt ? timeAgo(customer.lastPaymentAt) : "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge status={customer.status} />
                      </TableCell>
                      <TableCell className="py-3 text-right text-xs text-muted-foreground">
                        {customer.lastSeen ? timeAgo(customer.lastSeen) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader className="border-b border-border/60 pr-10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border/60">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials(safeName(selected))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-base">{safeName(selected)}</SheetTitle>
                    <SheetDescription className="truncate font-mono text-[11px]">
                      {selected.email}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-5 p-5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Orders</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold">{formatNumber(selected.orders)}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Succeeded</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold">{formatNumber(selected.totalSucceeded ?? selected.orders)}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Failed</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold">{formatNumber(selected.totalFailed ?? 0)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{selected.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{selected.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{selected.country || "Country not captured"}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDateFull(selected.lastPaymentAt)}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Payment value by currency</h3>
                      <p className="text-xs text-muted-foreground">
                        Financial metrics stay separated by settlement currency.
                      </p>
                    </div>
                    <Coins className="h-4 w-4 text-primary" />
                  </div>

                  <div className="flex flex-col gap-2">
                    {metrics(selected).length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
                        No currency-scoped payment metrics available yet.
                      </div>
                    ) : (
                      metrics(selected).map((metric) => (
                        <div key={metric.currency} className="rounded-xl border border-border/50 bg-background/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <Badge variant="outline">{metric.currency}</Badge>
                              <p className="mt-2 text-lg font-semibold tabular-nums">
                                {formatCurrency(metric.ltv, metric.currency)}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatNumber(metric.orders)} successful orders · avg {formatCurrency(metric.avgOrder, metric.currency)}
                              </p>
                            </div>
                            <div className="grid gap-1 text-right text-[11px] text-muted-foreground">
                              <span className="flex items-center justify-end gap-1"><CheckCircle2 className="h-3 w-3" /> {metric.succeeded}</span>
                              <span className="flex items-center justify-end gap-1"><XCircle className="h-3 w-3" /> {metric.failed}</span>
                              <span className="flex items-center justify-end gap-1"><RotateCcw className="h-3 w-3" /> {metric.refunded}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <p className="text-[10px] uppercase text-muted-foreground">First seen</p>
                    <p className="mt-1">{formatDateFull(selected.firstSeen)}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Last seen</p>
                    <p className="mt-1">{formatDateFull(selected.lastSeen)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
