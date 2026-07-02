"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Layers, ListChecks, Loader2, Activity, RefreshCw, Radio,
} from "lucide-react";
import { useAdminHealth } from "@/hooks/queries";
import { PageHeader, StatCard, fadeUp } from "@/components/shared";
import { Sparkline } from "@/components/shared/badges";
import { BarTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";

function genSpark(base: number) {
  return Array.from({ length: 20 }, (_, i) => Math.max(1, base * (0.6 + Math.random() * 0.8) + Math.sin(i / 2) * base * 0.2));
}

const queueColor: Record<string, string> = {
  "payments.high": "oklch(0.62 0.21 258)",
  "payments.normal": "oklch(0.66 0.20 300)",
  payouts: "oklch(0.78 0.16 78)",
  webhooks: "oklch(0.70 0.17 158)",
  kyc: "oklch(0.68 0.20 20)",
};

export default function AdminQueuesPage() {
  const { data: health, isLoading } = useAdminHealth();
  const queues = health?.queues ?? [];

  const totalPending = queues.reduce((s, q) => s + q.pending, 0);
  const totalProcessing = queues.reduce((s, q) => s + q.processing, 0);
  const totalThroughput = queues.reduce((s, q) => s + q.throughput, 0);

  // Live "tick" to feel auto-refresh
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  // Queue depth bar
  const depth = queues.map((q) => ({ name: q.name, pending: q.pending, processing: q.processing }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Queues"
        description="Message broker depth, consumer throughput and backlog monitoring."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Purge
            </Button>
            <Button size="sm" className="gap-1.5">
              <Radio className="h-3.5 w-3.5" /> Replay DLQ
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Total pending" value={totalPending} change={-12.4} icon={Layers} accent="amber" format={(n) => formatNumber(n)} />
            <StatCard label="Processing" value={totalProcessing} change={6.8} icon={Loader2} accent="blue" format={(n) => formatNumber(n)} />
            <StatCard label="Throughput" value={totalThroughput} change={9.2} icon={Activity} accent="green" format={(n) => `${formatNumber(n)}/s`} />
            <StatCard label="Healthy queues" value={queues.filter((q) => q.pending < 500).length} icon={ListChecks} accent="violet" format={(n) => `${Math.round(n)}/${queues.length}`} />
          </>
        )}
      </div>

      {/* Queue cards grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Active queues</h3>
          <Badge variant="outline" className="gap-1.5 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live · {tick} ticks
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
          ) : queues.map((q, i) => {
            const load = Math.min(100, (q.processing / (q.processing + q.pending + 1)) * 100 * 3);
            const color = queueColor[q.name] ?? "oklch(0.62 0.21 258)";
            const spark = genSpark(q.throughput);
            return (
              <motion.div key={q.name} {...fadeUp} transition={{ duration: 0.35, delay: i * 0.04 }}>
                <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs font-semibold text-primary">{q.name}</p>
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Pending</p>
                      <p className="font-mono text-base font-semibold tabular-nums">{formatNumber(q.pending)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Active</p>
                      <p className="font-mono text-base font-semibold tabular-nums">{formatNumber(q.processing)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">TPS</p>
                      <p className="font-mono text-base font-semibold tabular-nums">{formatNumber(q.throughput)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Consumer load</span>
                      <span className="font-mono">{Math.min(100, load).toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, load)} className="h-1.5" />
                  </div>
                  <div className="mt-3">
                    <p className="mb-1 text-[10px] text-muted-foreground">Throughput (last 60s)</p>
                    <Sparkline data={spark} color={color} height={32} />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Queue depth chart */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Queue depth</h3>
            <p className="text-xs text-muted-foreground">Pending vs processing across all queues</p>
          </div>
        </div>
        {isLoading ? <Skeleton className="h-56 w-full" /> : (
          <BarTrend
            data={depth}
            dataKey={[
              { key: "pending", color: "oklch(0.78 0.16 78)", name: "Pending" },
              { key: "processing", color: "oklch(0.62 0.21 258)", name: "Processing" },
            ]}
            xKey="name"
            stacked
            height={240}
            formatter={(v) => formatNumber(v)}
          />
        )}
      </Card>
    </div>
  );
}
