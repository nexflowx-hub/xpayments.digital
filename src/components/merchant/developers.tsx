"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Code2, Terminal, Copy, Play, Loader2, BookOpen, KeyRound,
  Bell, AlertTriangle, ListOrdered, ShieldCheck, Zap, Clock,
  ExternalLink, FileCode2, ChevronRight,
} from "lucide-react";
import { PageHeader, fadeUp } from "@/components/shared";
import { JsonViewer } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { sdkSnippets } from "@/lib/api/mock";
import { cn, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const SNIPPET_LANGS: { id: "curl" | "node" | "python" | "php" | "go"; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
  { id: "go", label: "Go" },
];

const KEYWORDS = new Set([
  "import", "from", "const", "let", "var", "function", "return", "async",
  "await", "new", "export", "default", "class", "if", "else", "for", "while",
  "func", "package", "require", "echo", "print", "nil", "true", "false",
  "null", "None", "True", "False", "def", "public", "private", "void",
  "int", "string", "bool", "context", "os", "fmt",
]);

function highlightCode(code: string): React.ReactNode {
  const tokens: { t: "comment" | "string" | "keyword" | "number" | "text"; v: string }[] = [];
  let i = 0;
  while (i < code.length) {
    const c = code[i];
    const two = code.slice(i, i + 2);
    if (two === "//" || c === "#") {
      let j = i;
      while (j < code.length && code[j] !== "\n") j++;
      tokens.push({ t: "comment", v: code.slice(i, j) });
      i = j;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      let j = i + 1;
      while (j < code.length && code[j] !== q) {
        if (code[j] === "\\") j++;
        j++;
      }
      j++;
      tokens.push({ t: "string", v: code.slice(i, Math.min(j, code.length)) });
      i = Math.min(j, code.length);
      continue;
    }
    if (/\d/.test(c) && (i === 0 || !/[a-zA-Z_]/.test(code[i - 1]))) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      tokens.push({ t: "number", v: code.slice(i, j) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_$]/.test(c)) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const w = code.slice(i, j);
      tokens.push({ t: KEYWORDS.has(w) ? "keyword" : "text", v: w });
      i = j;
      continue;
    }
    tokens.push({ t: "text", v: c });
    i++;
  }
  const colorMap: Record<string, string> = {
    comment: "text-zinc-500 italic",
    string: "text-emerald-300",
    keyword: "text-sky-300",
    number: "text-amber-300",
    text: "text-zinc-300",
  };
  return tokens.map((tk, idx) => (
    <span key={idx} className={colorMap[tk.t]}>{tk.v}</span>
  ));
}

function TerminalCard({ code }: { code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-[#0b0e14]/90 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-rose-500/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        <span className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" />
          xpayments-shell
        </span>
      </div>
      <pre className="scrollbar-thin max-h-[420px] overflow-auto px-5 py-4 font-mono text-[13px] leading-relaxed">
        <code>{highlightCode(code)}</code>
      </pre>
    </div>
  );
}

// ---- API Explorer ----
const ENDPOINTS = [
  { id: "POST /payments", label: "POST /payments", method: "POST", path: "/payments" },
  { id: "GET /transactions", label: "GET /transactions", method: "GET", path: "/transactions" },
  { id: "POST /wallets/swap", label: "POST /wallets/swap", method: "POST", path: "/wallets/swap" },
  { id: "POST /payouts", label: "POST /payouts", method: "POST", path: "/payouts" },
  { id: "GET /wallets", label: "GET /wallets", method: "GET", path: "/wallets" },
  { id: "POST /webhooks", label: "POST /webhooks", method: "POST", path: "/webhooks" },
];

const PRESETS: Record<string, string> = {
  "POST /payments": JSON.stringify(
    {
      amount: 4200,
      currency: "EUR",
      method: "pix",
      customer: "cus_8af2c1",
      description: "Pro Plan — Annual",
      capture: true,
    },
    null,
    2,
  ),
  "GET /transactions": JSON.stringify({ limit: 5, status: "succeeded" }, null, 2),
  "POST /wallets/swap": JSON.stringify(
    { from: "USD", to: "EUR", amount: 1500 },
    null,
    2,
  ),
  "POST /payouts": JSON.stringify(
    { currency: "EUR", amount: 1800, beneficiary: "ben_92fa" },
    null,
    2,
  ),
  "GET /wallets": JSON.stringify({}, null, 2),
  "POST /webhooks": JSON.stringify(
    { url: "https://api.merchant.io/xp/events", events: ["payment.succeeded"] },
    null,
    2,
  ),
};

function mockResponse(endpoint: string): unknown {
  const id = "pay_" + Math.random().toString(36).slice(2, 10);
  const now = new Date().toISOString();
  switch (endpoint) {
    case "POST /payments":
      return {
        id,
        object: "payment",
        amount: 4200,
        currency: "EUR",
        status: "succeeded",
        method: "pix",
        customer: "cus_8af2c1",
        description: "Pro Plan — Annual",
        reference: "REF" + Math.floor(100000 + Math.random() * 900000),
        risk: { score: 12, decision: "approved" },
        fee: 126,
        net: 4074,
        createdAt: now,
      };
    case "GET /transactions":
      return {
        object: "list",
        url: "/v1/transactions",
        has_more: true,
        data: Array.from({ length: 3 }).map((_, i) => ({
          id: "txn_" + Math.random().toString(36).slice(2, 9),
          reference: "REF" + (100000 + i * 137),
          amount: 2400 + i * 800,
          currency: "EUR",
          status: "succeeded",
          method: "pix",
          createdAt: now,
        })),
      };
    case "POST /wallets/swap":
      return {
        id: "swp_" + Math.random().toString(36).slice(2, 9),
        object: "swap",
        from: "USD",
        to: "EUR",
        amount: 1500,
        rate: 0.918,
        received: 1377.0,
        fee: 4.5,
        status: "completed",
        createdAt: now,
      };
    case "POST /payouts":
      return {
        id: "po_" + Math.random().toString(36).slice(2, 9),
        object: "payout",
        amount: 1800,
        currency: "EUR",
        beneficiary: "ben_92fa",
        reference: "PO" + Math.floor(100000 + Math.random() * 900000),
        status: "pending",
        estimatedArrival: "2025-01-18T09:00:00Z",
        createdAt: now,
      };
    case "GET /wallets":
      return {
        object: "list",
        data: [
          { id: "wlt_eur", currency: "EUR", balance: 842310.55, available: 821940.12 },
          { id: "wlt_usd", currency: "USD", balance: 412980.22, available: 398410.04 },
          { id: "wlt_brl", currency: "BRL", balance: 1298400.0, available: 1280000.0 },
        ],
      };
    case "POST /webhooks":
      return {
        id: "wh_" + Math.random().toString(36).slice(2, 9),
        object: "webhook",
        url: "https://api.merchant.io/xp/events",
        events: ["payment.succeeded"],
        status: "active",
        secret: "whsec_" + Math.random().toString(36).slice(2, 14),
        createdAt: now,
      };
    default:
      return { ok: true };
  }
}

// ---- Documentation cards ----
const DOC_CARDS = [
  { icon: Zap, title: "Quickstart", desc: "Make your first payment in under 5 minutes.", href: "#" },
  { icon: KeyRound, title: "Authentication", desc: "Bearer tokens, live & test keys, scopes.", href: "#" },
  { icon: Bell, title: "Webhooks", desc: "Signatures, retries, idempotent delivery.", href: "#" },
  { icon: AlertTriangle, title: "Errors", desc: "HTTP status codes & error code reference.", href: "#" },
  { icon: ListOrdered, title: "Pagination", desc: "Cursor-based pagination for list endpoints.", href: "#" },
  { icon: ShieldCheck, title: "Idempotency", desc: "Safe retries with Idempotency-Key headers.", href: "#" },
];

// ---- Mock API logs ----
const API_LOGS = [
  { time: "12:48:21", method: "POST", endpoint: "/v1/payments", status: 200, latency: 184 },
  { time: "12:47:55", method: "GET", endpoint: "/v1/transactions", status: 200, latency: 92 },
  { time: "12:47:12", method: "POST", endpoint: "/v1/wallets/swap", status: 201, latency: 240 },
  { time: "12:46:03", method: "POST", endpoint: "/v1/payments", status: 402, latency: 156 },
  { time: "12:45:38", method: "GET", endpoint: "/v1/wallets", status: 200, latency: 64 },
  { time: "12:44:50", method: "POST", endpoint: "/v1/payouts", status: 200, latency: 318 },
  { time: "12:43:22", method: "POST", endpoint: "/v1/webhooks", status: 201, latency: 78 },
  { time: "12:42:09", method: "GET", endpoint: "/v1/transactions/txn_8af2c1", status: 404, latency: 41 },
];

function methodColor(m: string) {
  return {
    GET: "bg-sky-500/12 text-sky-300 border-sky-500/25",
    POST: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
    PUT: "bg-amber-500/12 text-amber-300 border-amber-500/25",
    DELETE: "bg-rose-500/12 text-rose-300 border-rose-500/25",
  }[m] ?? "bg-muted text-muted-foreground border-border";
}

function statusColor(s: number) {
  if (s >= 200 && s < 300) return "text-emerald-400";
  if (s >= 400 && s < 500) return "text-amber-400";
  return "text-rose-400";
}

export default function DevelopersPage() {
  const [activeLang, setActiveLang] = React.useState<"curl" | "node" | "python" | "php" | "go">("node");
  const [endpoint, setEndpoint] = React.useState("POST /payments");
  const [body, setBody] = React.useState(PRESETS["POST /payments"]);
  const [sending, setSending] = React.useState(false);
  const [response, setResponse] = React.useState<unknown>(null);
  const [respStatus, setRespStatus] = React.useState<number | null>(null);

  React.useEffect(() => {
    setBody(PRESETS[endpoint] ?? "{}");
  }, [endpoint]);

  const onCopy = (text: string, label = "Copied") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast.success(label));
    } else {
      toast.success(label);
    }
  };

  const sendRequest = () => {
    setSending(true);
    setResponse(null);
    setRespStatus(null);
    setTimeout(() => {
      // Validate JSON; if invalid, return 400
      try {
        JSON.parse(body);
      } catch {
        setResponse({ error: { type: "invalid_request_error", message: "Request body is not valid JSON." } });
        setRespStatus(400);
        setSending(false);
        return;
      }
      setResponse(mockResponse(endpoint));
      setRespStatus(endpoint.startsWith("POST") && endpoint.includes("payments") ? 201 : 200);
      setSending(false);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Developers"
        description="SDKs, API explorer, and live request logs."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href="#" className="flex items-center gap-1.5">
              API reference <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        }
      />

      <motion.div {...fadeUp} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* SDK & Code examples */}
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Code2 className="h-4 w-4 text-primary" />
                SDK & code examples
              </h3>
              <p className="text-xs text-muted-foreground">Create a 42 EUR Pix payment in your language.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onCopy(sdkSnippets[activeLang], "Snippet copied")}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
          <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as typeof activeLang)}>
            <TabsList className="mb-3 flex-wrap">
              {SNIPPET_LANGS.map((l) => (
                <TabsTrigger key={l.id} value={l.id} className="gap-1.5">
                  {l.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {SNIPPET_LANGS.map((l) => (
              <TabsContent key={l.id} value={l.id}>
                <TerminalCard code={sdkSnippets[l.id]} />
              </TabsContent>
            ))}
          </Tabs>
        </Card>

        {/* API Explorer */}
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Play className="h-4 w-4 text-primary" />
              API Explorer
            </h3>
            <p className="text-xs text-muted-foreground">Send a sandbox request and inspect the response.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Endpoint</label>
              <Select value={endpoint} onValueChange={setEndpoint}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINTS.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className={cn("mr-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold", methodColor(e.method))}>
                        {e.method}
                      </span>
                      <span className="font-mono">{e.path}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Request body</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck={false}
                className="scrollbar-thin h-32 resize-none bg-[#0b0e14]/60 font-mono text-xs text-zinc-200"
              />
            </div>

            <Button onClick={sendRequest} disabled={sending} className="gap-1.5">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {sending ? "Sending…" : "Send request"}
            </Button>

            {response && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Response</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 font-mono",
                      respStatus && respStatus < 300
                        ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-400"
                        : "border-rose-500/25 bg-rose-500/12 text-rose-400",
                    )}
                  >
                    {respStatus} {respStatus && respStatus < 300 ? "OK" : "Error"}
                  </Badge>
                </div>
                <JsonViewer data={response} className="max-h-72 text-[11px]" />
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Documentation links */}
      <motion.div {...fadeUp}>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Documentation</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_CARDS.map((d) => (
            <a
              key={d.title}
              href={d.href}
              className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-xl transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <d.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{d.title}</p>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{d.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Recent API logs */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileCode2 className="h-4 w-4 text-primary" />
              Recent API requests
            </h3>
            <p className="text-xs text-muted-foreground">Live log of the last 8 calls against your keys.</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">Open logs</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Method</th>
                <th className="pb-2 font-medium">Endpoint</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Latency</th>
              </tr>
            </thead>
            <tbody>
              {API_LOGS.map((row, i) => (
                <tr key={i} className="border-b border-border/30 transition hover:bg-muted/30">
                  <td className="py-2.5 font-mono text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />{row.time}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", methodColor(row.method))}>
                      {row.method}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-xs">{row.endpoint}</td>
                  <td className={cn("py-2.5 font-mono text-xs font-semibold", statusColor(row.status))}>{row.status}</td>
                  <td className="py-2.5 text-right font-mono text-xs text-muted-foreground">
                    {row.latency} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
