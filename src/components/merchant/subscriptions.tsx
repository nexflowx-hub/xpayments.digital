"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Repeat,
  CheckCircle2,
  TrendingUp,
  UserX,
  Clock,
  Eye,
  Ban,
  Sparkles,
} from "lucide-react";
import { useSubscriptions } from "@/hooks/queries";
import { PageHeader, StatCard, EmptyState } from "@/components/shared";
import { StatusBadge, CurrencyBadge } from "@/components/shared/badges";
import { AreaTrend, DonutChart } from "@/components/shared/charts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Subscription } from "@/types";

const STATUS_GROUPS: { key: Subscription["status"]; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "trialing", label: "Trialing" },
  { key: "past_due", label: "Past due" },
  { key: "canceled", label: "Canceled" },
];

export default function SubscriptionsPage() {
  const { data, isLoading } = useSubscriptions();
  const subs = data?.data ?? [];

  const activeSubs = subs.filter((s) => s.status === "active");
  const churned = subs.filter((s) => s.status === "canceled").length;
  const trialing = subs.filter((s) => s.status === "trialing").length;

  // MRR = active monthly + active yearly / 12
  const mrr =
    activeSubs
      .filter((s) => s.interval === "month")
      .reduce((sum, s) => sum + s.amount, 0) +
    activeSubs
      .filter((s) => s.interval === "year")
      .reduce((sum, s) => sum + s.amount / 12, 0);

  // Synthetic MRR trend (12 months) — deterministic
  const mrrSeries = React.useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => {
        const date = new Date(2024, i, 1).toLocaleDateString("en-US", {
          month: "short",
        });
        const growth = 0.72 + (i / 11) * 0.28;
        return { date, value: Math.round(mrr * growth) };
      }),
    [mrr],
  );

  const donutData = STATUS_GROUPS.map((g) => ({
    name: g.label,
    value: subs.filter((s) => s.status === g.key).length,
  })).filter((d) => d.value > 0);

  const [viewTarget, setViewTarget] = React.useState<Subscription | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<Subscription | null>(
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subscriptions"
        description="Recurring revenue, plan distribution and churn at a glance."
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
              label="Active subs"
              value={activeSubs.length}
              icon={CheckCircle2}
              accent="green"
              format={(n) => formatNumber(n)}
            />
            <StatCard
              label="MRR"
              value={mrr}
              icon={TrendingUp}
              accent="blue"
              format={(n) => formatCurrency(n, "EUR", { compact: true })}
            />
            <StatCard
              label="Churned"
              value={churned}
              icon={UserX}
              accent="rose"
              format={(n) => formatNumber(n)}
            />
            <StatCard
              label="Trialing"
              value={trialing}
              icon={Clock}
              accent="violet"
              format={(n) => formatNumber(n)}
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">MRR trend</h3>
              <p className="text-xs text-muted-foreground">
                Monthly recurring revenue, last 12 months
              </p>
            </div>
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400"
            >
              <Sparkles className="h-3 w-3" /> {formatCurrency(mrr, "EUR", { compact: true })}
            </Badge>
          </div>
          {isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <AreaTrend
              data={mrrSeries}
              formatter={(v) => formatCurrency(v, "EUR", { compact: true })}
              height={260}
            />
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Status breakdown</h3>
            <p className="text-xs text-muted-foreground">
              Subscriptions by lifecycle state
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : donutData.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No subscriptions"
              description="Subscribe customers to a plan to see breakdown."
            />
          ) : (
            <DonutChart
              data={donutData}
              formatter={(v) => formatNumber(v)}
              height={260}
            />
          )}
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">All subscriptions</h3>
            <p className="text-xs text-muted-foreground">
              {formatNumber(subs.length)} total · sorted by current period end
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : subs.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No subscriptions yet"
            description="Offer recurring plans to your customers to build predictable revenue."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Current period end</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    className="border-b border-border/30 transition hover:bg-muted/30"
                  >
                    <td className="py-3">
                      <p className="font-medium">{s.customer}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {s.id}
                      </p>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant="outline"
                        className="border-border/60 bg-muted/30"
                      >
                        {s.plan}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <CurrencyBadge currency={s.currency} amount={s.amount} />
                      <p className="text-[10px] text-muted-foreground">
                        per {s.interval}
                      </p>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {formatDate(s.currentPeriodEnd)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setViewTarget(s)}
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                          onClick={() => setCancelTarget(s)}
                          title="Cancel"
                          disabled={s.status === "canceled"}
                        >
                          <Ban className="h-3.5 w-3.5" />
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
              <Repeat className="h-4 w-4 text-primary" />
              Subscription details
            </DialogTitle>
            <DialogDescription>
              {viewTarget?.customer} ·{" "}
              <span className="font-mono">{viewTarget?.id}</span>
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="mt-0.5 text-sm font-medium">
                  {viewTarget.customer}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <div className="mt-0.5">
                  <Badge variant="outline" className="border-border/60 bg-muted/30">
                    {viewTarget.plan}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(viewTarget.amount, viewTarget.currency)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / {viewTarget.interval}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={viewTarget.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Current period end
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {formatDate(viewTarget.currentPeriodEnd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Annualized value</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(
                    viewTarget.interval === "year"
                      ? viewTarget.amount
                      : viewTarget.amount * 12,
                    viewTarget.currency,
                    { compact: true },
                  )}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel{" "}
              <span className="font-medium text-foreground">
                {cancelTarget?.customer}
              </span>
              &apos;s <span className="font-medium">{cancelTarget?.plan}</span>{" "}
              plan at the end of the current period. The customer will retain
              access until{" "}
              {cancelTarget
                ? formatDate(cancelTarget.currentPeriodEnd)
                : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep active</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 text-white hover:bg-rose-600"
              onClick={() => {
                if (cancelTarget)
                  toast.success("Subscription canceled", {
                    description: `${cancelTarget.customer} · ${cancelTarget.plan}`,
                  });
                setCancelTarget(null);
              }}
            >
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
