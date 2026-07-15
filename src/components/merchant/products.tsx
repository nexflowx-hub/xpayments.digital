"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProducts } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
import { PageHeader, StatCard, EmptyState } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { StatusBadge, CurrencyBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import type { CurrencyCode, Product } from "@/types";

export default function ProductsPage() {
  const t = useT();
  const { data, isLoading } = useProducts();
  const qc = useQueryClient();
  const products = data ?? [];

  const total = products.length;
  const active = products.filter((p) => p.active).length;
  const totalSales = products.reduce((s, p) => s + p.sales, 0);
  const avgPrice = total
    ? products.reduce((s, p) => s + p.price, 0) / total
    : 0;

  const [search, setSearch] = React.useState("");
  const filtered = products.filter((p) =>
    !search
      ? true
      : p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()),
  );

  // Create dialog
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    price: "",
    currency: "EUR" as CurrencyCode,
    active: true,
  });
  const [submitting, setSubmitting] = React.useState(false);

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Product>) => xpApi.products.create(payload),
    onSuccess: (p) => {
      toast.success(`Product "${p.name}" created`);
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setForm({
        name: "",
        description: "",
        price: "",
        currency: "EUR",
        active: true,
      });
    },
    onError: () => toast.error("Failed to create product"),
  });

  function handleCreate() {
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    createMutation.mutate({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      currency: form.currency,
      active: form.active,
    });
  }

  // Delete
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => xpApi.products.remove(id),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Failed to delete product"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.products")}
        description="Catalog of products available across your stores."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create product</DialogTitle>
                <DialogDescription>
                  Add a new product to your catalog.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prod-name">Name</Label>
                  <Input
                    id="prod-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Pro Plan (Annual)"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prod-desc">Description</Label>
                  <Textarea
                    id="prod-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Annual subscription to XPayments Pro"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="prod-price">Price</Label>
                    <Input
                      id="prod-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: e.target.value }))
                      }
                      placeholder="99.00"
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
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">
                      Available for purchase immediately
                    </p>
                  </div>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, active: v }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating…" : "Create product"}
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
              label="Total products"
              value={total}
              icon={Package}
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
              label="Total sales"
              value={totalSales}
              icon={TrendingUp}
              accent="violet"
              format={(n) => formatNumber(n, { compact: true })}
            />
            <StatCard
              label="Avg. price"
              value={avgPrice}
              icon={DollarSign}
              accent="amber"
              format={(n) => formatCurrency(n, "EUR")}
            />
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="border-border/60 bg-muted/30">
          {filtered.length} of {total}
        </Badge>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={
            search
              ? "Try a different search term."
              : "Create your first product to start selling."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              whileHover={{ y: -3 }}
            >
              <Card className="group overflow-hidden border-border/60 bg-card/60 backdrop-blur-xl">
                {/* Gradient placeholder image */}
                <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-primary/25 via-violet-500/15 to-emerald-500/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="h-10 w-10 text-primary/60 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="absolute right-3 top-3">
                    {p.active ? (
                      <StatusBadge status="active" />
                    ) : (
                      <StatusBadge status="inactive" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {p.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => toast.info(`Edit "${p.name}"`)}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            toast.success(
                              p.active
                                ? `"${p.name}" deactivated`
                                : `"${p.name}" activated`,
                            )
                          }
                        >
                          <Power className="mr-2 h-3.5 w-3.5" />
                          {p.active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setDeleteTarget(p)}
                          className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <CurrencyBadge currency={p.currency} amount={p.price} />
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold tabular-nums">
                        {formatNumber(p.sales)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">sales</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 text-white hover:bg-rose-600"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
