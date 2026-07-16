"use client";

import * as React from "react";
import {
  Flag, ToggleLeft, FlaskConical, PowerOff, Plus, Pencil, Search, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Environment = "production" | "staging" | "development";

interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  environment: Environment;
  rollout: number;
  owner: string;
}

const INITIAL_FLAGS: FeatureFlag[] = [
  { key: "new_checkout_flow", description: "Redesigned 3-step checkout with wallet persistence and saved methods", enabled: true, environment: "production", rollout: 100, owner: "checkout-squad" },
  { key: "crypto_payouts", description: "Enable USDT/BTC payouts to merchant wallets via Wise rail", enabled: false, environment: "production", rollout: 0, owner: "treasury" },
  { key: "ai_risk_scoring", description: "ML model v2.4 inference for real-time transaction risk scoring", enabled: true, environment: "production", rollout: 75, owner: "risk-eng" },
  { key: "pix_instant", description: "Sub-3s Pix settlement via direct BCB rail integration", enabled: true, environment: "production", rollout: 100, owner: "latam-squad" },
  { key: "webhook_v2_signing", description: "HMAC-SHA256 signed webhooks with replay protection headers", enabled: true, environment: "staging", rollout: 50, owner: "platform" },
  { key: "subscription_proration", description: "Mid-cycle plan upgrades with automatic proration invoices", enabled: false, environment: "development", rollout: 0, owner: "billing" },
  { key: "multi_currency_settlement", description: "Native settlement in merchant's local currency without forced FX", enabled: true, environment: "production", rollout: 25, owner: "treasury" },
  { key: "adaptive_3ds", description: "PSD2 SCA with risk-based 3DS exemption requests", enabled: true, environment: "production", rollout: 100, owner: "compliance" },
  { key: "open_banking_payouts", description: "Open Banking instant bank transfers for EU payouts", enabled: false, environment: "staging", rollout: 10, owner: "eu-squad" },
  { key: "merchant_analytics_v2", description: "New analytics dashboard with cohort retention and LTV charts", enabled: true, environment: "production", rollout: 60, owner: "analytics" },
  { key: "kyc_document_ocr", description: "Automated OCR extraction for passport and ID card verification", enabled: true, environment: "production", rollout: 90, owner: "kyc-eng" },
  { key: "dynamic_routing_ml", description: "Gateway selection via gradient-boosted cost/approval model", enabled: false, environment: "development", rollout: 0, owner: "risk-eng" },
];

const envCfg: Record<Environment, { label: string; cls: string }> = {
  production: { label: "production", cls: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
  staging: { label: "staging", cls: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
  development: { label: "development", cls: "border-sky-500/25 bg-sky-500/12 text-sky-400" },
};

export default function AdminFlagsPage() {
  const t = useT();
  const [flags, setFlags] = React.useState<FeatureFlag[]>(INITIAL_FLAGS);
  const [search, setSearch] = React.useState("");
  const [envFilter, setEnvFilter] = React.useState("all");

  const toggleFlag = (key: string) => {
    setFlags((cur) =>
      cur.map((f) => (f.key === key ? { ...f, enabled: !f.enabled, rollout: !f.enabled ? (f.rollout > 0 ? f.rollout : 100) : 0 } : f))
    );
    const f = flags.find((x) => x.key === key);
    if (f) {
      toast.success(`Flag "${key}" ${!f.enabled ? "enabled" : "disabled"}`, {
        description: `Environment: ${f.environment} · owner: ${f.owner}`,
      });
    }
  };

  const setRollout = (key: string, value: number) => {
    setFlags((cur) => cur.map((f) => (f.key === key ? { ...f, rollout: value, enabled: value > 0 ? true : f.enabled } : f)));
  };

  const filtered = flags.filter((f) => {
    if (envFilter !== "all" && f.environment !== envFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!f.key.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q) && !f.owner.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const enabled = flags.filter((f) => f.enabled).length;
  const inRollout = flags.filter((f) => f.enabled && f.rollout > 0 && f.rollout < 100).length;
  const disabled = flags.filter((f) => !f.enabled).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.adminFlags")}
        description="Progressive delivery, environment gating and rollout control."
        actions={
          <>
            <Button variant="outline" size="sm">Audit log</Button>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New flag</Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total flags" value={flags.length} icon={Flag} accent="blue" format={(n) => `${Math.round(n)}`} />
        <StatCard label="Enabled" value={enabled} change={8.2} icon={ToggleLeft} accent="green" format={(n) => `${Math.round(n)}`} />
        <StatCard label="In rollout" value={inRollout} icon={FlaskConical} accent="violet" format={(n) => `${Math.round(n)}`} />
        <StatCard label="Disabled" value={disabled} change={-3.4} icon={PowerOff} accent="amber" format={(n) => `${Math.round(n)}`} />
      </div>

      {/* Filters */}
      <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by key, description or owner…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 font-mono text-xs"
            />
          </div>
          <Select value={envFilter} onValueChange={setEnvFilter}>
            <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue placeholder="Environment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All environments</SelectItem>
              <SelectItem value="production" className="text-xs">Production</SelectItem>
              <SelectItem value="staging" className="text-xs">Staging</SelectItem>
              <SelectItem value="development" className="text-xs">Development</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Flags table */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Flags</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} of {flags.length} flags shown</p>
          </div>
          <Rocket className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Key</th>
                <th className="pb-2 font-medium">Environment</th>
                <th className="pb-2 font-medium">Enabled</th>
                <th className="pb-2 font-medium w-1/3">Rollout</th>
                <th className="pb-2 font-medium">Owner</th>
                <th className="pb-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const env = envCfg[f.environment];
                return (
                  <tr key={f.key} className="border-b border-border/30 transition hover:bg-muted/30">
                    <td className="py-3">
                      <p className="font-mono text-xs font-semibold text-primary">{f.key}</p>
                      <p className="mt-0.5 max-w-md truncate text-[11px] text-muted-foreground">{f.description}</p>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className={cn("text-[10px] font-mono", env.cls)}>{env.label}</Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={f.enabled} onCheckedChange={() => toggleFlag(f.key)} />
                        <span className={cn("text-[10px] font-medium", f.enabled ? "text-emerald-400" : "text-muted-foreground")}>
                          {f.enabled ? "on" : "off"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[f.rollout]}
                          onValueChange={(v) => setRollout(f.key, v[0])}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="w-10 text-right font-mono text-[10px] tabular-nums">{f.rollout}%</span>
                      </div>
                      <Progress value={f.rollout} className="mt-1.5 h-0.5" />
                    </td>
                    <td className="py-3">
                      <span className="font-mono text-[11px] text-muted-foreground">{f.owner}</span>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => toast.message(`Editing flag "${f.key}"`, { description: `Owner: ${f.owner} · env: ${f.environment}` })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
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
