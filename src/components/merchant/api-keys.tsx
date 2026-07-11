"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound, Plus, Copy, Eye, EyeOff, Trash2, Loader2, ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useApiKeys } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
import { PageHeader, EmptyState, fadeUp } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import type { ApiKey } from "@/types";

const ALL_SCOPES = ["read", "write", "payments", "payouts", "webhooks"] as const;
const SCOPE_LABELS: Record<string, string> = {
  read: "Read",
  write: "Write",
  payments: "Payments",
  payouts: "Payouts",
  webhooks: "Webhooks",
};

type EnvFilter = "all" | "live" | "test";

export default function ApiKeysPage() {
  const { data, isLoading } = useApiKeys();
  const qc = useQueryClient();
  const [envFilter, setEnvFilter] = React.useState<EnvFilter>("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [revealedKey, setRevealedKey] = React.useState<ApiKey | null>(null);
  const [confirmSaved, setConfirmSaved] = React.useState(false);

  // Create form state
  const [name, setName] = React.useState("");
  const [environment, setEnvironment] = React.useState<"live" | "test">("test");
  const [scopes, setScopes] = React.useState<string[]>(["read", "payments"]);

  const createMutation = useMutation({
    mutationFn: () => xpApi.apiKeys.create(name, environment, scopes),
    onSuccess: (key) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setCreateOpen(false);
      setName("");
      setScopes(["read", "payments"]);
      setEnvironment("test");
      if (key.fullKey) {
        setRevealedKey(key);
        setConfirmSaved(false);
      }
      toast.success("API key created");
    },
    onError: () => toast.error("Could not create API key"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => xpApi.apiKeys.revoke(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
    },
    onError: () => toast.error("Could not revoke key"),
  });

  const keys = data ?? [];
  const filtered = keys.filter((k) => envFilter === "all" || k.environment === envFilter);

  const toggleScope = (s: string) =>
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const copyToClipboard = (text: string, label = "Copied") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast.success(label));
    } else {
      toast.success(label);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="API Keys"
        description="Manage credentials used to authenticate API requests."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create API key
          </Button>
        }
      />

      {/* Environment filter + warning */}
      <motion.div {...fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card/60 p-1 backdrop-blur-xl">
          {(["all", "live", "test"] as EnvFilter[]).map((e) => (
            <button
              key={e}
              onClick={() => setEnvFilter(e)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition",
                envFilter === e
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {e === "all" ? "All keys" : `${e === "live" ? "Live" : "Test"} only`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-xs text-amber-300">
          <ShieldAlert className="h-3.5 w-3.5" />
          Never share live secret keys. Rotate immediately on suspected exposure.
        </div>
      </motion.div>

      {/* Keys table */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="h-4 w-4 text-primary" />
              Your API keys
            </h3>
            <p className="text-xs text-muted-foreground">{filtered.length} keys · {keys.filter((k) => k.environment === "live").length} live</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No API keys yet"
            description="Create your first key to start integrating XPayments."
            action={<Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New key</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Key</th>
                  <th className="pb-2 font-medium">Environment</th>
                  <th className="pb-2 font-medium">Scopes</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Last used</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => (
                  <tr key={k.id} className="border-b border-border/30 transition hover:bg-muted/30">
                    <td className="py-3 font-medium">{k.name}</td>
                    <td className="py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {k.prefix}<span className="text-foreground/50">••••</span>{k.lastFour}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 font-medium",
                          k.environment === "live"
                            ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-400"
                            : "border-amber-500/25 bg-amber-500/12 text-amber-400",
                        )}
                      >
                        {k.environment === "live" ? "Live" : "Test"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {(k?.scopes ?? []).map((s) => (
                          <Badge key={s} variant="outline" className="border-border/60 bg-muted/30 text-[10px] font-medium">
                            {SCOPE_LABELS[s] ?? s}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{formatDate(k.createdAt)}</td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {k.lastUsedAt ? timeAgo(k.lastUsedAt) : "Never"}
                    </td>
                    <td className="py-3 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                            <Trash2 className="h-3.5 w-3.5" /> Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The key <span className="font-mono">{k.prefix}••••{k.lastFour}</span> ({k.name}) will be permanently revoked. Any application using it will lose access immediately. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-rose-600 text-white hover:bg-rose-600/90"
                              onClick={() => revokeMutation.mutate(k.id)}
                            >
                              {revokeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Revoke key"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>Generate a new key for server-side API access.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Production Server"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Environment</Label>
              <RadioGroup
                value={environment}
                onValueChange={(v) => setEnvironment(v as "live" | "test")}
                className="grid grid-cols-2 gap-2"
              >
                {(["live", "test"] as const).map((e) => (
                  <label
                    key={e}
                    htmlFor={`env-${e}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition",
                      environment === e
                        ? e === "live"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <RadioGroupItem value={e} id={`env-${e}`} />
                    <span className="font-medium capitalize">{e === "live" ? "Live" : "Test"}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {e === "live" ? "real money" : "sandbox"}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Scopes</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_SCOPES.map((s) => (
                  <label
                    key={s}
                    htmlFor={`scope-${s}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                      scopes.includes(s)
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Checkbox
                      id={`scope-${s}`}
                      checked={scopes.includes(s)}
                      onCheckedChange={() => toggleScope(s)}
                    />
                    {SCOPE_LABELS[s]}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || scopes.length === 0 || createMutation.isPending}
              className="gap-1.5"
            >
              {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-time reveal dialog */}
      <Dialog open={!!revealedKey} onOpenChange={(o) => { if (!o && confirmSaved) setRevealedKey(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              Save your API key
            </DialogTitle>
            <DialogDescription>
              This is the only time the full key will be shown. Store it securely — you will not be able to see it again.
            </DialogDescription>
          </DialogHeader>

          {revealedKey && (
            <div className="flex flex-col gap-3 py-2">
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-200">
                Treat this key like a password. Anyone with this token can act on behalf of your account within the granted scopes.
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={revealedKey.fullKey ?? ""}
                  className="font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(revealedKey.fullKey ?? "", "API key copied")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className={cn(
                  "capitalize",
                  revealedKey.environment === "live"
                    ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-400"
                    : "border-amber-500/25 bg-amber-500/12 text-amber-400",
                )}>
                  {revealedKey.environment}
                </Badge>
                <span>Scopes: {revealedKey.scopes.join(", ")}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <AlertDialog open={confirmSaved} onOpenChange={setConfirmSaved}>
              <AlertDialogTrigger asChild>
                <Button className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> I have saved my key
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm you saved the key</AlertDialogTitle>
                  <AlertDialogDescription>
                    The full key will be hidden forever once you close this dialog. You will only see the prefix and last 4 characters going forward. Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Go back</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setConfirmSaved(false);
                      setRevealedKey(null);
                      toast.success("Key saved — dialog closed");
                    }}
                  >
                    Yes, I saved it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
