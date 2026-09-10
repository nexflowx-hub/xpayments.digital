import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  ExternalLink,
  Gauge,
  KeyRound,
  Layers3,
  QrCode,
  Replace,
  ShieldCheck,
  Store,
  Webhook,
} from "lucide-react";

export const metadata: Metadata = {
  title: "XPayments Developer Platform",
  description:
    "Quick-start XPayments: Stores, API Keys, Webhooks, Native S2S, PIX, Checkout XPay, Stripe-compatible Direct e documentação técnica completa.",
  alternates: { canonical: "https://xpayments.digital/doc" },
};

const panel =
  "rounded-[28px] border border-zinc-200/80 bg-white/90 shadow-[0_22px_70px_-45px_rgba(15,23,42,.35)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90";

const methods = [
  "Cards",
  "PIX",
  "MB WAY",
  "Multibanco",
  "Bizum",
  "Bancontact",
  "BLIK",
  "iDEAL / Wero",
  "EPS",
  "Klarna",
  "Amazon Pay",
  "Link",
  "Apple Pay",
  "Google Pay",
  "Satispay",
];

export default function DeveloperDocsHome() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff_0,transparent_36%),linear-gradient(#fafafa,#f4f4f5)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top,#161b2e_0,transparent_34%),linear-gradient(#09090b,#000)] dark:text-zinc-50">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-950 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-950">XP</span>
            XPayments Developers
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/doc/s2s" className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-950">S2S</Link>
            <Link href="/doc/pix" className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">PIX</Link>
            <Link href="/doc/checkout" className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-950">Checkout</Link>
            <Link href="/doc/stripe" className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300">Stripe Direct</Link>
            <Link href="/doc/ai" className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">Integrar com IA</Link>
            <a
              href="https://docs.xpayments.digital"
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-black"
            >
              Docs completas <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </nav>

        <header className="relative mt-12 overflow-hidden rounded-[34px] border border-zinc-200/80 bg-zinc-950 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14 dark:border-zinc-800">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Developer Platform · v3.1 · VNEXT
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Uma Store. Uma API. Vários rails de pagamento.</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
              Este é o quick-start visual da XPayments. A documentação técnica canónica, OpenAPI, onboarding de Stores,
              credenciais, routing, webhooks, exemplos e payment-method matrix está publicada em docs.xpayments.digital.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://docs.xpayments.digital"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
              >
                Abrir Developer Docs <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/doc/ai"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Integrar com IA <Bot className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Onboarding</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Preparar uma integração em quatro passos</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SetupCard number="01" icon={Store} title="Store" text="Crie/selecione a Store, moeda e domínio. Novas Stores começam em draft até o routing ser ativado." />
            <SetupCard number="02" icon={KeyRound} title="API Key" text="Crie uma xp_test_* ou xp_live_* Store-scoped com payments_write. Nunca a exponha no browser." />
            <SetupCard number="03" icon={Webhook} title="Merchant Webhook" text="Configure HTTPS e guarde o signing secret. Verifique x-nexflowx-signature sobre o raw body." />
            <SetupCard number="04" icon={ShieldCheck} title="TEST → LIVE" text="Certifique routing, idempotência e webhook em TEST antes de habilitar tráfego LIVE." />
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Payment APIs</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Escolha a superfície adequada ao produto</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <SurfaceCard
              href="/doc/s2s"
              icon={Braces}
              eyebrow="API 01 · Native"
              title="Native S2S"
              text="Merchant controla a UI e consome actions de métodos como PIX, MB WAY, Multibanco e Bizum em Stores habilitadas."
              code="POST /api/v1/payments/charge"
            />
            <SurfaceCard
              href="/doc/checkout"
              icon={Layers3}
              eyebrow="API 02 · Checkout"
              title="Checkout XPay"
              text="Hosted/Embedded provider-neutral. A Store define branding, métodos e routing; a finalização continua webhook-driven."
              code="POST /api/v1/checkout/session"
            />
            <SurfaceCard
              href="/doc/stripe"
              icon={Replace}
              eyebrow="API 03 · Stripe-compatible"
              title="Stripe Direct + Elements"
              text="PaymentIntents via XPayments e Stripe.js/Payment Element no browser. Fluxo de cartão certificado em TEST e LIVE."
              code="POST /api/stripe/v1/payment_intents"
            />
          </div>
        </section>

        <section className="mt-14 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className={`${panel} p-6 sm:p-8`}>
            <div className="flex items-center gap-2 text-zinc-500">
              <QrCode className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-[.16em]">Payment methods</p>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Métodos por Store, surface e provider eligibility.</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              A disponibilidade real depende de moeda, país, capabilities e routing. Stripe Direct pode usar automatic payment methods; Checkout expõe apenas métodos configurados na Store.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {methods.map((method) => (
                <span key={method} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium dark:border-zinc-800 dark:bg-black">
                  {method}
                </span>
              ))}
            </div>
          </div>

          <div className={`${panel} p-6 sm:p-8`}>
            <Gauge className="h-5 w-5 text-amber-500" />
            <h2 className="mt-4 text-xl font-bold">Rails D0 · Premium</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Rails operacionais acelerados podem ser disponibilizados a Merchants Premium elegíveis, sujeitos a limites, risco, moeda, funding e configuração específica.
            </p>
            <a
              href="https://xpay.expert"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Falar sobre D0 / infraestrutura avançada <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-violet-500/20 bg-violet-500/[0.06] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <Bot className="h-5 w-5" />
                <p className="text-xs font-bold uppercase tracking-[.16em]">AI-ready</p>
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Entregue o contrato XPayments diretamente ao seu agente de desenvolvimento.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Os playbooks oficiais separam server/browser secrets, idempotência, Store binding, Payment Element, raw-body webhook verification e financial finality.
              </p>
            </div>
            <Link href="/doc/ai" className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black">
              Abrir AI Playbooks <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-14 rounded-[30px] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
          <h2 className="text-xl font-bold">Regra de confirmação</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-5">
            {["Store", "API Key", "Payment / Session", "Transaction", "Webhook"].map((step, index) => (
              <div key={step} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-800 dark:bg-black">
                <p className="text-[9px] font-bold text-zinc-400">0{index + 1}</p>
                <p className="mt-1 text-[11px] font-semibold">{step}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            <code>pending</code>, <code>requires_action</code>, redirects, QR generation e retorno ao site não são liquidação. O Order deve ser finalizado pelo estado autoritativo da Transaction / Merchant webhook XPayments.
          </p>
        </section>

        <footer className="mt-14 flex flex-col gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <span>XPayments Developer Platform · Quick Start</span>
          <a href="https://docs.xpayments.digital" className="inline-flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
            Documentação técnica canónica <ExternalLink className="h-3 w-3" />
          </a>
        </footer>
      </div>
    </main>
  );
}

function SetupCard({
  number,
  icon: Icon,
  title,
  text,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className={`${panel} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-mono text-[10px] font-bold text-zinc-400">{number}</span>
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  );
}

function SurfaceCard({
  href,
  icon: Icon,
  eyebrow,
  title,
  text,
  code,
}: {
  href: string;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  text: string;
  code: string;
}) {
  return (
    <Link href={href} className={`${panel} group p-6 transition-transform hover:-translate-y-1`}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{text}</p>
      <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">{code}</div>
    </Link>
  );
}
