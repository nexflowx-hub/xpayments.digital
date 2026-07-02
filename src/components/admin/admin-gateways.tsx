"use client";

import * as React from "react";
import {
  Network, Server, Gauge, Pause, Settings2, Zap,
  TrendingUp, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/shared";
import { StatusBadge, Sparkline } from "@/components/shared/badges";
import { DonutChart, CHART_COLORS } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";

// ---- Mock gateway dataset ----
type GatewayStatus = "operational" | "degraded" | "paused" | "outage";

interface Gateway {
  id: string;
  name: string;
  status: GatewayStatus;
  uptime: number;
  volume: number;
  latency: number;
  region: string;
  traffic: number[];
}

const GATEWAYS: Gateway[] = [
  {
    id: "gw_xpayments",
    name: "xpayments",
    status: "operational",
    uptime: 99.99,
    volume: 8420000,
    latency: 42,
    region: "global",
    traffic: [62, 70, 68, 74, 80, 76, 84, 88, 92, 86, 90, 95],
  },
  {
    id: "gw_stripe_rail",
    name: "stripe-rail",
    status: "operational",
    uptime: 99.97,
    volume: 5180000,
    latency: 88,
    region: "global",
    traffic: [40, 44, 48, 52, 46, 50, 54, 58, 60, 56, 62, 64],
  },
  {
    id: "gw_adyen",
    name: "adyen",
    status: "operational",
    uptime: 99.95,
    volume: 3940000,
    latency: 71,
    region: "eu-west",
    traffic: [28, 30, 26, 34, 38, 36, 40, 44, 42, 46, 48, 50],
  },
  {
    id: "gw_checkout",
    name: "checkout.com",
    status: "degraded",
    uptime: 98.82,
    volume: 1260000,
    latency: 240,
    region: "us-east",
    traffic: [22, 24, 20, 18, 16, 14, 12, 10, 14, 12, 8, 6],
  },
  {
    id: "gw_wise",
    name: "wise",
    status: "operational",
    uptime: 99.91,
    volume: 720000,
    latency: 154,
    region: "global",
    traffic: [10, 12, 14, 12, 16, 18, 20, 18, 22, 24, 20, 22],
  },
  {
    id: "gw_pix_direct",
    name: "pix-direct",
    status: "operational",
    uptime: 99.98,
    volume: 2240000,
    latency: 38,
    region: "br-east",
    traffic: [30, 36, 42, 48, 52, 58, 62, 66, 70, 74, 78, 82],
  },
];

const statusColor: Record<GatewayStatus, string> = {
  operational: "var(--primary)",
  degraded: "#f59e0b",
  paused: "#94a3b8",
  outage: "#ef4444",
};

export default function AdminGatewaysPage() {
  const total = GATEWAYS.length;
  const operational = GATEWAYS.filter((g) => g.status === "operational").length;
  const totalVolume = GATEWAYS.reduce((s, g) => s + g.volume, 0);
  const avgLatency = Math.round(GATEWAYS.reduce((s, g) => s + g.latency, 0) / total);

  const trafficDonut = GATEWAYS.map((g) => ({ name: g.name, value: g.volume }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payment Gateways"
        description="Routing, health and volume across all processor rails."
        actions={
          <>
            <Button variant="outline" size="sm">Export</Button>
            <Button size="sm" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Add gateway</Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total gateways" value={total} icon={Network} accent="blue" />
        <StatCard label="Operational" value={operational} change={2.1} icon={Server} accent="green" format={(n) => `${Math.round(n)}/${total}`} />
        <StatCard label="Volume (30d)" value={totalVolume} change={8.4} icon={TrendingUp} accent="violet" format={(n) => formatCurrency(n, "EUR", { compact: true })} />
        <StatCard label="Avg latency" value={avgLatency} change={-4.2} icon={Gauge} accent="amber" format={(n) => `${Math.round(n)}ms`} />
      </div>

      {/* Gateways table + traffic donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Active rails</h3>
              <p className="text-xs text-muted-foreground">Processor connections and live traffic</p>
            </div>
            <Badge variant="outline" className="gap-1 border-emerald-500/25 bg-emerald-500/12 text-emerald-400">
              <ArrowUpRight className="h-3 w-3" /> {operational} of {total} healthy
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Gateway</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Uptime</th>
                  <th className="pb-2 text-right font-medium">Volume</th>
                  <th className="pb-2 text-right font-medium">Latency</th>
                  <th className="pb-2 font-medium">Region</th>
                  <th className="pb-2 font-medium">Traffic</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {GATEWAYS.map((g) => (
                  <tr key={g.id} className="border-b border-border/30 transition hover:bg-muted/30">
                    <td className="py-3">
                      <p className="font-mono text-xs font-semibold text-primary">{g.name}</p>
                      <p className="text-[10px] text-muted-foreground">{g.id}</p>
                    </td>
                    <td className="py-3"><StatusBadge status={g.status} /></td>
                    <td className="py-3 font-mono text-xs tabular-nums">{g.uptime.toFixed(2)}%</td>
                    <td className="py-3 text-right font-mono text-xs tabular-nums">{formatCurrency(g.volume, "EUR", { compact: true })}</td>
                    <td className={cn("py-3 text-right font-mono text-xs tabular-nums", g.latency > 200 ? "text-amber-400" : "text-foreground")}>{g.latency}ms</td>
                    <td className="py-3 text-xs text-muted-foreground">{g.region}</td>
                    <td className="py-3 w-24">
                      <div className="w-20">
                        <Sparkline data={g.traffic} color={statusColor[g.status]} height={28} />
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toast.info(`Gateway "${g.name}" paused`, { description: "In-flight traffic will drain over the next 30s." })}
                        >
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toast.message(`Opening configuration for "${g.name}"`)}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Traffic distribution</h3>
            <p className="text-xs text-muted-foreground">Volume share by gateway</p>
          </div>
          <DonutChart data={trafficDonut} height={280} formatter={(v) => formatCurrency(v, "EUR", { compact: true })} />
          <div className="mt-4 flex flex-col gap-2">
            {GATEWAYS.map((g, i) => (
              <div key={g.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="font-mono text-foreground">{g.name}</span>
                </div>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {((g.volume / totalVolume) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Routing policy strip */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Primary rail</p>
            <p className="mt-1 font-mono text-sm font-semibold text-primary">xpayments</p>
            <p className="text-[10px] text-muted-foreground">62% of traffic</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Failover order</p>
            <p className="mt-1 font-mono text-sm font-semibold">stripe → adyen → pix</p>
            <p className="text-[10px] text-muted-foreground">latency &gt; 500ms triggers</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Smart routing</p>
            <p className="mt-1 text-sm font-semibold text-emerald-400">Active</p>
            <p className="text-[10px] text-muted-foreground">cost + approval ML model</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Circuit breakers</p>
            <p className="mt-1 text-sm font-semibold">3 / {total} armed</p>
            <p className="text-[10px] text-muted-foreground">auto-disable on 5xx &gt; 5%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
