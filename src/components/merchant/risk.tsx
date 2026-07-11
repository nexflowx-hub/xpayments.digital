"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Gauge as GaugeIcon, Activity,
  RefreshCcw, Lightbulb, Bell, TrendingDown, TrendingUp, Lock,
} from "lucide-react";
import { useRiskProfile } from "@/hooks/queries";
import { PageHeader, StatCard } from "@/components/shared";
import { RiskGauge } from "@/components/shared/badges";
import { AreaTrend, LineTrend } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent, timeAgo } from "@/lib/utils";
import type { RiskAlert } from "@/types";

const trustConfig: Record<string, { label: string; tone: string; ring: string; icon: typeof ShieldCheck }> = {
  trusted:   { label: "Trusted",   tone: "text-emerald-400", ring: "border-emerald-500/30 bg-emerald-500/8", icon: ShieldCheck },
  standard:  { label: "Standard",  tone: "text-sky-400",     ring: "border-sky-500/30 bg-sky-500/8",         icon: ShieldCheck },
  elevated:  { label: "Elevated",  tone: "text-amber-400",   ring: "border-amber-500/30 bg-amber-500/8",     icon: AlertTriangle },
  high_risk: { label: "High risk", tone: "text-rose-400",    ring: "border-rose-500/30 bg-rose-500/8",       icon: ShieldAlert },
};

const severityConfig: Record<RiskAlert["severity"], { tone: string; dot: string; label: string }> = {
  critical: { tone: "border-rose-500/30 bg-rose-500/8 text-rose-400",       dot: "bg-rose-500",    label: "Critical" },
  high:     { tone: "border-orange-500/30 bg-orange-500/8 text-orange-400", dot: "bg-orange-500",  label: "High" },
  medium:   { tone: "border-amber-500/30 bg-amber-500/8 text-amber-400",    dot: "bg-amber-500",   label: "Medium" },
  low:      { tone: "border-sky-500/30 bg-sky-500/8 text-sky-400",          dot: "bg-sky-500",     label: "Low" },
};

export default function RiskPage() {
  const { data: risk, isLoading } = useRiskProfile();

  const trust = risk ? trustConfig[risk.trustStatus] : trustConfig.standard;
  const TrustIcon = trust.icon;
  const scoreTone =
    !risk ? "text-muted-foreground"
    : risk.score < 30 ? "text-emerald-400"
    : risk.score < 60 ? "text-amber-400"
    : "text-rose-400";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Risk Center"
        description="Real-time fraud monitoring, alerts and trust posture for your merchant account."
        actions={
          <Badge variant="outline" className="gap-1.5 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Engine live
          </Badge>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !risk ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Risk score" value={risk.score} change={-3.0} icon={GaugeIcon} accent={risk.score < 30 ? "green" : risk.score < 60 ? "amber" : "rose"} format={(n) => Math.round(n).toString()} />
            <StatCard label="Rolling reserve" value={risk.reservePct} icon={Lock} accent="violet" format={(n) => formatPercent(n)} />
            <StatCard label="Chargeback rate" value={risk.chargebackRate} icon={RefreshCcw} accent="amber" format={(n) => formatPercent(n, 2)} />
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card className="relative h-full overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Trust status</p>
                  <div className={cn("rounded-lg p-1.5", trust.ring)}><TrustIcon className={cn("h-4 w-4", trust.tone)} /></div>
                </div>
                <p className={cn("mt-3 text-2xl font-semibold tracking-tight", trust.tone)}>{trust.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">posture · underwriting</p>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Gauge + trust banner + recommendations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-2">
            <h3 className="text-sm font-semibold">Live risk score</h3>
            <p className="text-xs text-muted-foreground">Composite fraud exposure · lower is better</p>
          </div>
          {!risk ? (
            <div className="flex h-56 items-center justify-center"><Skeleton className="h-40 w-40 rounded-full" /></div>
          ) : (
            <div className="flex flex-col items-center gap-3 pt-4">
              <RiskGauge score={risk.score} size={200} />
              <div className="grid w-full grid-cols-3 gap-2 pt-2 text-center">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Low</p>
                  <p className="text-[10px] text-emerald-400">0–29</p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Med</p>
                  <p className="text-[10px] text-amber-400">30–59</p>
                </div>
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/8 px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">High</p>
                  <p className="text-[10px] text-rose-400">60+</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          {!risk ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <>
              <div className={cn("flex items-center gap-3 rounded-xl border p-4", trust.ring)}>
                <TrustIcon className={cn("h-6 w-6 shrink-0", trust.tone)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Trust posture: {trust.label}</p>
                    <Badge variant="outline" className={cn("gap-1", trust.tone)}>
                      {risk.score < 30 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                      Score {risk.score}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Rolling reserve held at {formatPercent(risk.reservePct)} · chargeback rate {formatPercent(risk.chargebackRate, 2)} (card scheme threshold 1%).
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5" /> Recommendations
                </h4>
                <ol className="flex flex-col gap-2">
                  {(risk?.recommendations ?? []).map((rec, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2.5"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/12 text-xs font-semibold text-primary">{i + 1}</span>
                      <p className="text-sm text-foreground/90">{rec}</p>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold">Active alerts</h3>
            <Badge variant="outline" className="ml-1.5">{risk?.alerts.length ?? 0} open</Badge>
          </div>
          <Badge variant="outline" className="gap-1 border-amber-500/25 bg-amber-500/12 text-amber-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
            Monitoring
          </Badge>
        </div>
        <div className="flex flex-col divide-y divide-border/40">
          {!risk
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="px-5 py-4"><Skeleton className="h-14" /></div>)
            : (risk?.alerts ?? []).map((a) => {
                const sev = severityConfig[a.severity];
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 px-5 py-4 transition hover:bg-muted/20"
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", sev.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{a.title}</p>
                        <Badge variant="outline" className={cn("gap-1", sev.tone)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", sev.dot)} />
                          {sev.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </motion.div>
                );
              })}
        </div>
      </Card>

      {/* History charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Risk score history</h3>
              <p className="text-xs text-muted-foreground">Composite score · last 30 days</p>
            </div>
            <Badge variant="outline" className={cn("gap-1", scoreTone)}>
              <Activity className="h-3 w-3" /> {risk ? risk.score : "—"}
            </Badge>
          </div>
          {!risk ? <Skeleton className="h-56 w-full" /> : (
            <AreaTrend
              data={risk.history}
              dataKey="score"
              xKey="date"
              color="oklch(0.62 0.21 258)"
              height={240}
              formatter={(v) => Math.round(v).toString()}
            />
          )}
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Score vs chargebacks</h3>
              <p className="text-xs text-muted-foreground">Correlated 30-day trend</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Score</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> Chargebacks</span>
            </div>
          </div>
          {!risk ? <Skeleton className="h-56 w-full" /> : (
            <LineTrend
              data={risk.history}
              xKey="date"
              height={240}
              lines={[
                { key: "score", color: "oklch(0.62 0.21 258)", name: "Risk score" },
                { key: "chargebacks", color: "oklch(0.66 0.21 20)", name: "Chargebacks" },
              ]}
              formatter={(v) => v.toFixed(2)}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
