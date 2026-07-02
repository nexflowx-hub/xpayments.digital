"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Cpu, Server, Activity, Gauge, Plus, Minus, MapPin, Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminHealth } from "@/hooks/queries";
import { PageHeader, StatCard, fadeUp } from "@/components/shared";
import { BarTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatNumber } from "@/lib/utils";

export default function AdminWorkersPage() {
  const { data: health, isLoading } = useAdminHealth();
  const workers = health?.workers ?? [];

  const total = workers.reduce((s, w) => s + w.active + w.idle, 0);
  const active = workers.reduce((s, w) => s + w.active, 0);
  const idle = workers.reduce((s, w) => s + w.idle, 0);
  const utilization = total > 0 ? (active / total) * 100 : 0;

  // Utilization by pool bar chart
  const utilByPool = workers.map((w) => ({
    name: w.name.replace("payment-workers-", "pw-").replace("payout-workers", "payout").replace("risk-workers", "risk"),
    active: w.active,
    idle: w.idle,
  }));

  // Regional distribution
  const byRegion = React.useMemo(() => {
    const map = new Map<string, { active: number; idle: number }>();
    workers.forEach((w) => {
      const cur = map.get(w.region) ?? { active: 0, idle: 0 };
      cur.active += w.active;
      cur.idle += w.idle;
      map.set(w.region, cur);
    });
    return Array.from(map.entries()).map(([region, v]) => ({ region, ...v, total: v.active + v.idle }));
  }, [workers]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Worker Pools"
        description="Background processing capacity, autoscaling and regional distribution."
        actions={
          <>
            <Button variant="outline" size="sm">Autoscaler logs</Button>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Provision pool</Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Total workers" value={total} icon={Cpu} accent="blue" format={(n) => formatNumber(n)} />
            <StatCard label="Active" value={active} change={4.6} icon={Server} accent="green" format={(n) => formatNumber(n)} />
            <StatCard label="Idle" value={idle} change={-3.1} icon={Activity} accent="violet" format={(n) => formatNumber(n)} />
            <StatCard label="Utilization" value={utilization} change={2.4} icon={Gauge} accent="amber" format={(n) => `${n.toFixed(1)}%`} />
          </>
        )}
      </div>

      {/* Pools table + utilization chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Worker pools</h3>
              <p className="text-xs text-muted-foreground">Capacity and live utilization per pool</p>
            </div>
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Autoscaling
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Pool</th>
                  <th className="pb-2 font-medium">Region</th>
                  <th className="pb-2 text-right font-medium">Active</th>
                  <th className="pb-2 text-right font-medium">Idle</th>
                  <th className="pb-2 font-medium w-1/3">Utilization</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/30"><td colSpan={6}><Skeleton className="my-2 h-8" /></td></tr>
                  ))
                ) : workers.map((w) => {
                  const util = ((w.active / (w.active + w.idle)) * 100);
                  const status = util > 90 ? "overloaded" : util > 70 ? "busy" : "healthy";
                  const utilColor = util > 90 ? "text-rose-400" : util > 70 ? "text-amber-400" : "text-emerald-400";
                  return (
                    <tr key={w.name} className="border-b border-border/30 transition hover:bg-muted/30">
                      <td className="py-3">
                        <p className="font-mono text-xs font-semibold text-primary">{w.name}</p>
                        <p className="text-[10px] text-muted-foreground">{status}</p>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">{w.region}</td>
                      <td className="py-3 text-right font-mono text-xs tabular-nums">{w.active}</td>
                      <td className="py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">{w.idle}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={util} className={cn("h-1.5", util > 90 ? "[&>div]:bg-rose-400" : util > 70 ? "[&>div]:bg-amber-400" : "[&>div]:bg-emerald-400")} />
                          <span className={cn("font-mono text-[10px] tabular-nums", utilColor)}>{util.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => toast.success(`Scaling up ${w.name}`, { description: `+2 workers provisioning in ${w.region}.` })}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => toast.info(`Scaling down ${w.name}`, { description: `-1 worker draining, will terminate in 60s.` })}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Utilization by pool</h3>
            <p className="text-xs text-muted-foreground">Active vs idle workers</p>
          </div>
          {isLoading ? <Skeleton className="h-56 w-full" /> : (
            <BarTrend
              data={utilByPool}
              dataKey={[
                { key: "active", color: "oklch(0.62 0.21 258)", name: "Active" },
                { key: "idle", color: "oklch(0.30 0.04 255)", name: "Idle" },
              ]}
              xKey="name"
              stacked
              height={220}
              formatter={(v) => formatNumber(v)}
            />
          )}
        </Card>
      </div>

      {/* Regional distribution */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">Regional distribution</h3>
              <p className="text-xs text-muted-foreground">Worker capacity by region</p>
            </div>
          </div>
          <Boxes className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {byRegion.map((r) => {
            const util = (r.active / r.total) * 100;
            return (
              <motion.div key={r.region} {...fadeUp} className="relative overflow-hidden rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs font-semibold text-primary">{r.region}</p>
                  <Badge variant="outline" className="text-[10px]">{r.total} workers</Badge>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Active</p>
                    <p className="font-mono text-lg font-semibold tabular-nums">{r.active}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Idle</p>
                    <p className="font-mono text-lg font-semibold tabular-nums text-muted-foreground">{r.idle}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={util} className="h-1.5" />
                  <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">{util.toFixed(1)}% utilized</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
