import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  MonitorUp,
  Palette,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "XPayments Checkout API — Redirect & Embedded",
  description:
    "Integre Checkout XPay por redirecionamento ou modal iframe, com branding por Store, localização, Stripe Payment Element e webhooks.",
  alternates: {
    canonical: "https://xpayments.digital/doc/checkout",
  },
};

const code = "rounded-2xl border border-white/10 bg-black p-4 overflow-x-auto text-xs leading-6 text-zinc-200 font-mono shadow-inner";
const card = "rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_16px_50px_-38px_rgba(15,23,42,.45)] dark:border-zinc-800 dark:bg-zinc-950";

export default function CheckoutDocsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/doc" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Developer Docs</Link>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Checkout API VNext
          </span>
        </div>

        <header className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">API 02</p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Checkout XPay</h1>
          <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Crie uma única CheckoutSession e escolha como apresentar o pagamento: numa página externa XPayments ou num modal/iframe sobre a página do Merchant. Os dois modos usam a mesma Store, routing, GatewayVault, Transaction e webhooks.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className={card}>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><ExternalLink className="h-5 w-5" /></div>
            <h2 className="mt-4 text-lg font-semibold">A. Redirect Checkout</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Redirecione para <code>checkout.xpayments.digital/pay/:sessionId</code>. Depois de <code>succeeded</code>, o Checkout retorna automaticamente ao <code>returnUrl</code> do Merchant.
            </p>
          </div>
          <div className={card}>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"><MonitorUp className="h-5 w-5" /></div>
            <h2 className="mt-4 text-lg font-semibold">B. Embedded / iframe</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              O SDK abre a mesma sessão num modal seguro. Quando a sessão chega a <code>succeeded</code>, o iframe envia <code>XPAYMENTS_STATUS: SUCCESS</code>, fecha o modal e executa <code>onSuccess</code>.
            </p>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">1. Criar a CheckoutSession</h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Esta chamada é sempre server-to-server. Nunca coloque <code>xp_live_</code> ou <code>xp_test_</code> no JavaScript público do browser.
          </p>
          <pre className={code}>{`curl -X POST https://api.xpayments.digital/api/v1/checkout/session \\
  -H "Authorization: Bearer xp_test_********************************" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1500,
    "currency": "EUR",
    "reference": "ORDER-2026-1001",
    "customerEmail": "cliente@example.com",
    "returnUrl": "https://merchant.example/order/1001",
    "allowedOrigin": "https://merchant.example",
    "metadata": {
      "customerName": "João Martins",
      "description": "Order #1001"
    }
  }'`}</pre>
          <p className="text-xs leading-5 text-zinc-500"><strong>amount</strong> é sempre a menor unidade monetária: <code>1500 EUR = €15,00</code>.</p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold">2. Resposta</h2>
          <pre className={code}>{`{
  "success": true,
  "data": {
    "sessionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "checkoutUrl": "https://checkout.xpayments.digital/pay/xxxxxxxx-...",
    "embedUrl": "https://checkout.xpayments.digital/embed/xxxxxxxx-...",
    "expiresAt": "2026-09-05T18:30:00.000Z"
  }
}`}</pre>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <h2 className="text-xl font-bold">Redirect URL</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Use o <code>checkoutUrl</code> devolvido pela API.</p>
            <pre className={`${code} mt-4`}>{`window.location.href = checkoutUrl;`}</pre>
            <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-zinc-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> O retorno ao Merchant só ocorre depois do estado financeiro confirmado.</div>
          </div>

          <div className={card}>
            <h2 className="text-xl font-bold">Embedded SDK</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">O Merchant não precisa construir ou gerir o iframe manualmente.</p>
            <pre className={`${code} mt-4`}>{`<script src="https://checkout.xpayments.digital/xpay.js"></script>
<script>
  XPayments.open({
    sessionId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    theme: "light",
    onSuccess: () => {
      // Atualize pedido / UI do Merchant
      window.location.reload();
    },
    onClose: (reason) => {
      console.log("Checkout closed", reason);
    }
  });
</script>`}</pre>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-500" /><h2 className="text-2xl font-bold">3. Métodos de pagamento</h2></div>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            O Checkout apresenta métodos rápidos e um modo Stripe dinâmico. A Store continua a controlar quais métodos estão configurados no provider.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["card", "Cartões"],
              ["mb_way", "MB WAY"],
              ["bizum", "Bizum"],
              ["multibanco", "Multibanco"],
              ["stripe_all", "Mais opções"],
            ].map(([method, label]) => (
              <div key={method} className={card}>
                <code className="text-xs font-semibold">{method}</code>
                <p className="mt-2 text-sm">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            <strong className="text-zinc-950 dark:text-white">Mais opções</strong> utiliza o Stripe Payment Element com métodos dinâmicos. Stripe filtra e ordena os métodos elegíveis com base em moeda, restrições, dispositivo e configuração do provider. Não é um segundo checkout financeiro.
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <div className="flex items-center gap-2"><Palette className="h-5 w-5 text-cyan-500" /><h2 className="text-xl font-bold">Branding por Store</h2></div>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Em <strong>Stores → Gerenciar → Checkout Branding</strong>, configure nome público, logo HTTPS, cor e tema. O <code>store.name</code> interno e o Store Code não são alterados.
            </p>
            <p className="mt-3 text-xs text-zinc-500">Isto permite que uma Store técnica tenha uma marca comercial diferente no checkout do comprador.</p>
          </div>

          <div className={card}>
            <h2 className="text-xl font-bold">Localização</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              O Checkout adapta idioma, formatação e prioridade dos métodos através do locale/timezone do browser. Portugal prioriza MB WAY/Multibanco; Espanha prioriza Bizum; outros mercados priorizam Card/Stripe Dynamic.
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              A moeda financeira não é alterada silenciosamente. <code>currency</code> da CheckoutSession é definida pelo Merchant/Store e permanece autoritativa.
            </p>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">4. Estado do pagamento</h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Redirect, <code>requires_action</code> ou regresso do browser não significam sucesso. XPayments reconcilia CheckoutSession e Transaction com o estado real do provider. O estado financeiro final esperado é <code>succeeded</code>.
          </p>
          <pre className={code}>{`GET /api/v1/checkout/session/{sessionId}

{
  "success": true,
  "data": {
    "status": "succeeded",
    "amount": 15,
    "currency": "EUR",
    "transactionId": "..."
  }
}`}</pre>
        </section>

        <section className="mt-12 rounded-[24px] border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="font-semibold">Sandbox primeiro</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            Use Store Sandbox + <code>xp_test_</code>. Para MB WAY, os números especiais do Stripe simulam sucesso, indisponibilidade e recusas. Em Live use dados reais e nunca misture API Key Test com Gateway Live.
          </p>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
          <Link className="underline underline-offset-4" href="/doc">Developer Portal</Link>
          <Link className="underline underline-offset-4" href="/doc/s2s">API Server-to-Server</Link>
        </footer>
      </div>
    </main>
  );
}
