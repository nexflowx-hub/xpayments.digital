"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Webhook, Plus, Trash2, Loader2, Eye, EyeOff, Copy, Bell, CheckCircle2,
  XCircle, Store, Pencil,
} from "lucide-react";
import { useWebhooks, useStores } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
import { PageHeader, EmptyState, fadeUp } from "@/components/shared";
import { StatusBadge } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import type { Webhook as WebhookType, Store as StoreType } from "@/types";

const WEBHOOK_EVENTS = [
  { id: "payment.succeeded", label: "payment.succeeded", desc: "Sent when a payment is captured successfully." },
  { id: "payment.failed", label: "payment.failed", desc: "Sent when a payment is declined or fails authorization." },
  { id: "payout.created", label: "payout.created", desc: "Sent when a new payout is queued for processing." },
  { id: "refund.created", label: "refund.created", desc: "Sent when a full or partial refund is issued." },
  { id: "dispute.opened", label: "dispute.opened", desc: "Sent when a chargeback or dispute is opened by the issuer." },
  { id: "wallet.updated", label: "wallet.updated", desc: "Sent when a wallet balance or hold changes." },
] as const;

export default function WebhooksPage() {
  const { data, isLoading } = useWebhooks();
  const { data: stores } = useStores();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = React.useState(false);

  const [url, setUrl] = React.useState("");
  const [storeId, setStoreId] = React.useState("");
  const [events, setEvents] = React.useState<string[]>(["payment.succeeded", "payment.failed"]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editId, setEditId] = React.useState("");
  const [editUrl, setEditUrl] = React.useState("");
  const [editEvents, setEditEvents] = React.useState<string[]>([]);

  const storeList = stores ?? [];

  const createMutation = useMutation({
    mutationFn: () => xpApi.webhooks.create({ url, events, storeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      setCreateOpen(false);
      setUrl("");
      setStoreId("");
      setEvents(["payment.succeeded", "payment.failed"]);
      toast.success("Webhook endpoint added");
    },
    onError: () => toast.error("Could not create webhook"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => xpApi.webhooks.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook endpoint removed");
    },
    onError: () => toast.error("Could not remove webhook"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, url, events }: { id: string; url: string; events: string[] }) =>
      xpApi.webhooks.update(id, url, events),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      setEditOpen(false);
      toast.success("Webhook endpoint updated");
    },
    onError: () => toast.error("Could not update webhook"),
  });

  const openEdit = (w: WebhookType) => {
    setEditId(w.id);
    setEditUrl(w.url);
    setEditEvents(w.events ?? []);
    setEditOpen(true);
  };

  const toggleEditEvent = (e: string) =>
    setEditEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));

  const webhooks = data ?? [];

  const toggleEvent = (e: string) =>
    setEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));

  const copyToClipboard = (text: string, label = "Copied") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast.success(label));
    }
  };

  // Helper: find store by storeId
  const getStoreName = (sid?: string) => storeList.find((s) => s.id === sid)?.name ?? "—";
  const getStoreCode = (sid?: string) => storeList.find((s) => s.id === sid)?.storeCode ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Webhooks"
        description="Receive real-time event notifications at your endpoints."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)} disabled={storeList.length === 0}>
            <Plus className="h-3.5 w-3.5" /> Add endpoint
          </Button>
        }
      />

      {storeList.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-300">
          <Store className="h-4 w-4" />
          You need at least one store before adding webhook endpoints. Go to Stores to create one.
        </div>
      )}

      {/* Endpoints */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : webhooks.length === 0 ? (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <EmptyState
            icon={Webhook}
            title="No webhook endpoints"
            description="Add an HTTPS endpoint to start receiving event notifications."
            action={storeList.length > 0 ? <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New endpoint</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {webhooks.map((w, idx) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <WebhookCard
                webhook={w}
                storeName={w.storeName ?? getStoreName(w.storeId)}
                storeCode={w.storeCode ?? getStoreCode(w.storeId)}
                onRemove={() => removeMutation.mutate(w.id)}
                removing={removeMutation.isPending}
                onCopySecret={(s) => copyToClipboard(s, "Signing secret copied")}
                onEdit={() => openEdit(w)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Events reference */}
      <motion.div {...fadeUp}>
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4 text-primary" />
              Webhook events
            </h3>
            <p className="text-xs text-muted-foreground">Event types you can subscribe to.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {WEBHOOK_EVENTS.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2.5"
              >
                <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                  {e.label}
                </code>
                <p className="flex-1 text-xs text-muted-foreground">{e.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add webhook endpoint</DialogTitle>
            <DialogDescription>HTTPS endpoint that will receive signed event payloads.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Store — required */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wh-store">Store <span className="text-rose-400">*</span></Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger id="wh-store">
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {storeList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.storeCode ? `(${s.storeCode})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wh-url">Endpoint URL</Label>
              <Input
                id="wh-url"
                placeholder="https://api.merchant.io/xp/events"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Must be HTTPS. Maximum 30s response timeout.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Events to send</Label>
              <div className="flex flex-col gap-1.5">
                {WEBHOOK_EVENTS.map((e) => (
                  <label
                    key={e.id}
                    htmlFor={`ev-${e.id}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition",
                      events.includes(e.id)
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/60 bg-muted/30 hover:bg-muted/40",
                    )}
                  >
                    <Checkbox
                      id={`ev-${e.id}`}
                      checked={events.includes(e.id)}
                      onCheckedChange={() => toggleEvent(e.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <code className="font-mono text-xs font-medium">{e.label}</code>
                      <p className="text-[11px] text-muted-foreground">{e.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!url.trim() || !storeId || events.length === 0 || !url.startsWith("https://") || createMutation.isPending}
              className="gap-1.5"
            >
              {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add endpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit webhook endpoint</DialogTitle>
            <DialogDescription>Update the URL and events for this webhook.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-url">Endpoint URL</Label>
              <Input
                id="edit-url"
                placeholder="https://api.merchant.io/xp/events"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Events</Label>
              <div className="flex flex-col gap-1.5">
                {WEBHOOK_EVENTS.map((e) => (
                  <label
                    key={e.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition",
                      editEvents.includes(e.id)
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/60 bg-muted/30 hover:bg-muted/40",
                    )}
                  >
                    <Checkbox
                      checked={editEvents.includes(e.id)}
                      onCheckedChange={() => toggleEditEvent(e.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <code className="font-mono text-xs font-medium">{e.label}</code>
                      <p className="text-[11px] text-muted-foreground">{e.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ id: editId, url: editUrl, events: editEvents })}
              disabled={!editUrl.trim() || editEvents.length === 0 || !editUrl.startsWith("https://") || updateMutation.isPending}
              className="gap-1.5"
            >
              {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WebhookCard({
  webhook,
  storeName,
  storeCode,
  onRemove,
  removing,
  onCopySecret,
  onEdit,
}: {
  webhook: WebhookType;
  storeName: string;
  storeCode: string;
  onRemove: () => void;
  removing: boolean;
  onCopySecret: (s: string) => void;
  onEdit: () => void;
}) {
  const [revealSecret, setRevealSecret] = React.useState(false);
  const successColor =
    (webhook.successRate ?? 0) >= 99
      ? "text-emerald-400"
      : (webhook.successRate ?? 0) >= 95
        ? "text-amber-400"
        : "text-rose-400";
  const progressColor =
    (webhook.successRate ?? 0) >= 99 ? "primary" : (webhook.successRate ?? 0) >= 95 ? "amber" : "rose";

  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-3">
          {/* Store + URL + Status */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{storeName}</span>
              {storeCode !== "—" && (
                <span className="font-mono text-[10px] text-muted-foreground">({storeCode})</span>
              )}
            </div>
            <span className="text-border/60">·</span>
            <span className="font-mono text-sm text-foreground">{webhook.url}</span>
            <StatusBadge status={webhook.status} />
          </div>

          {/* Events */}
          <div className="flex flex-wrap gap-1.5">
            {(webhook?.events ?? []).map((e) => (
              <Badge key={e} variant="outline" className="border-primary/30 bg-primary/8 font-mono text-[10px] text-primary">
                {e}
              </Badge>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Success rate</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={cn("font-mono text-sm font-semibold", successColor)}>
                  {(webhook.successRate ?? 0).toFixed(1)}%
                </span>
              </div>
              <Progress
                value={webhook.successRate ?? 0}
                className={cn(
                  "mt-1.5 h-1.5",
                  progressColor === "amber" && "[&>div]:bg-amber-400",
                  progressColor === "rose" && "[&>div]:bg-rose-400",
                )}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last delivery</p>
              <p className="mt-1 text-sm text-foreground">
                {webhook.lastDeliveryAt ? timeAgo(webhook.lastDeliveryAt) : "Never"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Created</p>
              <p className="mt-1 text-sm text-foreground">{timeAgo(webhook.createdAt)}</p>
            </div>
          </div>

          {/* Signing secret */}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Signing secret</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-black/40 px-2 py-1 font-mono text-xs text-zinc-300">
                {revealSecret ? webhook.secret : "whsec_••••••••••••"}
              </code>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRevealSecret((v) => !v)}>
                {revealSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onCopySecret(webhook.secret)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:flex-col lg:items-end">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {webhook.status === "active" ? (
              <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Receiving events</>
            ) : (
              <><XCircle className="h-3 w-3 text-muted-foreground" /> Disabled</>
            )}
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-primary hover:bg-primary/10" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this webhook endpoint?</AlertDialogTitle>
                <AlertDialogDescription>
                  Events will no longer be delivered to <span className="font-mono">{webhook.url}</span>. The signing secret will be revoked. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 text-white hover:bg-rose-600/90"
                  onClick={onRemove}
                  disabled={removing}
                >
                  {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete endpoint"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
