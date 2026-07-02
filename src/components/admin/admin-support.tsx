"use client";

import * as React from "react";
import {
  LifeBuoy, Inbox, AlertTriangle, Clock, Smile, Search, Eye, UserPlus, Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/shared";
import { DonutChart } from "@/components/shared/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, initials, timeAgo } from "@/lib/utils";

type Priority = "low" | "medium" | "high" | "urgent";
type TicketStatus = "open" | "pending" | "resolved";

interface Ticket {
  id: string;
  merchant: string;
  subject: string;
  priority: Priority;
  status: TicketStatus;
  assigned: string;
  updated: string;
  category: string;
}

const TICKETS: Ticket[] = [
  { id: "TKT-1042", merchant: "Acme Pay", subject: "Webhook signature verification failing after v2 migration", priority: "urgent", status: "open", assigned: "Sarah Chen", updated: new Date(Date.now() - 1000 * 60 * 8).toISOString(), category: "Integration" },
  { id: "TKT-1041", merchant: "Nordic Retail AB", subject: "Payout to SEB bank stuck in pending for 6 hours", priority: "high", status: "open", assigned: "Marcus Lind", updated: new Date(Date.now() - 1000 * 60 * 22).toISOString(), category: "Payouts" },
  { id: "TKT-1040", merchant: "Bolt Logistics", subject: "Need to increase daily volume limit to €250k", priority: "medium", status: "pending", assigned: "—", updated: new Date(Date.now() - 1000 * 60 * 64).toISOString(), category: "Account" },
  { id: "TKT-1039", merchant: "Pix Stores BR", subject: "Pix instant settlements showing 12s delay vs 3s SLA", priority: "high", status: "open", assigned: "Ana Souza", updated: new Date(Date.now() - 1000 * 60 * 38).toISOString(), category: "Settlement" },
  { id: "TKT-1038", merchant: "Crypto Hub Ltd", subject: "USDT payout to TRON address not arriving", priority: "urgent", status: "pending", assigned: "Sarah Chen", updated: new Date(Date.now() - 1000 * 60 * 92).toISOString(), category: "Crypto" },
  { id: "TKT-1037", merchant: "Globex Corp", subject: "How to set up subscription proration billing?", priority: "low", status: "resolved", assigned: "James Park", updated: new Date(Date.now() - 1000 * 60 * 180).toISOString(), category: "Billing" },
  { id: "TKT-1036", merchant: "Initech", subject: "Dashboard showing stale revenue numbers after midnight UTC", priority: "medium", status: "open", assigned: "—", updated: new Date(Date.now() - 1000 * 60 * 145).toISOString(), category: "Analytics" },
  { id: "TKT-1035", merchant: "Stark Industries", subject: "3DS challenge failing on Amex test cards in sandbox", priority: "high", status: "pending", assigned: "Marcus Lind", updated: new Date(Date.now() - 1000 * 60 * 210).toISOString(), category: "Integration" },
  { id: "TKT-1034", merchant: "Wayne Enterprises", subject: "Request for dedicated sandbox environment", priority: "low", status: "resolved", assigned: "James Park", updated: new Date(Date.now() - 1000 * 60 * 320).toISOString(), category: "Account" },
  { id: "TKT-1033", merchant: "Umbrella SA", subject: "KYC documents rejected twice — need reviewer clarification", priority: "medium", status: "open", assigned: "Ana Souza", updated: new Date(Date.now() - 1000 * 60 * 240).toISOString(), category: "Compliance" },
  { id: "TKT-1032", merchant: "Hooli", subject: "API rate limit too aggressive for batch refund script", priority: "medium", status: "resolved", assigned: "Sarah Chen", updated: new Date(Date.now() - 1000 * 60 * 480).toISOString(), category: "API" },
  { id: "TKT-1031", merchant: "Pied Piper", subject: "Dispute evidence upload rejected — file size limit unclear", priority: "low", status: "resolved", assigned: "James Park", updated: new Date(Date.now() - 1000 * 60 * 600).toISOString(), category: "Disputes" },
];

const priorityCfg: Record<Priority, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "border-rose-500/25 bg-rose-500/12 text-rose-400" },
  high: { label: "High", cls: "border-orange-500/25 bg-orange-500/12 text-orange-400" },
  medium: { label: "Medium", cls: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
  low: { label: "Low", cls: "border-sky-500/25 bg-sky-500/12 text-sky-400" },
};

const statusCfg: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "border-sky-500/25 bg-sky-500/12 text-sky-400" },
  pending: { label: "Pending", cls: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
  resolved: { label: "Resolved", cls: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
};

const AVATAR_COLORS = ["bg-primary/20 text-primary", "bg-emerald-500/15 text-emerald-400", "bg-violet-500/15 text-violet-400", "bg-amber-500/15 text-amber-400", "bg-rose-500/15 text-rose-400"];

export default function AdminSupportPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");

  const filtered = TICKETS.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.id.toLowerCase().includes(q) && !t.merchant.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const open = TICKETS.filter((t) => t.status === "open").length;
  const urgent = TICKETS.filter((t) => t.priority === "urgent").length;

  const queueByPriority = (["urgent", "high", "medium", "low"] as Priority[]).map((p) => ({
    name: priorityCfg[p].label,
    value: TICKETS.filter((t) => t.priority === p && t.status !== "resolved").length,
  }));

  const assigneeColor = (name: string) => {
    if (name === "—") return "bg-muted/40 text-muted-foreground";
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Support"
        description="Merchant support ticket queue, assignments and SLA tracking."
        actions={
          <>
            <Button variant="outline" size="sm">Knowledge base</Button>
            <Button size="sm" className="gap-1.5"><Headphones className="h-3.5 w-3.5" /> New ticket</Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open tickets" value={open} change={-4.2} icon={Inbox} accent="blue" format={(n) => `${Math.round(n)}`} />
        <StatCard label="Urgent" value={urgent} change={1} icon={AlertTriangle} accent="rose" format={(n) => `${Math.round(n)}`} />
        <StatCard label="Avg resolution" value={4.2} change={-8.4} icon={Clock} accent="amber" format={(n) => `${n.toFixed(1)}h`} />
        <StatCard label="CSAT score" value={94} change={2.1} icon={Smile} accent="green" format={(n) => `${Math.round(n)}%`} />
      </div>

      {/* Filters + queue donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ticket ID, merchant or subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All statuses</SelectItem>
                <SelectItem value="open" className="text-xs">Open</SelectItem>
                <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All priorities</SelectItem>
                <SelectItem value="urgent" className="text-xs">Urgent</SelectItem>
                <SelectItem value="high" className="text-xs">High</SelectItem>
                <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                <SelectItem value="low" className="text-xs">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Queue by priority</h3>
              <p className="text-xs text-muted-foreground">Open + pending tickets</p>
            </div>
            <LifeBuoy className="h-4 w-4 text-muted-foreground" />
          </div>
          <DonutChart data={queueByPriority} height={150} formatter={(v) => `${Math.round(v)}`} />
        </Card>
      </div>

      {/* Tickets table */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Tickets</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} of {TICKETS.length} tickets shown</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Merchant</th>
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Priority</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Assigned</th>
                <th className="pb-2 text-right font-medium">Updated</th>
                <th className="pb-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const p = priorityCfg[t.priority];
                const s = statusCfg[t.status];
                return (
                  <tr key={t.id} className="border-b border-border/30 transition hover:bg-muted/30">
                    <td className="py-3 font-mono text-xs font-semibold text-primary">{t.id}</td>
                    <td className="py-3">
                      <p className="text-xs font-medium">{t.merchant}</p>
                      <p className="text-[10px] text-muted-foreground">{t.category}</p>
                    </td>
                    <td className="py-3">
                      <p className="max-w-xs truncate text-xs text-foreground/90">{t.subject}</p>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className={cn("text-[10px] font-medium", p.cls)}>{p.label}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className={cn("text-[10px] font-medium", s.cls)}>{s.label}</Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className={cn("text-[10px] font-semibold", assigneeColor(t.assigned))}>
                            {t.assigned === "—" ? "—" : initials(t.assigned)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-muted-foreground">{t.assigned}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-[11px] text-muted-foreground">{timeAgo(t.updated)}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toast.message(`Opening ticket ${t.id}`, { description: t.subject })}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toast.info(`Reassigning ${t.id}`, { description: `Currently assigned to ${t.assigned}.` })}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
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
    </div>
  );
}
