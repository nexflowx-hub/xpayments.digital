"use client";

import * as React from "react";
import { Copy, Eye, EyeOff, KeyRound, Loader2, RefreshCw, ShieldCheck, Webhook } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useApiKeys, useWebhooks } from "@/hooks/queries";
import { developerSecretsApi } from "@/lib/api/developer-secrets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VisibleSecret {
  resourceId: string;
  kind: "api-key" | "webhook";
  label: string;
  value: string;
}

const AUTO_HIDE_MS = 60_000;

export function DeveloperSecretManagement() {
  const { data: apiKeys = [], isLoading: loadingKeys } = useApiKeys();
  const { data: webhooks = [], isLoading: loadingWebhooks } = useWebhooks();
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [visibleSecret, setVisibleSecret] = React.useState<VisibleSecret | null>(null);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideSecret = React.useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
    setVisibleSecret(null);
  }, []);

  React.useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const showSecret = React.useCallback((secret: VisibleSecret) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisibleSecret(secret);
    hideTimer.current = setTimeout(() => setVisibleSecret(null), AUTO_HIDE_MS);
  }, []);

  const copySecret = async () => {
    if (!visibleSecret) return;
    await navigator.clipboard.writeText(visibleSecret.value);
    toast.success("Secret copiado");
  };

  const revealApiKey = async (id: string, name: string) => {
    if (visibleSecret?.kind === "api-key" && visibleSecret.resourceId === id) {
      hideSecret();
      return;
    }

    setBusy(`api-key:reveal:${id}`);
    try {
      const result = await developerSecretsApi.revealApiKey(id);
      showSecret({ resourceId: id, kind: "api-key", label: name, value: result.fullKey });
      toast.success("API key revelada por 60 segundos");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível revelar a API key");
    } finally {
      setBusy(null);
    }
  };

  const rotateApiKey = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Rodar a API key “${name}”? A chave atual deixará de funcionar imediatamente e terá de ser substituída no seu backend.`
    );
    if (!confirmed) return;

    setBusy(`api-key:rotate:${id}`);
    try {
      const result = await developerSecretsApi.rotateApiKey(id);
      await qc.invalidateQueries({ queryKey: ["api-keys"] });
      showSecret({ resourceId: id, kind: "api-key", label: `${name} · nova chave`, value: result.fullKey });
      toast.success("API key rodada. Atualize o secret no seu backend agora.");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível rodar a API key");
    } finally {
      setBusy(null);
    }
  };

  const revealWebhook = async (id: string, label: string) => {
    if (visibleSecret?.kind === "webhook" && visibleSecret.resourceId === id) {
      hideSecret();
      return;
    }

    setBusy(`webhook:reveal:${id}`);
    try {
      const result = await developerSecretsApi.revealWebhookSecret(id);
      showSecret({ resourceId: id, kind: "webhook", label, value: result.secret });
      toast.success("Signing secret revelado por 60 segundos");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível revelar o signing secret");
    } finally {
      setBusy(null);
    }
  };

  const rotateWebhook = async (id: string, label: string) => {
    const confirmed = window.confirm(
      `Rodar o signing secret de “${label}”? O secret anterior deixará de validar webhooks imediatamente.`
    );
    if (!confirmed) return;

    setBusy(`webhook:rotate:${id}`);
    try {
      const result = await developerSecretsApi.rotateWebhookSecret(id);
      showSecret({ resourceId: id, kind: "webhook", label: `${label} · novo signing secret`, value: result.secret });
      toast.success("Signing secret rodado. Atualize o endpoint Merchant agora.");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível rodar o signing secret");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Secret Management</h3>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            Reveal é temporário e as respostas são marcadas como no-store. Rotate invalida o secret anterior imediatamente; faça rotação apenas quando puder atualizar o backend ou endpoint Merchant no mesmo momento.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
          Merchant-scoped
        </Badge>
      </div>

      {visibleSecret && (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-200">{visibleSecret.label}</p>
              <code className="mt-2 block break-all rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-foreground">
                {visibleSecret.value}
              </code>
              <p className="mt-2 text-[11px] text-muted-foreground">Ocultação automática em 60 segundos. Não cole este valor em código público.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={copySecret}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={hideSecret}>
                <EyeOff className="h-3.5 w-3.5" /> Hide
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-sky-300" />
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">API Keys</h4>
          </div>
          {loadingKeys ? (
            <p className="text-xs text-muted-foreground">A carregar…</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma API key disponível.</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => {
                const revealing = busy === `api-key:reveal:${key.id}`;
                const rotating = busy === `api-key:rotate:${key.id}`;
                const shown = visibleSecret?.kind === "api-key" && visibleSecret.resourceId === key.id;
                return (
                  <div key={key.id} className="rounded-xl border border-border/50 bg-background/40 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{key.name}</p>
                          <Badge variant="outline" className="text-[9px]">{key.environment}</Badge>
                        </div>
                        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{key.storeName ?? key.storeCode ?? "Store"} · {key.keyPreview ?? "secret hidden"}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="ghost" className="gap-1" disabled={Boolean(busy) && !shown} onClick={() => revealApiKey(key.id, key.name)}>
                          {revealing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {shown ? "Hide" : "Reveal"}
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 text-amber-300" disabled={Boolean(busy)} onClick={() => rotateApiKey(key.id, key.name)}>
                          {rotating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          Rotate
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Webhook className="h-4 w-4 text-violet-300" />
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Merchant Webhook Secrets</h4>
          </div>
          {loadingWebhooks ? (
            <p className="text-xs text-muted-foreground">A carregar…</p>
          ) : webhooks.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum endpoint Merchant configurado.</p>
          ) : (
            <div className="space-y-2">
              {webhooks.map((hook) => {
                const label = hook.storeName ?? hook.storeCode ?? hook.url;
                const revealing = busy === `webhook:reveal:${hook.id}`;
                const rotating = busy === `webhook:rotate:${hook.id}`;
                const shown = visibleSecret?.kind === "webhook" && visibleSecret.resourceId === hook.id;
                return (
                  <div key={hook.id} className="rounded-xl border border-border/50 bg-background/40 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{label}</p>
                          <Badge variant="outline" className="text-[9px]">{hook.status}</Badge>
                        </div>
                        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{hook.url}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="ghost" className="gap-1" disabled={Boolean(busy) && !shown} onClick={() => revealWebhook(hook.id, label)}>
                          {revealing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {shown ? "Hide" : "Reveal"}
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 text-amber-300" disabled={Boolean(busy)} onClick={() => rotateWebhook(hook.id, label)}>
                          {rotating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          Rotate
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
