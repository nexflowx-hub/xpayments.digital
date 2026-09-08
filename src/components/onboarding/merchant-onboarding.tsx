"use client";

import * as React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe2,
  KeyRound,
  Landmark,
  MessageCircle,
  Server,
  ShieldCheck,
  Smartphone,
  Store as StoreIcon,
  WalletCards,
} from "lucide-react";
import { useUi } from "@/stores/ui";
import { useAuth } from "@/stores/auth";
import { xpApi } from "@/lib/api/xpApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XSymbol } from "@/components/shared/x-symbol";
import type { ApiKey, Store } from "@/types";

const WHATSAPP_NUMBER = "351925386409";

const plans = [
  {
    id: "uk",
    eyebrow: "EUR · Reino Unido",
    title: "Store Dedicada EURO — UK LTD",
    setup: ["€500", "500 USDT", "R$ 3.000"],
    description:
      "Estrutura dedicada para operação em EUR, com entidade UK LTD e infraestrutura técnica exclusiva para o Merchant.",
    items: [
      "Estruturação de UK LTD dedicada",
      "Apoio à abertura de conta bancária para payout",
      "Domínio próprio para a operação",
      "VPS dedicada e API XPayments exclusiva",
      "Número de telemóvel UK para a estrutura",
      "Configuração inicial da Store de Produção",
    ],
  },
  {
    id: "fr",
    eyebrow: "EUR · França",
    title: "Store Dedicada EURO — SAS França",
    setup: ["€850", "850 USDT", "R$ 5.100"],
    description:
      "Estrutura dedicada em França para operação em EUR, preparada para gestão operacional própria ou assistida.",
    items: [
      "Estruturação de sociedade SAS dedicada",
      "Apoio à abertura de conta bancária empresarial",
      "Cartão empresarial quando aprovado pela instituição",
      "Possibilidade de gestão bancária direta pelo Merchant",
      "Domínio próprio, VPS dedicada e API exclusiva",
      "Configuração inicial da Store de Produção",
    ],
  },
  {
    id: "us",
    eyebrow: "USD · Estados Unidos",
    title: "Store Dedicada USD — LLC",
    setup: ["€1.000", "1.000 USDT", "R$ 6.000"],
    description:
      "Estrutura dedicada nos Estados Unidos para uma operação em USD com identidade empresarial e infraestrutura próprias.",
    items: [
      "Estruturação de LLC dedicada",
      "Apoio à configuração bancária/payout da entidade",
      "Domínio próprio para a operação",
      "VPS dedicada e API XPayments exclusiva",
      "Configuração técnica da Store USD",
      "Preparação operacional para processamento e reporting",
    ],
  },
] as const;

function openWhatsApp(plan?: string) {
  const text = encodeURIComponent(
    plan
      ? `Olá. Pretendo validar a contratação do serviço XPayments: ${plan}.`
      : "Olá. Pretendo falar sobre a ativação de uma estrutura dedicada XPayments."
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
}

function SandboxStatus() {
  const [store, setStore] = React.useState<Store | null>(null);
  const [apiKey, setApiKey] = React.useState<ApiKey | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    Promise.all([xpApi.stores.list(), xpApi.apiKeys.list()])
      .then(([stores, keys]) => {
        if (!active) return;
        const sandbox = stores.find(
          (item) => item.name === "XPAY Sandbox" || item.storeCode?.startsWith("XPAY-SANDBOX-")
        ) || null;
        setStore(sandbox);
        setApiKey(
          sandbox
            ? keys.find((key) => key.storeId === sandbox.id && key.environment === "test") || null
            : null
        );
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <span className="text-xs text-muted-foreground">A confirmar o provisionamento…</span>;
  }

  if (!store) {
    return (
      <span className="text-xs text-amber-400">
        Sandbox ainda não visível. O provisionamento pode estar a concluir.
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Ready
      </Badge>
      <span className="font-mono text-muted-foreground">{store.storeCode}</span>
      {apiKey ? (
        <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-1 font-mono text-[10px] text-muted-foreground">
          {apiKey.keyPreview || apiKey.prefix || "xp_test_…"}
        </span>
      ) : null}
    </div>
  );
}

export default function MerchantOnboarding() {
  const user = useAuth((state) => state.user);
  const setAppView = useUi((state) => state.setAppView);
  const setMerchantView = useUi((state) => state.setMerchantView);

  const goTo = (view: string) => {
    setMerchantView(view);
    setAppView("merchant");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(37,99,235,.13),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,.08),transparent_24%)] bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <header className="flex flex-col gap-6 border-b border-border/60 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <XSymbol className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold">XPayments</p>
              <p className="text-xs text-muted-foreground">Merchant Onboarding</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => goTo("dashboard")}>
            Ir para o Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <Badge className="mb-5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10">
              <BadgeCheck className="mr-1.5 h-3.5 w-3.5" /> Ambiente de testes incluído
            </Badge>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Bem-vindo{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. O seu XPAY Sandbox está a ser preparado.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              A XPAY Sandbox permite integrar e validar a API S2S, Checkout XPay Hosted e Embedded/SDK sem utilizar credenciais Live. Quando o fluxo estiver aprovado, pode solicitar uma estrutura dedicada de Produção.
            </p>
          </div>

          <Card className="border-emerald-500/20 bg-emerald-500/[0.06] p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <StoreIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">XPAY Sandbox</p>
                <p className="text-xs text-muted-foreground">EUR · TEST · ORCHESTRATED</p>
              </div>
            </div>
            <div className="mt-5"><SandboxStatus /></div>
            <div className="mt-5 grid gap-2 text-xs text-muted-foreground">
              <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />Sem movimentos Live ou payouts reais.</p>
              <p className="flex gap-2"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />API key TEST criada para chamadas server-to-server.</p>
              <p className="flex gap-2"><Code2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />Hosted, iframe/SDK e métodos habilitados pela Store usam o mesmo core.</p>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { icon: KeyRound, n: "01", title: "Obtenha a API Key", text: "Abra API Keys, revele a chave xp_test_ apenas quando precisar e mantenha-a exclusivamente no backend." },
            { icon: Code2, n: "02", title: "Integre e teste", text: "Use /payments/charge para S2S ou crie CheckoutSessions para Redirect, Hosted e Embedded/SDK." },
            { icon: ShieldCheck, n: "03", title: "Passe para Produção", text: "Depois da certificação Sandbox, valide KYC, estrutura dedicada e condições da Store Live com a equipa XPayments." },
          ].map((step) => (
            <Card key={step.n} className="border-border/60 bg-card/60 p-5">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><step.icon className="h-5 w-5" /></div>
                <span className="font-mono text-xs text-muted-foreground">{step.n}</span>
              </div>
              <h2 className="mt-5 font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
            </Card>
          ))}
        </section>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => goTo("api-keys")}><KeyRound className="mr-2 h-4 w-4" />Abrir API Keys</Button>
          <Button variant="outline" onClick={() => goTo("developers")}><ExternalLink className="mr-2 h-4 w-4" />Ver documentação</Button>
        </div>

        <section className="mt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Produção dedicada</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Opções de contratação de serviços</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Os valores abaixo correspondem ao setup e aos custos iniciais de estruturação. São alternativas de pagamento — não cumulativas. A prestação continuada de gestão operacional é de <strong className="text-foreground">20% da faturação processada</strong> e pode incluir o fluxo operacional até BRL ou USDT, conforme a operação contratada.
            </p>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex h-full flex-col border-border/70 bg-card/70 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{plan.eyebrow}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{plan.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{plan.description}</p>

                <div className="mt-5 rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Setup inicial</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {plan.setup.map((price) => <Badge key={price} variant="outline" className="font-mono">{price}</Badge>)}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {plan.items.map((item) => (
                    <div key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 text-xs leading-5 text-muted-foreground">
                  <strong className="text-foreground">Gestão operacional: 20% da faturação.</strong> Inclui acompanhamento da operação e fluxo até BRL ou USDT quando aplicável ao contrato.
                </div>

                <Button className="mt-6 w-full" onClick={() => openWhatsApp(plan.title)}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Validar contratação
                </Button>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-500/20 bg-amber-500/[0.05] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Elegibilidade e aprovação</p>
              <p className="mt-1">
                Constituição societária, conta bancária, cartões, adquirência, payout e outros serviços de terceiros estão sujeitos a KYC/KYB, análise de atividade, regras locais e aprovação independente de cada instituição. A XPayments não apresenta estes elementos como aprovação garantida.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-4 border-t border-border/60 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Ativação e validação comercial · WhatsApp +351 925 386 409
          </div>
          <Button variant="outline" onClick={() => openWhatsApp()}>
            <MessageCircle className="mr-2 h-4 w-4" /> Falar com a equipa XPayments
          </Button>
        </footer>
      </div>
    </main>
  );
}
