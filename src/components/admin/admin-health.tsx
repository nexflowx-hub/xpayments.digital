"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity, CheckCircle2, AlertTriangle, XCircle, Zap, Bell,
} from "lucide-react";
import { useAdminHealth } from "@/hooks/queries";
import { PageHeader, fadeUp } from "@/components/shared";
import { Sparkline } from "@/components/shared/badges";
import { AreaTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo, formatDate } from "@/lib/utils";

type SvcStatus = "operational" | "degraded" | "outage";

const statusDot: Record<SvcStatus, string> = {
  operational: "bg-emerald-400",
  degraded: "bg-amber-400",
  outage: "bg-rose-400",
};
const statusRing: Record<SvcStatus, string> = {
  operational: "border-emerald-500/30 bg-emerald-500/8",
  degraded: "border-amber-500/30 bg-amber-500/8",
  outage: "border-rose-500/30 bg-rose-500/8",
};
const sparkColor: Record<SvcStatus, string> = {
  operational: "#34d399",
  degraded: "#fbbf24",
  outage: "#f87171",
};

// ---- Mock incident timeline ----
interface Incident {
  id: string;
  title: string;
  severity: SvcStatus;
  service: string;
  startedAt: string;
  resolvedAt?: string;
  updates: { at: string; message: string }[];
}

const INCIDENTS: Incident[] = [
  {
    id: "INC-2041",
    title: "FX service elevated latency",
    severity: "degraded",
    service: "FX Service",
    startedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    updates: [
      { at: new Date(Date.now() - 1000 * 60 * 42).toISOString(), message: "Investigating increased p99 latency on EUR/USD quotes." },
      { at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), message: "Root cause identified — upstream provider throttling. Rerouting to backup." },
      { at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), message: "Failover complete, latency recovering." },
    ],
  },
  {
    id: "INC-2038",
    title: "Webhook delivery delays",
    severity: "degraded",
    service: "Webhook Dispatcher",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updates: [
      { at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), message: "Queue backlog detected on webhooks.normal." },
      { at: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString(), message: "Consumer autoscale triggered, backlog draining." },
      { at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), message: "Resolved — backlog cleared, SLA restored." },
    ],
  },
  {
    id: "INC-2035",
    title: "Scheduled maintenance — settlement",
    severity: "operational",
    service: "Settlement",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    updates: [
      { at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), message: "Scheduled window for settlement DB vacuum." },
      { at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), message: "Maintenance completed, no impact." },
    ],
  },
];

function buildUptimeSeries() {
  // 90 days of uptime % — small dips for incidents
  const out: { date: string; value: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    let v = 100;
    if (i === 0) v = 99.992; // today
    else if (i === 4) v = 99.71; // fx incident
    else if (i === 32) v = 99.88; // webhook delays
    else if (i === 61) v = 99.94;
    else v = 100 - Math.random() * 0.04;
    out.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: Number(v.toFixed(3)) });
  }
  return out;
}

export default function AdminHealthPage() {
  const { data: health, isLoading } = useAdminHealth();
  const uptimeSeries = React.useMemo(buildUptimeSeries, []);

  const overall = health?.status ?? "operational";
  const uptime = health?.uptime ?? 99.99;
  const bannerCfg = overall === "operational"
    ? { icon: CheckCircle2, label: "All systems operational", color: "text-emerald-400", bg: "from-emerald-500/15 to-transparent", border: "border-emerald-500/30" }
    : overall === "degraded"
      ? { icon: AlertTriangle, label: "Degraded performance detected", color: "text-amber-400", bg: "from-amber-500/15 to-transparent", border: "border-amber-500/30" }
      : { icon: XCircle, label: "Active outage", color: "text-rose-400", bg: "from-rose-500/15 to-transparent", border: "border-rose-500/30" };
  const BannerIcon = bannerCfg.icon;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System Health"
        description="Real-time status, uptime and incident history for all platform services."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Subscribe</Button>
            <Button size="sm" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Run probe</Button>
          </>
        }
      />

      {/* Status banner */}
      <motion.div {...fadeUp}>
        <Card className={cn("relative overflow-hidden border bg-gradient-to-br p-6 backdrop-blur-xl", bannerCfg.border, bannerCfg.bg)}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className={cn("rounded-2xl border p-3", bannerCfg.border, "bg-background/40")}>
                <BannerIcon className={cn("h-7 w-7", bannerCfg.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {overall !== "operational" && (
                      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", statusDot[overall])} />
                    )}
                    <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", statusDot[overall])} />
                  </span>
                  <h2 className={cn("text-xl font-semibold", bannerCfg.color)}>{bannerCfg.label}</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {health?.services.length ?? 0} services monitored · updated {timeAgo(new Date().toISOString())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground">90-day uptime</p>
                <p className="font-mono text-2xl font-semibold tabular-nums">{uptime.toFixed(3)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active incidents</p>
                <p className="font-mono text-2xl font-semibold tabular-nums">{INCIDENTS.filter((i) => !i.resolvedAt).length}</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Services grid */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Services</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading || !health ? (
            Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : (
            (health?.services ?? []).map((s, i) => {
              const spark = Array.from({ length: 16 }, () => Math.max(0, s.latencyMs + (Math.random() - 0.5) * s.latencyMs * 0.6));
              return (
                <motion.div key={s.name} {...fadeUp} transition={{ duration: 0.35, delay: i * 0.03 }}>
                  <Card className={cn("border p-4 backdrop-blur-xl", statusRing[s.status])}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.name}</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.status}</p>
                      </div>
                      <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", statusDot[s.status])} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-muted-foreground">p99 latency</p>
                        <p className={cn("font-mono font-semibold tabular-nums", s.latencyMs > 200 ? "text-amber-400" : "text-foreground")}>{s.latencyMs}ms</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">uptime</p>
                        <p className="font-mono font-semibold tabular-nums text-emerald-400">
                          {s.status === "operational" ? "99.99" : s.status === "degraded" ? "98.82" : "97.40"}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Sparkline data={spark} color={sparkColor[s.status]} height={28} />
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Uptime trend + incidents */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Platform uptime</h3>
              <p className="text-xs text-muted-foreground">Aggregate uptime, last 90 days</p>
            </div>
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <Activity className="h-3 w-3" /> SLA 99.95%
            </Badge>
          </div>
          <AreaTrend data={uptimeSeries} color="oklch(0.70 0.17 158)" height={240} formatter={(v) => `${v.toFixed(2)}%`} />
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Incident history</h3>
            <p className="text-xs text-muted-foreground">Recent platform events</p>
          </div>
          <div className="relative flex flex-col gap-4">
            {INCIDENTS.map((inc) => (
              <div key={inc.id} className="relative pl-5">
                <span className={cn("absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full", statusDot[inc.severity])} />
                <span className="absolute left-[4px] top-4 h-full w-px bg-border/60" />
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground">{inc.title}</p>
                  {inc.resolvedAt ? (
                    <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-[10px] text-emerald-400">Resolved</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/25 bg-amber-500/10 text-[10px] text-amber-400">Monitoring</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {inc.service} · {formatDate(inc.startedAt, { withTime: true })}
                  {inc.resolvedAt && ` → ${formatDate(inc.resolvedAt, { withTime: true })}`}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{inc.updates[inc.updates.length - 1].message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
