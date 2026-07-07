"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Plus,
  Copy,
  Power,
  Trash2,
  MousePointerClick,
  Target,
  CheckCircle2,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { usePaymentLinks } from "@/hooks/queries";
import { PageHeader, StatCard, EmptyState } from "@/components/shared";
import { StatusBadge, CurrencyBadge } from "@/components/shared/badges";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/config";
import { formatCurrency, formatNumber, formatPercent, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { CurrencyCode } from "@/types";

export default function PaymentLinksPage() {
  const { data, isLoading } = usePaymentLinks();
  const links = data ?? [];

  const total = links.length;
  const active = links.filter((l) => l.status === "active").length;
  const totalVisits = links.reduce((s, l) => s + l.visits, 0);
  const totalConversions = links.reduce((s, l) => s + l.conversions, 0);
  const conversionRate = totalVisits
    ? (totalConversions / totalVisits) * 100
    : 0;

  // Create dialog
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<CurrencyCode>("EUR");
  const [submitting, setSubmitting] = React.useState(false);

  function reset() {
    setName("");
    setAmount("");
    setCurrency("EUR");
  }

  async function handleCreate() {
    if (!name.trim() || !amount) {
      toast.error("Name and amount are required");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 350));
    const slug = Math.random().toString(36).slice(2, 6).toUpperCase();
    toast.success(`Link "${name}" created`, {
      description: `pay.xpayments.digital/l/${slug}`,
    });
    setSubmitting(false);
    setOpen(false);
    reset();
  }

  function copyUrl(url: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${url}`).catch(() => {});
    }
    toast.success("Copied", { description: url });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payment Links"
        description="No-code checkout links you can share anywhere."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create payment link</DialogTitle>
                <DialogDescription>
                  Generate a shareable checkout link.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pl-name">Name</Label>
                  <Input
                    id="pl-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Pro Upgrade"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pl-amount">Amount</Label>
                    <Input
                      id="pl-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="99.00"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Currency</Label>
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
                            <span className="mr-1.5">{c.flag}</span> {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Creating…" : "Create link"}
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
              label="Total links"
              value={total}
              icon={Link2}
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
              label="Total visits"
              value={totalVisits}
              icon={MousePointerClick}
              accent="violet"
              format={(n) => formatNumber(n, { compact: true })}
            />
            <StatCard
              label="Conversion rate"
              value={conversionRate}
              icon={Target}
              accent="amber"
              format={(n) => formatPercent(n, 2)}
            />
          </>
        )}
      </div>

      {/* Table */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">All payment links</h3>
            <p className="text-xs text-muted-foreground">
              Shareable checkout URLs with live conversion metrics
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No payment links yet"
            description="Create your first link to start accepting payments without code."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">URL</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Visits</th>
                  <th className="pb-2 text-right font-medium">Conv.</th>
                  <th className="pb-2 text-right font-medium">Rate</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l, i) => {
                  const rate = l.visits
                    ? (l.conversions / l.visits) * 100
                    : 0;
                  return (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="border-b border-border/30 transition hover:bg-muted/30"
                    >
                      <td className="py-3 font-medium">{l.name}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => copyUrl(l.url)}
                          className="group inline-flex max-w-[220px] items-center gap-1.5 font-mono text-xs text-primary transition hover:underline"
                          title={l.url}
                        >
                          <span className="truncate">{l.url}</span>
                          <Copy className="h-3 w-3 shrink-0 opacity-60 transition group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <CurrencyBadge currency={l.currency} amount={l.amount} />
                      </td>
                      <td className="py-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums">
                        {formatNumber(l.visits)}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums">
                        {formatNumber(l.conversions)}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-muted-foreground">
                        {formatPercent(rate, 1)}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {formatDate(l.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => copyUrl(l.url)}
                            >
                              <Copy className="mr-2 h-3.5 w-3.5" /> Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                window.open(`https://${l.url}`, "_blank")
                              }
                            >
                              <ExternalLink className="mr-2 h-3.5 w-3.5" /> Open
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                toast.success(
                                  l.status === "active"
                                    ? "Link deactivated"
                                    : "Link activated",
                                )
                              }
                            >
                              <Power className="mr-2 h-3.5 w-3.5" />
                              {l.status === "active"
                                ? "Deactivate"
                                : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => toast.success("Link deleted")}
                              className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
