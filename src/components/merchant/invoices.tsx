"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useInvoices } from "@/hooks/queries";
import { PageHeader, StatCard, EmptyState } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { StatusBadge, CurrencyBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatNumber, formatDate } from "@/lib/utils";
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
import { toast } from "sonner";
import type { CurrencyCode, Invoice } from "@/types";

const FILTERS = ["all", "paid", "open", "overdue", "draft", "void"] as const;
type Filter = (typeof FILTERS)[number];

export default function InvoicesPage() {
  const t = useT();
  const { data, isLoading } = useInvoices();
  const invoices = data ?? [];

  const totalInvoiced = invoices.reduce((s, inv) => s + inv.amount, 0);
  const paid = invoices.filter((i) => i.status === "paid");
  const paidTotal = paid.reduce((s, inv) => s + inv.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status === "open")
    .reduce((s, inv) => s + inv.amount, 0);
  const overdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, inv) => s + inv.amount, 0);

  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");

  const filtered = invoices.filter((inv) => {
    if (filter !== "all" && inv.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !inv.number.toLowerCase().includes(q) &&
        !inv.customer.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  // Create dialog
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    customer: "",
    amount: "",
    currency: "EUR" as CurrencyCode,
    dueDate: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  function reset() {
    setForm({ customer: "", amount: "", currency: "EUR", dueDate: "" });
  }

  async function handleCreate() {
    if (!form.customer.trim() || !form.amount) {
      toast.error("Customer and amount are required");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 350));
    const num = `INV-2025-${String(1000 + invoices.length + 1).padStart(4, "0")}`;
    toast.success("Invoice created", {
      description: `${num} · ${form.customer}`,
    });
    setSubmitting(false);
    setOpen(false);
    reset();
  }

  // View dialog
  const [viewTarget, setViewTarget] = React.useState<Invoice | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.invoices")}
        description="Bill customers with branded invoices and track payment status."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create invoice</DialogTitle>
                <DialogDescription>
                  Issue a new invoice to a customer.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inv-customer">Customer</Label>
                  <Input
                    id="inv-customer"
                    value={form.customer}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customer: e.target.value }))
                    }
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="inv-amount">Amount</Label>
                    <Input
                      id="inv-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      placeholder="1200.00"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Currency</Label>
                    <Select
                      value={form.currency}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, currency: v as CurrencyCode }))
                      }
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
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inv-due">Due date</Label>
                  <Input
                    id="inv-due"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dueDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Creating…" : "Create invoice"}
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
              label="Total invoiced"
              value={totalInvoiced}
              icon={DollarSign}
              accent="blue"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Paid"
              value={paidTotal}
              icon={CheckCircle2}
              accent="green"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Outstanding"
              value={outstanding}
              icon={Clock}
              accent="violet"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Overdue"
              value={overdue}
              icon={AlertTriangle}
              accent="rose"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
          </>
        )}
      </div>

      {/* Toolbar: filters + search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition",
                filter === f
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {f}
              {f !== "all" && (
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  {invoices.filter((i) => i.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by number or customer…"
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Invoices</h3>
            <p className="text-xs text-muted-foreground">
              {formatNumber(filtered.length)} of {formatNumber(invoices.length)}{" "}
              shown
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices found"
            description="Try a different filter or create a new invoice."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Number</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 font-medium">Currency</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Due date</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    className="border-b border-border/30 transition hover:bg-muted/30"
                  >
                    <td className="py-3 font-mono text-xs font-medium text-primary">
                      {inv.number}
                    </td>
                    <td className="py-3 font-medium">{inv.customer}</td>
                    <td className="py-3 text-right">
                      <CurrencyBadge currency={inv.currency} amount={inv.amount} />
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {inv.currency}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setViewTarget(inv)}
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            toast.success("Downloading PDF", {
                              description: inv.number,
                            })
                          }
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            toast.success("Invoice sent", {
                              description: `${inv.number} · ${inv.customer}`,
                            })
                          }
                          title="Send"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Invoice{" "}
              <span className="font-mono text-sm text-primary">
                {viewTarget?.number}
              </span>
            </DialogTitle>
            <DialogDescription>
              Issued {viewTarget ? formatDate(viewTarget.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {viewTarget.customer}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-0.5">
                    <StatusBadge status={viewTarget.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                    {formatCurrency(viewTarget.amount, viewTarget.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {viewTarget.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due date</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-medium">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(viewTarget.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Invoice ID</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {viewTarget.id}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(viewTarget.amount, viewTarget.currency)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax (0%)</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(0, viewTarget.currency)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-sm font-semibold">Total due</span>
                  <span className="font-mono text-base font-semibold tabular-nums">
                    {formatCurrency(viewTarget.amount, viewTarget.currency)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button
              className="gap-1.5"
              onClick={() =>
                toast.success("Invoice sent", {
                  description: viewTarget?.number,
                })
              }
            >
              <Send className="h-3.5 w-3.5" /> Send invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
