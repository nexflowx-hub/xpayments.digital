"use client";

import * as React from "react";
import {
  Terminal, Search, Download, Pause, Play, FileText, Filter,
} from "lucide-react";
import { PageHeader } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { JsonViewer } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  requestId: string;
  meta?: Record<string, unknown>;
}

const SERVICES = ["payments", "wallets", "risk", "webhooks", "kyc", "fx", "auth", "settlement"];

const TEMPLATES: { level: LogLevel; service: string; message: string }[] = [
  { level: "info", service: "payments", message: "Payment txn_{id} captured for €{amt}" },
  { level: "info", service: "payments", message: "Authorization auth_{id} approved via xpayments rail" },
  { level: "info", service: "wallets", message: "Wallet {wlt} credited €{amt} from settlement batch" },
  { level: "warn", service: "webhooks", message: "Webhook delivery to https://hooks.merchant.io/payments failed (502) — retry 2/5" },
  { level: "error", service: "webhooks", message: "Webhook delivery exhausted retries for evt_{id}, moved to DLQ" },
  { level: "info", service: "risk", message: "Risk score computed for txn_{id}: {score}/100 (approved)" },
  { level: "warn", service: "risk", message: "Velocity threshold exceeded for ip 192.168.{oct}.{oct} — flagged for review" },
  { level: "error", service: "risk", message: "Sanctions watchlist match (90% confidence) on customer cus_{id} — blocking payout" },
  { level: "info", service: "kyc", message: "KYC submission kyc_{id} queued for manual review" },
  { level: "info", service: "fx", message: "FX rate EUR→USD updated to {rate} (provider: ECB+oanda)" },
  { level: "warn", service: "fx", message: "Upstream provider oanda returned 429 — backing off 2s" },
  { level: "info", service: "auth", message: "OAuth token issued for merchant acct_{id} (scopes: read, write)" },
  { level: "error", service: "auth", message: "Refresh token rotation failed for session sess_{id} — re-login required" },
  { level: "info", service: "settlement", message: "Settlement batch batch_{id} settled: {cnt} transactions, €{amt} total" },
  { level: "debug", service: "payments", message: "Routing decision: xpayments (cost {cost}€, approval 97.8%) chosen over stripe" },
  { level: "debug", service: "wallets", message: "Balance check passed for wlt_{id} — available €{amt}" },
  { level: "warn", service: "payments", message: "Rate limit triggered for ip 10.0.{oct}.{oct} — 429 returned" },
  { level: "info", service: "webhooks", message: "Webhook evt_{id} delivered to https://api.example.com/hook (200, 142ms)" },
  { level: "error", service: "payments", message: "Gateway xpayments returned 502 for txn_{id} — failover to stripe initiated" },
  { level: "debug", service: "risk", message: "ML model v2.4 inference completed in 38ms for txn_{id}" },
];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function ri(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function buildLogs(): LogEntry[] {
  const out: LogEntry[] = [];
  for (let i = 0; i < 40; i++) {
    const t = TEMPLATES[i % TEMPLATES.length];
    const msg = t.message
      .replace("{id}", String(ri(100000, 999999)))
      .replace("{amt}", `${ri(10, 4900)}.${ri(10, 99)}`)
      .replace("{wlt}", `wlt_${ri(1000, 9999)}`)
      .replace("{score}", String(ri(4, 78)))
      .replace("{oct}", String(ri(2, 250)))
      .replace("{rate}", `${ri(105, 115)}.${ri(100, 999)}`)
      .replace("{cnt}", String(ri(12, 842)))
      .replace("{cost}", `${ri(5, 48)}.${ri(10, 99)}`);
    const ts = new Date(Date.now() - i * ri(8, 90) * 1000).toISOString();
    out.push({
      id: `log_${i.toString().padStart(4, "0")}`,
      timestamp: ts,
      level: t.level,
      service: t.service,
      message: msg,
      requestId: `req_${ri(100000, 999999)}`,
      meta: {
        service: t.service,
        level: t.level,
        requestId: `req_${ri(100000, 999999)}`,
        host: `xp-${t.service}-${ri(1, 8).toString().padStart(2, "0")}.eu-west-1`,
        pid: ri(1000, 99999),
        v: "2.4.1",
        region: "eu-west-1",
      },
    });
  }
  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const levelCfg: Record<LogLevel, { label: string; cls: string; dot: string }> = {
  info: { label: "INFO", cls: "border-sky-500/25 bg-sky-500/12 text-sky-400", dot: "bg-sky-400" },
  warn: { label: "WARN", cls: "border-amber-500/25 bg-amber-500/12 text-amber-400", dot: "bg-amber-400" },
  error: { label: "ERROR", cls: "border-rose-500/25 bg-rose-500/12 text-rose-400", dot: "bg-rose-400" },
  debug: { label: "DEBUG", cls: "border-border bg-muted/40 text-muted-foreground", dot: "bg-muted-foreground" },
};

const TIME_RANGES = ["Live", "Last 15m", "Last 1h", "Last 6h", "Last 24h"];

export default function AdminLogsPage() {
  const t = useT();
  const allLogs = React.useMemo(buildLogs, []);
  const [search, setSearch] = React.useState("");
  const [level, setLevel] = React.useState("all");
  const [service, setService] = React.useState("all");
  const [range, setRange] = React.useState("Live");
  const [tailing, setTailing] = React.useState(true);
  const [selected, setSelected] = React.useState<LogEntry | null>(null);

  const filtered = React.useMemo(() => {
    return allLogs.filter((l) => {
      if (level !== "all" && l.level !== level) return false;
      if (service !== "all" && l.service !== service) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.message.toLowerCase().includes(q) && !l.requestId.toLowerCase().includes(q) && !l.service.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allLogs, level, service, search]);

  const counts = React.useMemo(() => ({
    total: allLogs.length,
    error: allLogs.filter((l) => l.level === "error").length,
    warn: allLogs.filter((l) => l.level === "warn").length,
    info: allLogs.filter((l) => l.level === "info").length,
  }), [allLogs]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (tailing && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [filtered, tailing]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.adminLogs")}
        description="Live platform log stream — search, filter and inspect raw events."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
            <Button
              variant={tailing ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setTailing((v) => !v)}
            >
              {tailing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {tailing ? "Pause tail" : "Resume tail"}
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search message, request ID, service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-9 w-[120px] text-xs"><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All levels</SelectItem>
                <SelectItem value="info" className="text-xs">Info</SelectItem>
                <SelectItem value="warn" className="text-xs">Warn</SelectItem>
                <SelectItem value="error" className="text-xs">Error</SelectItem>
                <SelectItem value="debug" className="text-xs">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue placeholder="Service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All services</SelectItem>
                {SERVICES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-9 w-[110px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {tailing ? "Tailing live stream" : "Tail paused"}
          </span>
          <span>Showing <span className="font-mono text-foreground">{filtered.length}</span> / {counts.total} entries</span>
          <span className="text-rose-400">{counts.error} errors</span>
          <span className="text-amber-400">{counts.warn} warnings</span>
        </div>
      </Card>

      {/* Log stream */}
      <Card className="border-border/60 bg-card/60 p-0 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs font-semibold">xp-platform.log</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">eu-west-1 · prod</span>
        </div>
        <div ref={scrollRef} className="scrollbar-thin max-h-[560px] overflow-y-auto">
          {filtered.map((l) => {
            const cfg = levelCfg[l.level];
            return (
              <button
                key={l.id}
                onClick={() => setSelected(l)}
                className="flex w-full items-start gap-3 border-b border-border/30 px-4 py-2 text-left font-mono text-xs transition hover:bg-muted/40"
              >
                <span className="shrink-0 text-muted-foreground/80 tabular-nums">
                  {new Date(l.timestamp).toISOString().slice(11, 19)}
                </span>
                <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold", cfg.cls)}>{cfg.label}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-violet-400">{l.service}</span>
                <span className="flex-1 break-words text-foreground/90">{l.message}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{l.requestId}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center font-mono text-xs text-muted-foreground">
              No log entries match the current filters.
            </div>
          )}
        </div>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-base">
              {selected && (
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", levelCfg[selected.level].cls)}>
                  {levelCfg[selected.level].label}
                </span>
              )}
              <span className="text-primary">{selected?.service}</span>
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {selected?.requestId} · {selected && formatDate(selected.timestamp, { withTime: true })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Message</p>
              <p className="font-mono text-xs text-foreground">{selected?.message}</p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3 w-3" /> Full event payload
              </p>
              {selected && (
                <JsonViewer
                  data={{
                    id: selected.id,
                    timestamp: selected.timestamp,
                    level: selected.level,
                    service: selected.service,
                    message: selected.message,
                    requestId: selected.requestId,
                    ...selected.meta,
                  }}
                  className="max-h-[360px]"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
