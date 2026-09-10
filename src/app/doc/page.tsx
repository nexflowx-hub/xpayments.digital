import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  Code2,
  ExternalLink,
  KeyRound,
  Layers3,
  Link2,
  MonitorUp,
  QrCode,
  Replace,
  ShieldCheck,
  Store,
  Webhook,
} from "lucide-react";

export const metadata: Metadata = {
  title: "XPayments Developer Docs",
  description:
    "Portal público para integrar XPayments: PIX e API S2S, Checkout XPay Hosted/Embedded, Stripe-compatible Direct e playbooks para agentes de IA.",
  alternates: { canonical: "https://xpayments.digital/doc" },
};

const panel =
  "rounded-[28px] border border-zinc-200/80 bg-white/90 shadow-[0_22px_70px_-45px_rgba(15,23,42,.35)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90";

export default function DeveloperDocsHome() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff_0,transparent_36%),linear-gradient(#fafafa,#f4f4f5)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top,#161b2e_0,transparent_34%),linear-gradient(#09090b,#000)] dark:text-zinc-50">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <nav className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-950 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-950">XP</span>
            XPayments Developers
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/doc/s2s" className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-950">S2S</Link>
            <Link href="/doc/pix" className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">PIX</Link>
            <Link href="/doc/checkout" className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-950">Checkout</Link>
            <Link href="/doc/stripe" className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300">Stripe-compatible</Link>
            <Link href="/doc/ai" className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">Integrar com IA</Link>
          </div>
        </nav>

        <header className="relative mt-14 overflow-hidden rounded-[34px] border border-zinc-200/80 bg-zinc-950 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14 dark:border-zinc-800">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Core XPayments · Developer Platform
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Integre pagamentos sem duplicar complexidade.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              API S2S Native — incluindo PIX para Stores BRL habilitadas — Checkout XPay Hosted/Embedded e Stripe-compatible Direct para projetos com Payment Intents/Elements. Store, GatewayVault, routing e confirmação por webhook permanecem no core XPayments.
            </p>
          </div>
        </header>

        <section className="mt-10">
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Antes de integrar</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Preparar a conta em quatro passos</h2></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SetupCard number="01" icon={Store} title="Configure a Store" text="Confirme moeda, ambiente, métodos ativos e routing. Uma API Key pertence a uma Store." />
            <SetupCard number="02" icon={KeyRound} title="Crie uma API Key" text="Use xp_test_ no Sandbox e xp_live_ em produção. Nunca exponha xp_* no browser." />
            <SetupCard number="03" icon={Webhook} title="Configure Webhooks" text="O estado financeiro definitivo vem da XPayments. Redirect, pending e requires_action não significam liquidação." />
            <SetupCard number="04" icon={ShieldCheck} title="Separe Test e Live" text="A XPayments bloqueia combinações incompatíveis entre API Keys e gateways de ambientes diferentes." />
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Escolha a integração</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Três superfícies de pagamento + um assistente de implementação</h2></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/doc/s2s" className={`${panel} group relative overflow-hidden p-6 transition-transform hover:-translate-y-1`}>
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="relative"><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Braces className="h-6 w-6" /></div><ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" /></div><div className="mt-6 flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">API 01 · S2S</p><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">STABLE CORE</span></div><h3 className="mt-2 text-xl font-bold tracking-tight">Server-to-Server</h3><p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Backend do Merchant cria pagamentos e controla a UI de cada action.</p><div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">POST /api/v1/payments/charge</div></div>
            </Link>

            <Link href="/doc/pix" className={`${panel} group relative overflow-hidden p-6 transition-transform hover:-translate-y-1`}>
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative"><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><QrCode className="h-6 w-6" /></div><ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" /></div><div className="mt-6 flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Método · PIX</p><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">CREATE VERIFIED</span></div><h3 className="mt-2 text-xl font-bold tracking-tight">PIX S2S</h3><p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">BRL, QR Code, Copia e Cola e confirmação assíncrona para Stores habilitadas.</p><div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">payment_method_types=[pix]</div></div>
            </Link>

            <Link href="/doc/checkout" className={`${panel} group relative overflow-hidden p-6 transition-transform hover:-translate-y-1`}>
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="relative"><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"><Layers3 className="h-6 w-6" /></div><ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" /></div><div className="mt-6 flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-300">API 02 · Checkout</p><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">HOSTED CERTIFIED</span></div><h3 className="mt-2 text-xl font-bold tracking-tight">Checkout XPay</h3><p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Hosted ou iframe payment-only para integração provider-neutral.</p><div className="mt-5 grid gap-2"><MiniMode icon={ExternalLink} label="Hosted /pay/:id" /><MiniMode icon={MonitorUp} label="Embedded /embed/:id" /></div></div>
            </Link>

            <Link href="/doc/stripe" className={`${panel} group relative overflow-hidden p-6 transition-transform hover:-translate-y-1`}>
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />
              <div className="relative"><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-300"><Replace className="h-6 w-6" /></div><ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" /></div><div className="mt-6 flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">API 03 · Stripe-compatible</p><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">E2E CERTIFIED</span></div><h3 className="mt-2 text-xl font-bold tracking-tight">Payment Intents + Elements</h3><p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Cartão certificado E2E em Stripe TEST: PaymentIntent, webhook, Finance Core, ledger e replay idempotente. Browser usa pk_* da Store.</p><div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">POST /api/stripe/v1/payment_intents</div></div>
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-violet-500/20 bg-violet-500/[0.06] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-violet-700 dark:text-violet-300"><Bot className="h-5 w-5" /><p className="text-xs font-bold uppercase tracking-[.16em]">AI Integration Playbooks</p></div><h2 className="mt-3 text-2xl font-bold tracking-tight">O seu agente de IA pode implementar a integração a partir de um prompt oficial XPayments.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">Prompts prontos para PIX S2S, Checkout XPay, Stripe-compatible + Payment Element e um modo universal que primeiro analisa o repositório e escolhe o contrato adequado. Nenhum segredo real precisa ser colado na IA.</p></div><Link href="/doc/ai" className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black">Abrir prompts <ArrowRight className="h-4 w-4" /></Link></div>
        </section>

        <section className="mt-14 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <div className={`${panel} p-6`}><Code2 className="h-5 w-5 text-zinc-500" /><h2 className="mt-4 text-lg font-semibold">Qual escolher?</h2><div className="mt-4 space-y-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400"><p><strong className="text-zinc-950 dark:text-white">Native S2S:</strong> PIX, MB WAY e métodos com action própria; Merchant controla a UI.</p><p><strong className="text-zinc-950 dark:text-white">Checkout XPay:</strong> provider-neutral e ideal para amplitude de métodos sem gerir SDK do provider.</p><p><strong className="text-zinc-950 dark:text-white">Stripe-compatible:</strong> migração de Stripe Payment Intents. Payment Element usa a pk_* pública da Store.</p></div></div>
          <div className={`${panel} p-6`}><Link2 className="h-5 w-5 text-zinc-500" /><h2 className="mt-4 text-lg font-semibold">Regra de confirmação</h2><div className="mt-5 grid gap-2 sm:grid-cols-5">{['Store','API Key','Payment / Session','Transaction','Webhook'].map((step,index)=><div key={step} className="relative rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-800 dark:bg-black"><p className="text-[9px] font-bold text-zinc-400">0{index+1}</p><p className="mt-1 text-[11px] font-semibold">{step}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-zinc-500">Considere uma cobrança paga apenas quando a Transaction XPayments estiver <code>succeeded</code> / o webhook Merchant indicar sucesso. <code>pending</code>, <code>requires_action</code>, redirect e retorno ao site são estados de fluxo/UX.</p></div>
        </section>

        <footer className="mt-14 flex flex-col gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"><span>XPayments Developer Platform</span><span>Native · /api/v1 · Stripe-compatible · /api/stripe/v1</span></footer>
      </div>
    </main>
  );
}

function SetupCard({ number, icon: Icon, title, text }: { number: string; icon: React.ElementType; title: string; text: string }) {
  return <div className={`${panel} p-5`}><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"><Icon className="h-5 w-5" /></div><span className="font-mono text-[10px] font-bold text-zinc-400">{number}</span></div><h3 className="mt-5 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{text}</p></div>;
}

function MiniMode({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] font-medium dark:border-zinc-800 dark:bg-black"><Icon className="h-3.5 w-3.5 text-zinc-500" /> {label}</div>;
}