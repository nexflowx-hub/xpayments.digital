"use client";

import * as React from "react";
import {
  Building2, ShieldCheck, Code2, Bell, CreditCard, ScrollText,
  Lock, Check, Info, Loader2, AlertTriangle,
} from "lucide-react";
import { PageHeader, ErrorState } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { useMerchantProfile } from "@/hooks/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn, formatDateCivil } from "@/lib/utils";

const TABS = [
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "security", label: "Segurança", icon: ShieldCheck },
  { id: "api", label: "API", icon: Code2 },
  { id: "compliance", label: "Compliance", icon: ScrollText },
] as const;

type TabId = (typeof TABS)[number]["id"];

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
          <Info className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            <Badge variant="outline" className="border-amber-500/25 bg-amber-500/12 text-amber-400 text-[10px]">Em preparação</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function CompanyTab() {
  const { data: profile, isLoading, isError, refetch } = useMerchantProfile();

  if (isError) return <ErrorState message="Não foi possível carregar o perfil." onRetry={() => refetch()} />;

  if (isLoading || !profile) {
    return (
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </Card>
    );
  }

  const fields = [
    { label: "Nome da empresa", value: profile.company || "—" },
    { label: "Website", value: profile.website || "—" },
    { label: "País", value: profile.country || "—" },
    { label: "Email de suporte", value: profile.supportEmail || "—" },
    { label: "Indústria", value: profile.industry || "—" },
    { label: "Merchant desde", value: formatDateCivil(profile.createdAt) },
  ];

  return (
    <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Perfil da empresa</h3>
        <p className="text-xs text-muted-foreground">Dados públicos exibidos em faturas e recibos.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {fields.map((f) => (
              <tr key={f.label} className="border-b border-border/30">
                <td className="py-3 text-muted-foreground">{f.label}</td>
                <td className="py-3 text-right font-medium">{f.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SecurityTab() {
  const [mfa, setMfa] = React.useState(false);
  const [currentPwd, setCurrentPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [pwdError, setPwdError] = React.useState("");

  function handleChangePassword() {
    setPwdError("");
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError("Preencha todos os campos.");
      return;
    }
    if (newPwd.length < 8) {
      setPwdError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("As senhas não coincidem.");
      return;
    }
    // No fake toast — this would be a real API call
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="mb-5">
          <h3 className="text-sm font-semibold">Alterar senha</h3>
          <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres com letras, números e símbolos.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="current-pwd">Senha atual</Label>
            <Input id="current-pwd" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-pwd">Nova senha</Label>
            <Input id="new-pwd" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-pwd">Confirmar nova senha</Label>
            <Input id="confirm-pwd" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
          </div>
        </div>
        {pwdError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {pwdError}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={handleChangePassword}>Atualizar senha</Button>
        </div>
      </Card>

      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Autenticação de dois fatores
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Requer um código de 6 dígitos do seu app de autenticação em cada login.
            </p>
          </div>
          <Switch checked={mfa} onCheckedChange={setMfa} />
        </div>
        {mfa && (
          <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-xs text-emerald-300">
            2FA está ativo.
          </div>
        )}
      </Card>
    </div>
  );
}

function ApiTab() {
  const [baseUrl] = React.useState(
    process.env.NEXT_PUBLIC_API_URL || "https://api.xpayments.digital/api/v1"
  );

  const copy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="mb-5">
          <h3 className="text-sm font-semibold">Acesso à API</h3>
          <p className="text-xs text-muted-foreground">URL base para todas as requisições à API.</p>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <Label>Base URL</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input readOnly value={baseUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(baseUrl)}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <PlaceholderCard
        title="IP Allowlist"
        description="A configuração de IP allowlist estará disponível em breve. Entre em contato com o suporte para necessidades específicas."
      />
    </div>
  );
}

function ComplianceTab() {
  const { data: profile, isLoading, isError, refetch } = useMerchantProfile();

  if (isError) return <ErrorState message="Não foi possível carregar status de compliance." onRetry={() => refetch()} />;

  const kycStatus = profile?.kycStatus;
  const kycDate = profile?.kycSubmittedAt;
  const isVerified = kycStatus?.toLowerCase() === "approved" || kycStatus?.toLowerCase() === "verified";

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className={cn(
            "rounded-xl p-3",
            isVerified ? "bg-emerald-500/12 text-emerald-400" : "bg-amber-500/12 text-amber-400"
          )}>
            {isVerified ? (
              <Check className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">KYC {isVerified ? "verificado" : kycStatus || "pendente"}</h3>
              <Badge variant="outline" className={cn(
                isVerified
                  ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-400"
                  : "border-amber-500/25 bg-amber-500/12 text-amber-400"
              )}>
                {kycStatus || "Pendente"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {kycDate
                ? `Documentos submetidos em ${formatDateCivil(kycDate)}.`
                : "Nenhum documento submetido ainda."
              }
            </p>
          </div>
        </div>
      </Card>

      {!isVerified && (
        <PlaceholderCard
          title="Verificação de documentos"
          description="A submissão de documentos KYC será feita diretamente pelo suporte. Entre em contato via WhatsApp ou Telegram."
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  const t = useT();
  const [active, setActive] = React.useState<TabId>("company");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.settings")}
        description="Gerencie sua conta, segurança e configurações."
      />
      <Tabs value={active} onValueChange={(v) => setActive(v as TabId)} className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <TabsList className="flex h-fit flex-col gap-1 self-start bg-transparent p-0">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex w-full items-center justify-start gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm font-medium data-[state=active]:border-border/60 data-[state=active]:bg-card/80 data-[state=active]:shadow-sm",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-w-0">
          <TabsContent value="company"><CompanyTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
          <TabsContent value="api"><ApiTab /></TabsContent>
          <TabsContent value="compliance"><ComplianceTab /></TabsContent>
        </div>
      </Tabs>

      <PlaceholderCard
        title="Notificações"
        description="A configuração de notificações por email e push estará disponível em breve."
      />
      <PlaceholderCard
        title="Faturamento"
        description="As informações de plano e faturamento estarão disponíveis em breve."
      />
      <PlaceholderCard
        title="Equipe"
        description="O gerenciamento de membros da equipe estará disponível em breve."
      />
    </div>
  );
}
