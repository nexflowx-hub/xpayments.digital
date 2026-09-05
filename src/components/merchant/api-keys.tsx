"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, KeyRound, Loader2, Plus, ShieldAlert, Store, Trash2 } from "lucide-react";
import { useApiKeys, useStores } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
import { PageHeader, EmptyState } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const SCOPES = [
  { id: "payments_write", label: "Payments S2S · write", recommended: true },
  { id: "read", label: "Read", recommended: false },
  { id: "write", label: "Write (legacy)", recommended: false },
  { id: "payments", label: "Payments (legacy)", recommended: false },
  { id: "payouts", label: "Payouts", recommended: false },
  { id: "webhooks", label: "Webhooks", recommended: false },
] as const;

type EnvFilter = "all" | "live" | "test";

export default function ApiKeysPage() {
  const { data: keys = [], isLoading } = useApiKeys();
  const { data: stores = [] } = useStores();
  const qc = useQueryClient();

  const [filter, setFilter] = React.useState<EnvFilter>("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [storeId, setStoreId] = React.useState("");
  const [environment, setEnvironment] = React.useState<"live" | "test">("test");
  const [scopes, setScopes] = React.useState<string[]>(["payments_write"]);
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState<Record<string, string>>({});
  const [revealId, setRevealId] = React.useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setStoreId("");
    setEnvironment("test");
    setScopes(["payments_write"]);
  };

  const createMutation = useMutation({
    mutationFn: () => xpApi.apiKeys.create({ name, storeId, environment, scopes }),
    onSuccess: (key) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setCreateOpen(false);
      setCreatedKey(key.fullKey ?? null);
      resetForm();
      toast.success("API key criada");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível criar a API key"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => xpApi.apiKeys.revoke(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revogada");
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Não foi possível revogar a chave"),
  });

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success("Copiado");
  };

  const toggleScope = (scope: string) => {
    setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  };

  const filtered = keys.filter((key) => filter === "all" || key.environment === filter);
  const valid = Boolean(name.trim() && storeId && scopes.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="API Keys"
        description="Credenciais por Store para integrações XPayments. O endpoint S2S /payments/charge exige o scope payments_write."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)} disabled={stores.length === 0}>
            <Plus className="h-3.5 w-3.5" /> Create API key
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit items-center gap-1 rounded-lg border border-border/60 bg-card/60 p-1">
          {(["all", "live", "test"] as EnvFilter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${filter === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item === "all" ? "All" : item === "live" ? "Live" : "Test"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-xs text-amber-300">
          <ShieldAlert className="h-3.5 w-3.5" /> Nunca exponha xp_live_ ou xp_test_ no browser ou código público.
        </div>
      </div>

      {createdKey && (
        <Card className="border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="text-xs font-semibold text-emerald-300">Nova API key criada</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Copie e guarde agora num secret manager do servidor.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-black/30 px-2 py-1.5 font-mono text-xs">{createdKey}</code>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => copy(createdKey)}><Copy className="h-3.5 w-3.5" /></Button>
          </div>
        </Card>
      )}

      {stores.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-300">
          <Store className="h-4 w-4" /> É necessária pelo menos uma Store antes de criar API Keys.
        </div>
      )}

      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-primary" /> Your API keys</h3>
            <p className="mt-1 text-xs text-muted-foreground">{filtered.length} chave(s) neste filtro</p>
          </div>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">A carregar…</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={KeyRound} title="No API keys yet" description="Crie uma chave por Store e ambiente para iniciar a integração." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead><tr className="border-b border-border/60 text-left text-xs text-muted-foreground"><th className="pb-2 font-medium">Store</th><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Key</th><th className="pb-2 font-medium">Environment</th><th className="pb-2 font-medium">Scopes</th><th className="pb-2 text-right font-medium">Actions</th></tr></thead>
              <tbody>
                {filtered.map((key) => {
                  const value = revealed[key.id] ?? key.fullKey ?? key.keyPreview ?? `${key.prefix}••••${key.lastFour}`;
                  return (
                    <tr key={key.id} className="border-b border-border/30">
                      <td className="py-3"><p className="font-medium">{key.storeName ?? stores.find((s) => s.id === key.storeId)?.name ?? "—"}</p><p className="font-mono text-[10px] text-muted-foreground">{key.storeCode ?? stores.find((s) => s.id === key.storeId)?.storeCode ?? "—"}</p></td>
                      <td className="py-3 font-medium">{key.name}</td>
                      <td className="py-3"><code className="font-mono text-xs text-muted-foreground">{value}</code></td>
                      <td className="py-3"><Badge variant="outline" className={key.environment === "live" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-300"}>{key.environment}</Badge></td>
                      <td className="py-3"><div className="flex flex-wrap gap-1">{(key.scopes ?? []).map((scope) => <Badge key={scope} variant="outline" className="font-mono text-[10px]">{scope}</Badge>)}</div></td>
                      <td className="py-3 text-right"><div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          disabled={revealId === key.id}
                          onClick={async () => {
                            setRevealId(key.id);
                            try {
                              const result = await xpApi.apiKeys.reveal(key.id);
                              if (result.fullKey) setRevealed((current) => ({ ...current, [key.id]: result.fullKey }));
                            } catch {
                              toast.error("Não foi possível revelar a chave");
                            } finally {
                              setRevealId(null);
                            }
                          }}
                        >
                          {revealId === key.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />} View
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1" onClick={() => copy(value)}><Copy className="h-3.5 w-3.5" /> Copy</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-rose-400"
                          disabled={revokeMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Revogar a API key ${key.name}?`)) revokeMutation.mutate(key.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Revoke
                        </Button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>Associe a chave à Store e ao ambiente corretos. Para S2S, mantenha payments_write ativo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Backend production" /></div>
            <div className="space-y-1.5"><Label>Store</Label><Select value={storeId} onValueChange={setStoreId}><SelectTrigger><SelectValue placeholder="Selecione a Store" /></SelectTrigger><SelectContent>{stores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name} ({store.storeCode})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Environment</Label><Select value={environment} onValueChange={(value) => setEnvironment(value as "live" | "test")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="test">Test · xp_test_</SelectItem><SelectItem value="live">Live · xp_live_</SelectItem></SelectContent></Select></div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              {SCOPES.map((scope) => (
                <label key={scope.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 ${scope.recommended ? "border-blue-500/30 bg-blue-500/5" : "border-border/60"}`}>
                  <div className="flex items-center gap-2"><Checkbox checked={scopes.includes(scope.id)} onCheckedChange={() => toggleScope(scope.id)} /><span className="text-sm">{scope.label}</span></div>
                  {scope.recommended && <Badge variant="outline" className="border-blue-500/25 bg-blue-500/10 text-[10px] text-blue-300">S2S required</Badge>}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button disabled={!valid || createMutation.isPending} onClick={() => createMutation.mutate()} className="gap-1.5">
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Criar chave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
