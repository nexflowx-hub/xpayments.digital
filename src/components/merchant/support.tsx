"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  LifeBuoy, Mail, MessageSquare, Phone, FileText, Activity, Ticket,
  Upload, ChevronRight, Clock, AlertTriangle, BookOpen,
  Send, Loader2, Zap, ShieldCheck, Webhook, Scale, Gauge,
} from "lucide-react";
import { PageHeader, fadeUp } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { StatusBadge } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const TOP_CARDS = [
  { icon: Ticket, title: "Create ticket", desc: "Get help from our support team.", accent: "text-primary bg-primary/10" },
  { icon: BookOpen, title: "Documentation", desc: "Guides, API reference and recipes.", accent: "text-violet-400 bg-violet-500/10" },
  { icon: Activity, title: "System status", desc: "All systems operational · 99.99%", accent: "text-emerald-400 bg-emerald-500/10" },
];

const KB_ARTICLES = [
  { icon: Zap, title: "Getting started", desc: "Set up your account and make your first payment in 5 minutes." },
  { icon: ShieldCheck, title: "Accepting Pix", desc: "Receive instant Brazilian Real payments via Pix QR codes." },
  { icon: Webhook, title: "Webhooks guide", desc: "Sign, verify and retry event payloads end-to-end." },
  { icon: Scale, title: "Chargeback disputes", desc: "Submit evidence and track dispute lifecycle deadlines." },
  { icon: Gauge, title: "FX & hedging", desc: "Lock in rates and hedge multi-currency exposure." },
  { icon: Activity, title: "API rate limits", desc: "Understand quotas, bursts and exponential backoff." },
];

const RECENT_TICKETS = [
  { id: "XP-2041", subject: "Pix payout returned by bank", status: "open", priority: "high", updatedAt: "2025-01-14T10:30:00Z" },
  { id: "XP-2038", subject: "Webhook signature mismatch", status: "open", priority: "medium", updatedAt: "2025-01-13T16:12:00Z" },
  { id: "XP-2030", subject: "Need higher daily payout limit", status: "pending", priority: "medium", updatedAt: "2025-01-12T09:45:00Z" },
  { id: "XP-2024", subject: "How to add a new currency wallet", status: "succeeded", priority: "low", updatedAt: "2025-01-10T14:20:00Z" },
  { id: "XP-2019", subject: "Invoice template customization", status: "succeeded", priority: "low", updatedAt: "2025-01-09T11:05:00Z" },
  { id: "XP-2011", subject: "KYC document re-upload", status: "pending", priority: "high", updatedAt: "2025-01-07T18:30:00Z" },
];

const CHANNELS = [
  { icon: Mail, label: "Email", value: "support@xpayments.digital", desc: "Replies within 4 hours", accent: "text-sky-400" },
  { icon: MessageSquare, label: "Live chat", value: "Available in dashboard", desc: "Mon–Fri, 09:00–22:00 UTC", accent: "text-emerald-400" },
  { icon: Phone, label: "Phone", value: "+351 211 093 440", desc: "Priority & Enterprise plans", accent: "text-violet-400" },
];

const SLA = [
  { plan: "Starter", response: "24 hours", resolution: "3 business days" },
  { plan: "Pro", response: "4 hours", resolution: "1 business day" },
  { plan: "Enterprise", response: "30 minutes", resolution: "4 hours" },
];

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    high: "border-rose-500/25 bg-rose-500/12 text-rose-400",
    medium: "border-amber-500/25 bg-amber-500/12 text-amber-400",
    low: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400",
  };
  return map[p] ?? "border-border bg-muted/30 text-muted-foreground";
}

export default function SupportPage() {
  const t = useT();
  const [subject, setSubject] = React.useState("");
  const [priority, setPriority] = React.useState("medium");
  const [message, setMessage] = React.useState("");
  const [files, setFiles] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in subject and message");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const id = "XP-" + Math.floor(2000 + Math.random() * 8000);
      setSubmitting(false);
      setSubject("");
      setMessage("");
      setFiles([]);
      toast.success(`Ticket #${id} created`);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.support")}
        description="Get help, browse the knowledge base, and track your tickets."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href="#" className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Docs</a>
          </Button>
        }
      />

      {/* Top cards */}
      <motion.div {...fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TOP_CARDS.map((c) => (
          <Card key={c.title} className="border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40">
            <div className={cn("inline-flex rounded-lg p-2", c.accent)}>
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
          </Card>
        ))}
      </motion.div>

      {/* Contact form + channels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <LifeBuoy className="h-4 w-4 text-primary" />
              Contact support
            </h3>
            <p className="text-xs text-muted-foreground">We typically reply within 4 hours during business hours.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="ticket-subject">Subject</Label>
              <Input id="ticket-subject" placeholder="Briefly describe your issue" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — general question</SelectItem>
                  <SelectItem value="medium">Medium — needs attention</SelectItem>
                  <SelectItem value="high">High — production impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Attachments</Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-9 items-center gap-2 rounded-md border border-dashed border-border/60 bg-background/40 px-3 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <Upload className="h-3.5 w-3.5" />
                {files.length ? `${files.length} file(s) attached` : "Add files"}
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files ?? []).map((f) => f.name);
                  setFiles((prev) => [...prev, ...list]);
                  if (list.length) toast.success(`${list.length} file(s) added`);
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="ticket-message">Message</Label>
              <Textarea
                id="ticket-message"
                placeholder="Describe what you were trying to do, what happened, and any error messages or references (e.g. REF…)."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-32 resize-none"
              />
            </div>
            {files.length > 0 && (
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <Badge key={i} variant="outline" className="gap-1.5 border-border/60 bg-muted/30">
                    <FileText className="h-3 w-3" /> {f}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={submit} disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {submitting ? "Submitting…" : "Submit ticket"}
            </Button>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Support channels</h3>
            <p className="text-xs text-muted-foreground">Reach us the way that works best for you.</p>
          </div>
          <div className="flex flex-col gap-3">
            {CHANNELS.map((c) => (
              <div key={c.label} className="rounded-lg border border-border/40 bg-background/40 p-3">
                <div className="flex items-center gap-2">
                  <c.icon className={cn("h-4 w-4", c.accent)} />
                  <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                </div>
                <p className="mt-1 text-sm font-medium">{c.value}</p>
                <p className="text-[11px] text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Knowledge base */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Knowledge base</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KB_ARTICLES.map((a) => (
            <a
              key={a.title}
              href="#"
              className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-xl transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><a.icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{a.title}</p>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent tickets + SLA */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Recent tickets</h3>
              <p className="text-xs text-muted-foreground">Your last 6 support requests</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">View all</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Ticket</th>
                  <th className="pb-2 font-medium">Subject</th>
                  <th className="pb-2 font-medium">Priority</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_TICKETS.map((t) => (
                  <tr key={t.id} className="border-b border-border/30 transition hover:bg-muted/30">
                    <td className="py-3 font-mono text-xs text-primary">{t.id}</td>
                    <td className="py-3 font-medium">{t.subject}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={cn("capitalize", priorityBadge(t.priority))}>{t.priority}</Badge>
                    </td>
                    <td className="py-3"><StatusBadge status={t.status} /></td>
                    <td className="py-3 text-right text-xs text-muted-foreground">{timeAgo(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-primary" />
              SLA commitments
            </h3>
            <p className="text-xs text-muted-foreground">Response & resolution times by plan.</p>
          </div>
          <div className="flex flex-col gap-2">
            {SLA.map((s) => {
              const isPro = s.plan === "Pro";
              return (
                <div
                  key={s.plan}
                  className={cn(
                    "rounded-lg border px-3 py-2.5",
                    isPro ? "border-primary/30 bg-primary/8" : "border-border/40 bg-background/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{s.plan}</p>
                    {isPro && <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Your plan</Badge>}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span>↳ {s.response} response</span>
                    <span>↳ {s.resolution} resolution</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>High-priority tickets affecting production are escalated automatically within 30 minutes.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
