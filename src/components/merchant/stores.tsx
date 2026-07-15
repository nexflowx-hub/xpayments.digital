"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Store as StoreIcon,
  Plus,
  Globe,
  Package,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import { useStores } from "@/hooks/queries";
import { PageHeader, StatCard, EmptyState } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { StatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/config";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { CurrencyCode } from "@/types";

export default function StoresPage() {
  const t = useT();
  const { data, isLoading } = useStores();
  const stores = data ?? [];

  const totalStores = stores.length;
  const active = stores.filter((s) => s.status === "active").length;
  const totalRevenue = stores.reduce((sum, s) => sum + s.revenue, 0);
  const totalProducts = stores.reduce((sum, s) => sum + s.products, 0);

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [currency, setCurrency] = React.useState<CurrencyCode>("EUR");
  const [submitting, setSubmitting] = React.useState(false);

  function reset() {
    setName("");
    setDomain("");
    setCurrency("EUR");
  }

  async function handleCreate() {
    if (!name.trim() || !domain.trim()) {
      toast.error("Name and domain are required");
      return;
    }
    setSubmitting(true);
    // xpApi.stores exposes list only; simulate creation latency + toast.
    await new Promise((r) => setTimeout(r, 350));
    toast.success(`Store "${name}" created`, {
      description: `${domain} · settlement in ${currency}`,
    });
    setSubmitting(false);
    setOpen(false);
    reset();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.stores")}
        description="Manage your storefronts across regions and currencies."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new store</DialogTitle>
                <DialogDescription>
                  Set up a storefront to sell products and accept payments.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-name">Store name</Label>
                  <Input
                    id="store-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="EU Store"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-domain">Domain</Label>
                  <Input
                    id="store-domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="eu.xpayments.digital"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Settlement currency</Label>
                  <Select
                    value={currency}
                    onValueChange={(v) => setCurrency(v as CurrencyCode)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="mr-1.5">{c.flag}</span> {c.code} —{" "}
                          {c.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Creating…" : "Create store"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total stores"
              value={totalStores}
              icon={StoreIcon}
              accent="blue"
              format={(n) => formatNumber(n)}
            />
            <StatCard
              label="Active"
              value={active}
              icon={CheckCircle2}
              accent="green"
              format={(n) => formatNumber(n)}
            />
            <StatCard
              label="Total revenue"
              value={totalRevenue}
              icon={DollarSign}
              accent="violet"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Total products"
              value={totalProducts}
              icon={Package}
              accent="amber"
              format={(n) => formatNumber(n)}
            />
          </>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="No stores yet"
          description="Create your first storefront to start accepting payments."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((s, i) => (
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
                      <p className="truncate text-sm font-semibold text-foreground">
                        {s.name}
                      </p>
                      <a
                        href={`https://${s.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition hover:text-primary"
                      >
                        <Globe className="h-3 w-3" /> {s.domain}
                        <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                      </a>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Products
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
                      {formatNumber(s.products)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Revenue
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
                      {formatCurrency(s.revenue, s.currency, { compact: true })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Created
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      {formatDate(s.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="rounded-md bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {s.currency}
                  </span>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    Manage <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
