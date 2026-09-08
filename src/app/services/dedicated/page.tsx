import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Globe2,
  Landmark,
  MessageCircle,
  Server,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { XSymbol } from "@/components/shared/x-symbol";

export const metadata: Metadata = {
  title: "Estruturas Dedicadas para Merchants | XPayments",
  description:
    "Conheça as opções XPayments para estruturas dedicadas em EUR e USD: UK LTD, SAS França, LLC EUA e Premium Portugal, com infraestrutura técnica e acompanhamento operacional.",
  alternates: {
    canonical: "/services/dedicated",
  },
  openGraph: {
    title: "Estruturas Dedicadas para Merchants | XPayments",
    description:
      "Estruturas empresariais e técnicas dedicadas para operações em EUR e USD, com onboarding, infraestrutura, KYC/KYB e acompanhamento XPayments.",
    url: "https://xpayments.digital/services/dedicated",
    type: "website",
  },
};

const WHATSAPP_NUMBER = "351925386409";

const services = [
  {
    id: "uk",
    label: "EUR · Reino Unido",
    title: "Store Dedicada EURO — UK LTD",
    setup: ["€500", "500 USDT", "R$ 3.000"],
    intro:
      "Estrutura dedicada para Merchant que pretende operar em EUR com identidade empresarial, infraestrutura e configuração próprias.",
    premium: false,
    items: [
      { icon: Building2, text: "Estruturação de UK LTD dedicada" },
      { icon: Landmark, text: "Apoio à abertura de conta bancária para payout" },
      { icon: Globe2, text: "Domínio próprio para a operação" },
      { icon: Server, text: "VPS dedicada e API XPayments exclusiva" },
      { icon: Smartphone, text: "Número de telemóvel UK para a estrutura" },
      { icon: WalletCards, text: "Configuração inicial da Store de Produção" },
    ],
  },
  {
    id: "fr",
    label: "EUR · França",
    title: "Store Dedicada EURO — SAS França",
    setup: ["€850", "850 USDT", "R$ 5.100"],
    intro:
      "Estrutura dedicada em França para operações em EUR, preparada para gestão operacional própria ou assistida pelo Merchant.",
    premium: false,
    items: [
      { icon: Building2, text: "Estruturação de sociedade SAS dedicada" },
      { icon: Landmark, text: "Apoio à abertura de conta bancária empresarial" },
      { icon: WalletCards, text: "Cartão empresarial quando aprovado pela instituição" },
      { icon: ShieldCheck, text: "Possibilidade de gestão bancária direta pelo Merchant" },
      { icon: Globe2, text: "Domínio próprio para a operação" },
      { icon: Server, text: "VPS dedicada, API exclusiva e Store de Produção" },
    ],
  },
  {
    id: "us",
    label: "USD · Estados Unidos",
    title: "Store Dedicada USD — LLC",
    setup: ["€1.000", "1.000 USDT", "R$ 6.000"],
    intro:
      "Estrutura dedicada nos Estados Unidos para Merchant que pretende operar em USD com entidade e infraestrutura próprias.",
    premium: false,
    items: [
      { icon: Building2, text: "Estruturação de LLC dedicada" },
      { icon: Landmark, text: "Apoio à configuração bancária e payout" },
      { icon: Globe2, text: "Domínio próprio para a operação" },
      { icon: Server, text: "VPS dedicada e API XPayments exclusiva" },
      { icon: WalletCards, text: "Configuração técnica da Store USD" },
      { icon: ShieldCheck, text: "Preparação operacional para processamento e reporting" },
    ],
  },
  {
    id: "pt-premium",
    label: "PREMIUM · Portugal · EUR",
    title: "Estrutura Empresarial Real Ativa — Portugal",
    setup: ["€5.000", "5.000 USDT", "R$ 30.000"],
    intro:
      "Serviço Premium para atividades legítimas, de baixa contestação e perfil operacional compatível com adquirência, incluindo projetos de donativos quando elegíveis.",
    premium: true,
    items: [
      { icon: Building2, text: "Estrutura empresarial portuguesa real e ativa" },
      { icon: WalletCards, text: "Operação D0/D1 quando aplicável ao fluxo aprovado e contratado" },
      { icon: ShieldCheck, text: "Cessão/transferência e atualização societária por via regular" },
      { icon: BadgeCheck, text: "KYC/KYB e atualização de beneficiário efetivo obrigatórios" },
      { icon: CheckCircle2, text: "Disponibilidade atual limitada a 5 estruturas" },
      { icon: ArrowRight, text: "Prazo previsto de até 3 dias após validação documental e formalização" },
    ],
  },
] as const;

function whatsappHref(title: string) {
  const text = encodeURIComponent(
    `Olá. Pretendo validar a contratação do serviço XPayments: ${title}.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function DedicatedServicesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(37,99,235,.14),transparent_30%),radial-gradient(circle_at_90%_5%,rgba(16,185,129,.08),transparent_25%)] bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <header className="flex flex-col gap-5 border-b border-border/60 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="flex items-center gap-3">
            <XSymbol className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold">XPayments</p>
              <p className="text-xs text-muted-foreground">Dedicated Merchant Services</p>
            </div>
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4" /> Falar com a equipa
          </a>
        </header>

        <section className="grid gap-8 py-14 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BadgeCheck className="h-3.5 w-3.5" /> Produção dedicada XPayments
            </div>
            <h1 className="max-w-5xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Estruturas dedicadas para levar a sua operação da Sandbox à Produção.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Escolha uma estrutura empresarial e técnica adequada à moeda, jurisdição e modelo operacional do seu projeto. A equipa XPayments acompanha o setup técnico, onboarding e preparação da Store para Produção.
            </p>
          </div>

          <div className="rounded-3xl border border-primary/20 bg-primary/[0.05] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Gestão operacional</p>
            <p className="mt-3 text-3xl font-semibold">20% da faturação processada</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Inclui acompanhamento operacional e pode incluir o fluxo até BRL ou USDT, conforme a modalidade contratada e as condições aplicáveis à operação.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.id}
              className={`flex h-full flex-col rounded-3xl border p-6 sm:p-8 ${service.premium ? "border-amber-500/30 bg-amber-500/[0.045]" : "border-border/70 bg-card/65"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${service.premium ? "text-amber-400" : "text-primary"}`}>
                  {service.label}
                </p>
                {service.premium ? (
                  <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                    5 unidades disponíveis
                  </span>
                ) : null}
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight">{service.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{service.intro}</p>

              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Custo inicial da estrutura</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {service.setup.map((price) => (
                    <span key={price} className="rounded-md border border-border px-2.5 py-1 font-mono text-sm">
                      {price}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Formas alternativas de pagamento; valores não cumulativos.</p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {service.items.map((item) => (
                  <div key={item.text} className="flex gap-3 rounded-xl border border-border/50 bg-background/35 p-3 text-sm text-muted-foreground">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-7">
                <a
                  href={whatsappHref(service.title)}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-opacity hover:opacity-90 ${service.premium ? "bg-amber-500 text-black" : "bg-primary text-primary-foreground"}`}
                >
                  <MessageCircle className="h-4 w-4" /> Validar disponibilidade e contratação
                </a>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-semibold">KYC/KYB obrigatório</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A contratação depende de identificação do Merchant, atividade, beneficiários efetivos, documentação societária e análise de elegibilidade.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
            <Landmark className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-semibold">Banking e adquirência independentes</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Conta bancária, cartão, adquirência, payout e limites dependem de aprovação das instituições correspondentes e não são garantidos pela XPayments.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
            <Server className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-semibold">Infraestrutura dedicada</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Quando incluído no pacote, domínio, VPS, API e Store são preparados para a estrutura contratada e separados da XPAY Sandbox de testes.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-amber-500/20 bg-amber-500/[0.05] p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm leading-7 text-muted-foreground">
              <p className="font-semibold text-foreground">Condições e elegibilidade</p>
              <p className="mt-1">
                As ofertas correspondem a serviços de estruturação e acompanhamento. Constituição ou transferência societária, banking, cartões, adquirência, payout e outros serviços de terceiros dependem de KYC/KYB, regras locais e aprovação independente. O serviço Premium Portugal destina-se exclusivamente a atividades lícitas e não pode ser utilizado para contornar políticas de risco, compliance ou aceitação de providers.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-4 border-t border-border/60 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">XPayments Dedicated Services</p>
            <p className="mt-1 text-xs text-muted-foreground">Ativação e validação comercial · WhatsApp +351 925 386 409</p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá. Pretendo receber informação sobre as estruturas dedicadas XPayments.")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4" /> Contactar XPayments
          </a>
        </footer>
      </div>
    </main>
  );
}
