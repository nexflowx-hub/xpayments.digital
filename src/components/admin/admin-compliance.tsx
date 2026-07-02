"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, FileSearch, ScrollText, Lock, CheckCircle2, AlertTriangle,
  ShieldAlert, ClipboardCheck,
} from "lucide-react";
import { useAdminKyc } from "@/hooks/queries";
import { PageHeader, StatCard, fadeUp } from "@/components/shared";
import { DonutChart } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, timeAgo } from "@/lib/utils";

// ---- Mock sanctions screenings ----
interface Screening {
  id: string;
  name: string;
  matchedList: string;
  confidence: number;
  status: "cleared" | "review" | "blocked";
  timestamp: string;
}

const SCREENINGS: Screening[] = [
  { id: "scr_4821", name: "Aldo Petrov", matchedList: "OFAC SDN", confidence: 92, status: "blocked", timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
  { id: "scr_4818", name: "Marina Costa", matchedList: "EU Consolidated", confidence: 41, status: "review", timestamp: new Date(Date.now() - 1000 * 60 * 64).toISOString() },
  { id: "scr_4815", name: "James Whitmore", matchedList: "—", confidence: 0, status: "cleared", timestamp: new Date(Date.now() - 1000 * 60 * 122).toISOString() },
  { id: "scr_4810", name: "Yuki Tanaka", matchedList: "—", confidence: 0, status: "cleared", timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: "scr_4808", name: "Mohammed Al-Rashid", matchedList: "UK HMT", confidence: 68, status: "review", timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
  { id: "scr_4804", name: "Sophia Lindqvist", matchedList: "—", confidence: 0, status: "cleared", timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString() },
  { id: "scr_4801", name: "Dmitri Volkov", matchedList: "OFAC SDN", confidence: 88, status: "blocked", timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString() },
];

// ---- Mock audit log ----
interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  resource: string;
  ip: string;
  timestamp: string;
}

const AUDIT: AuditEvent[] = [
  { id: "aud_9201", actor: "admin@xpayments.digital", action: "merchant.frozen", resource: "merch_8421 (Acme Pay)", ip: "10.4.2.18", timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString() },
  { id: "aud_9198", actor: "compliance@xpayments.digital", action: "api_key.revoked", resource: "key_live_8821", ip: "10.4.2.51", timestamp: new Date(Date.now() - 1000 * 60 * 34).toISOString() },
  { id: "aud_9194", actor: "treasury@xpayments.digital", action: "payout.approved", resource: "payout_22481 — €48,200.00", ip: "10.4.2.33", timestamp: new Date(Date.now() - 1000 * 60 * 72).toISOString() },
  { id: "aud_9191", actor: "admin@xpayments.digital", action: "kyc.decision.approved", resource: "kyc_1042 (Nordic Retail AB)", ip: "10.4.2.18", timestamp: new Date(Date.now() - 1000 * 60 * 108).toISOString() },
  { id: "aud_9188", actor: "system", action: "risk.threshold.updated", resource: "velocity.rule.v3", ip: "internal", timestamp: new Date(Date.now() - 1000 * 60 * 144).toISOString() },
  { id: "aud_9184", actor: "compliance@xpayments.digital", action: "sanctions.blocked", resource: "scr_4821 (Aldo Petrov)", ip: "10.4.2.51", timestamp: new Date(Date.now() - 1000 * 60 * 192).toISOString() },
  { id: "aud_9180", actor: "admin@xpayments.digital", action: "merchant.suspended", resource: "merch_3094 (Bolt Logistics)", ip: "10.4.2.18", timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
  { id: "aud_9177", actor: "treasury@xpayments.digital", action: "wallet.adjusted", resource: "wlt_eur_8821 — +€2,400.00", ip: "10.4.2.33", timestamp: new Date(Date.now() - 1000 * 60 * 318).toISOString() },
];

const actionColor: Record<string, string> = {
  blocked: "text-rose-400",
  suspended: "text-rose-400",
  frozen: "text-sky-400",
  revoked: "text-amber-400",
  approved: "text-emerald-400",
  updated: "text-violet-400",
  adjusted: "text-violet-400",
};

export default function AdminCompliancePage() {
  const { data: kycResp, isLoading } = useAdminKyc();
  const kyc = kycResp?.data ?? [];

  const pending = kyc.filter((k) => k.status === "pending").length;
  const approved = kyc.filter((k) => k.status === "approved").length;
  const rejected = kyc.filter((k) => k.status === "rejected").length;
  const total = kyc.length || 1;
  const approvalRate = (approved / total) * 100;

  const kycDonut = [
    { name: "Approved", value: approved || 12 },
    { name: "Pending", value: pending || 5 },
    { name: "Rejected", value: rejected || 3 },
  ];

  const blockedScreenings = SCREENINGS.filter((s) => s.status === "blocked").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Compliance"
        description="KYC, AML/sanctions screening, audit trail and certification posture."
        actions={
          <>
            <Button variant="outline" size="sm">Export SOC2 report</Button>
            <Button size="sm" className="gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" /> Run audit</Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="KYC approval rate" value={approvalRate} change={2.4} icon={ShieldCheck} accent="green" format={(n) => `${n.toFixed(1)}%`} />
            <StatCard label="Sanctions screened (24h)" value={1248} change={4.1} icon={FileSearch} accent="blue" format={(n) => `${Math.round(n)}`} />
            <StatCard label="Audit events (24h)" value={AUDIT.length * 6 + 142} change={11.8} icon={ScrollText} accent="violet" format={(n) => `${Math.round(n)}`} />
            <StatCard label="Blocked screenings" value={blockedScreenings} change={-1.2} icon={ShieldAlert} accent="rose" format={(n) => `${Math.round(n)}`} />
          </>
        )}
      </div>

      {/* KYC + PCI/SOC2 status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">KYC pipeline</h3>
            <p className="text-xs text-muted-foreground">Review queue breakdown</p>
          </div>
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <>
              <DonutChart data={kycDonut} height={200} formatter={(v) => `${Math.round(v)}`} />
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Approved</p>
                  <p className="font-mono text-lg font-semibold text-emerald-400">{approved || 12}</p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Pending</p>
                  <p className="font-mono text-lg font-semibold text-amber-400">{pending || 5}</p>
                </div>
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/8 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Rejected</p>
                  <p className="font-mono text-lg font-semibold text-rose-400">{rejected || 3}</p>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Certification posture</h3>
            <p className="text-xs text-muted-foreground">Compliance program status</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CertCard
              icon={Lock}
              name="PCI DSS"
              level="Level 1"
              status="Certified"
              lastAudit="2025-08-14"
              nextAudit="2026-08-14"
              color="emerald"
            />
            <CertCard
              icon={ShieldCheck}
              name="SOC 2 Type II"
              level="Trust Services"
              status="Certified"
              lastAudit="2025-06-02"
              nextAudit="2026-06-02"
              color="emerald"
            />
            <CertCard
              icon={FileSearch}
              name="ISO 27001"
              level="ISMS"
              status="Certified"
              lastAudit="2025-03-22"
              nextAudit="2026-03-22"
              color="emerald"
            />
            <CertCard
              icon={AlertTriangle}
              name="PSD2 SCA"
              level="RTS"
              status="In review"
              lastAudit="2025-09-30"
              nextAudit="2026-01-15"
              color="amber"
            />
          </div>
        </Card>
      </div>

      {/* Sanctions screening + audit log */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Recent sanctions screenings</h3>
              <p className="text-xs text-muted-foreground">AML watchlist matches</p>
            </div>
            <Badge variant="outline" className="border-rose-500/25 bg-rose-500/12 text-rose-400">{blockedScreenings} blocked</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">List</th>
                  <th className="pb-2 text-right font-medium">Confidence</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {SCREENINGS.map((s) => (
                  <tr key={s.id} className="border-b border-border/30 transition hover:bg-muted/30">
                    <td className="py-2.5">
                      <p className="text-xs font-medium">{s.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{s.id}</p>
                    </td>
                    <td className="py-2.5 font-mono text-[11px] text-muted-foreground">{s.matchedList}</td>
                    <td className={cn("py-2.5 text-right font-mono text-xs tabular-nums", s.confidence > 80 ? "text-rose-400" : s.confidence > 50 ? "text-amber-400" : "text-muted-foreground")}>
                      {s.confidence > 0 ? `${s.confidence}%` : "—"}
                    </td>
                    <td className="py-2.5">
                      {s.status === "cleared" ? (
                        <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/12 text-[10px] text-emerald-400">Cleared</Badge>
                      ) : s.status === "review" ? (
                        <Badge variant="outline" className="border-amber-500/25 bg-amber-500/12 text-[10px] text-amber-400">Review</Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-500/25 bg-rose-500/12 text-[10px] text-rose-400">Blocked</Badge>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-[11px] text-muted-foreground">{timeAgo(s.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Audit log</h3>
              <p className="text-xs text-muted-foreground">Privileged operator actions</p>
            </div>
            <Badge variant="outline" className="gap-1 border-border/60 bg-muted/30 text-[10px] font-mono">
              <Lock className="h-3 w-3" /> immutable
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            {AUDIT.map((a) => {
              const verb = a.action.split(".").pop() ?? a.action;
              return (
                <div key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/30">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium text-foreground">{a.actor}</span>{" "}
                      <span className={cn("font-mono", actionColor[verb] ?? "text-foreground")}>{a.action}</span>{" "}
                      <span className="text-muted-foreground">on</span>{" "}
                      <span className="font-mono text-primary">{a.resource}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(a.timestamp, { withTime: true })} · {a.ip}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CertCard({
  icon: Icon, name, level, status, lastAudit, nextAudit, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string; level: string; status: string; lastAudit: string; nextAudit: string; color: "emerald" | "amber";
}) {
  const colorMap = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: CheckCircle2 },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: AlertTriangle },
  };
  const c = colorMap[color];
  const StatusIcon = c.icon;
  return (
    <motion.div {...fadeUp} className={cn("rounded-xl border bg-background/40 p-4", c.border)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("rounded-lg p-1.5", c.bg)}>
            <Icon className={cn("h-4 w-4", c.text)} />
          </div>
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-[10px] text-muted-foreground">{level}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("gap-1 text-[10px]", c.border, c.bg, c.text)}>
          <StatusIcon className="h-3 w-3" /> {status}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <p className="text-muted-foreground">Last audit</p>
          <p className="font-mono">{formatDate(lastAudit)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Next review</p>
          <p className="font-mono">{formatDate(nextAudit)}</p>
        </div>
      </div>
    </motion.div>
  );
}
