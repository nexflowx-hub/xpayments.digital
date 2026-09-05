import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "XPayments Checkout API — Hosted & Embedded",
  description:
    "Integre o Checkout XPayments por redirecionamento ou modal embedded, usando a mesma infraestrutura de pagamentos XPayments.",
  alternates: {
    canonical: "https://xpayments.digital/doc/checkout",
  },
};

const code = "rounded-2xl border border-white/10 bg-black/80 p-4 overflow-x-auto text-xs leading-6 text-zinc-200 font-mono";
const card = "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

export default function CheckoutDocsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/doc" className="text-sm font-semibold">← XPayments Docs</Link>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Checkout API VNext
          </span>
        </div>

        <header className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Developer Guide</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Hosted & Embedded Checkout</h1>
          <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Crie uma única CheckoutSession e escolha como apresentar o pagamento: numa página externa XPayments ou num modal sobre a página do Merchant. Os dois modos usam a mesma Store, routing, GatewayVault, Transaction e webhooks.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className={card}>
            <h2 className="text-lg font-semibold">1. Redirect Checkout</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Redirecione o cliente para <code>checkout.xpayments.digital/pay/:sessionId</code>. Ideal para integração rápida e links externos.
            </p>
          </div>
          <div className={card}>
            <h2 className="text-lg font-semibold">2. Embedded Checkout</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Abra a mesma sessão num modal/iframe com o SDK <code>xpay.js</code>. O cliente permanece visualmente dentro da página do Merchant.
            </p>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold">Criar uma CheckoutSession</h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            A chamada é server-to-server. Use uma API Key da Store e nunca exponha <code>xp_live_</code> ou <code>xp_test_</code> no browser.
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
    "metadata": {
      "customerName": "João Martins",
      "description": "Order #1001",
      "primaryColor": "#111111"
    }
  }'`}</pre>
          <div className={card}>
            <p className="text-sm font-semibold">amount</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">É enviado na menor unidade monetária: <code>1500 EUR = €15,00</code>.</p>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold">Resposta</h2>
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

        <section className="mt-10 space-y-5">
          <h2 className="text-2xl font-bold">Modo A — Redirecionamento</h2>
          <pre className={code}>{`window.location.href = checkoutUrl;`}</pre>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Depois do pagamento, o Checkout apresenta o estado final e pode disponibilizar o retorno ao URL configurado pelo Merchant.
          </p>
        </section>

        <section className="mt-10 space-y-5">
          <h2 className="text-2xl font-bold">Modo B — Modal Embedded</h2>
          <pre className={code}>{`<script src="https://checkout.xpayments.digital/xpay.js"></script>
<script>
  XPayments.open({
    sessionId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    theme: "light",
    onSuccess: () => {
      window.location.reload();
    },
    onClose: (reason) => {
      console.log("Checkout closed", reason);
    }
  });
</script>`}</pre>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            O SDK cria e remove o iframe automaticamente, valida mensagens recebidas de <code>checkout.xpayments.digital</code> e envia o evento de sucesso apenas quando a sessão chega ao estado financeiro concluído.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Métodos no Hosted Checkout</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["card", "Cards / Stripe Elements"],
              ["mb_way", "MB WAY"],
              ["bizum", "Bizum"],
              ["multibanco", "Multibanco"],
            ].map(([method, label]) => (
              <div key={method} className={card}>
                <code className="text-xs font-semibold">{method}</code>
                <p className="mt-2 text-sm">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Outros métodos certificados continuam disponíveis na API S2S. A lista do Hosted Checkout é deliberadamente mais curta enquanto cada experiência de utilizador específica não estiver certificada.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold">Estado do pagamento</h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Não considere redirects, <code>requires_action</code> ou o retorno do browser como confirmação financeira. A XPayments reconcilia a CheckoutSession com a Transaction e o webhook do provider. O estado final esperado é <code>succeeded</code>.
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

        <section className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="font-semibold">Sandbox primeiro</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            Use uma Store Sandbox + <code>xp_test_</code> para simuladores MB WAY/Multibanco. Em Live, utilize dados reais. O ambiente da API Key e o Gateway da Store devem corresponder.
          </p>
        </section>

        <footer className="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
          XPayments Developer Platform · <Link className="underline underline-offset-4" href="/doc">API S2S documentation</Link>
        </footer>
      </div>
    </main>
  );
}
