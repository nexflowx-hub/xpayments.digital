"use client";

import * as React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CURRENCIES, PAYMENT_METHODS } from "@/config";
import { PAYMENT_LOGOS } from "@/components/shared/payment-logos";
import type { CurrencyCode, PaymentMethod, TxStatus } from "@/types";
import { AlertTriangle, CheckCircle2, Clock, XCircle, RefreshCw, ShieldAlert, FileText } from "lucide-react";

// ---- StatusBadge ----
const statusConfig: Record<
  string,
  { label: string; className: string; icon?: React.ComponentType<{ className?: string }> }
> = {
  succeeded: { label: "Succeeded", className: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  pending: { label: "Pending", className: "bg-amber-500/12 text-amber-400 border-amber-500/25", icon: Clock },
  failed: { label: "Failed", className: "bg-rose-500/12 text-rose-400 border-rose-500/25", icon: XCircle },
  refunded: { label: "Refunded", className: "bg-sky-500/12 text-sky-400 border-sky-500/25", icon: RefreshCw },
  disputed: { label: "Disputed", className: "bg-orange-500/12 text-orange-400 border-orange-500/25", icon: ShieldAlert },
  authorized: { label: "Authorized", className: "bg-violet-500/12 text-violet-400 border-violet-500/25", icon: FileText },
  active: { label: "Active", className: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground border-border" },
  paused: { label: "Paused", className: "bg-amber-500/12 text-amber-400 border-amber-500/25", icon: Clock },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  void: { label: "Void", className: "bg-muted text-muted-foreground border-border" },
  open: { label: "Open", className: "bg-sky-500/12 text-sky-400 border-sky-500/25", icon: Clock },
  overdue: { label: "Overdue", className: "bg-rose-500/12 text-rose-400 border-rose-500/25", icon: AlertTriangle },
  paid: { label: "Paid", className: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  trialing: { label: "Trialing", className: "bg-violet-500/12 text-violet-400 border-violet-500/25", icon: Clock },
  past_due: { label: "Past due", className: "bg-rose-500/12 text-rose-400 border-rose-500/25", icon: AlertTriangle },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground border-border" },
  frozen: { label: "Frozen", className: "bg-sky-500/12 text-sky-400 border-sky-500/25", icon: ShieldAlert },
  suspended: { label: "Suspended", className: "bg-rose-500/12 text-rose-400 border-rose-500/25", icon: XCircle },
  approved: { label: "Approved", className: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-rose-500/12 text-rose-400 border-rose-500/25", icon: XCircle },
  not_submitted: { label: "Not submitted", className: "bg-muted text-muted-foreground border-border" },
  operational: { label: "Operational", className: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  degraded: { label: "Degraded", className: "bg-amber-500/12 text-amber-400 border-amber-500/25", icon: AlertTriangle },
  outage: { label: "Outage", className: "bg-rose-500/12 text-rose-400 border-rose-500/25", icon: XCircle },
  disabled: { label: "Disabled", className: "bg-muted text-muted-foreground border-border" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = statusConfig[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", cfg.className, className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {cfg.label}
    </Badge>
  );
}

// ---- CurrencyBadge ----
export function CurrencyBadge({ currency, amount, compact }: { currency: CurrencyCode; amount: number; compact?: boolean }) {
  const c = CURRENCIES.find((x) => x.code === currency);
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums">
      <span className="text-xs text-muted-foreground">{c?.flag}</span>
      {formatCurrency(amount, currency, { compact })}
    </span>
  );
}

// ---- MethodBadge ----
export function MethodBadge({ method }: { method: PaymentMethod }) {
  const labels: Record<string, string> = {
    visa: "Visa", mastercard: "Mastercard", amex: "Amex", pix: "Pix",
    mbway: "MBWay", apple_pay: "Apple Pay", google_pay: "Google Pay",
    crypto: "Crypto", sepa: "SEPA", wise: "Wise", bizum: "Bizum",
  };
  const Logo = PAYMENT_LOGOS[method];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2 py-1">
      {Logo ? <Logo /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />}
      <span className="text-xs font-medium text-foreground">{labels[method] ?? method}</span>
    </span>
  );
}

// ---- JsonViewer ----
export function JsonViewer({ data, className }: { data: unknown; className?: string }) {
  const json = React.useMemo(
    () => JSON.stringify(data, null, 2),
    [data]
  );
  const highlighted = React.useMemo(() => highlightJson(json), [json]);
  return (
    <pre
      className={cn(
        "scrollbar-thin overflow-auto rounded-lg border border-border/60 bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-200",
        className
      )}
    >
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}

function highlightJson(json: string) {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "text-emerald-300"; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) cls = "text-sky-300"; // key
          else cls = "text-amber-200"; // string
        } else if (/true|false/.test(match)) cls = "text-violet-300";
        else if (/null/.test(match)) cls = "text-rose-300";
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

// ---- Sparkline ----
export function Sparkline({
  data,
  color = "var(--primary)",
  className,
  height = 36,
}: {
  data: number[];
  color?: string;
  className?: string;
  height?: number;
}) {
  if (!data.length) return null;
  const w = 120;
  const h = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  const id = React.useId();
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full", className)} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---- RiskGauge ----
export function RiskGauge({ score, size = 160 }: { score: number; size?: number }) {
  const radius = size / 2 - 14;
  const circ = Math.PI * radius; // half circle
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color =
    score < 30 ? "#10b981" : score < 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path
          d={`M 14 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 14} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/40"
          strokeLinecap="round"
        />
        <path
          d={`M 14 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 14} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="-mt-10 flex flex-col items-center">
        <span className="text-3xl font-semibold" style={{ color }}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-muted-foreground">Risk score</span>
      </div>
    </div>
  );
}
