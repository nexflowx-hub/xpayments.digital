import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  MonitorUp,
  Radio,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { CodeBlock, PrintButton } from "@/app/doc/doc-client";
import { XSymbol } from "@/components/shared/x-symbol";

export const metadata: Metadata = {
  title: "XPayments Checkout XPay — Hosted & Embedded",
  description:
    "Crie CheckoutSessions XPayments e integre o checkout por Redirect/Hosted, iframe ou SDK, usando o mesmo core financeiro, Store, routing e webhooks.",
  alternates: {
    canonical: "https://xpayments.digital/doc/checkout",
  },
};

const createSession = `curl -X POST \\
  https://api.xpayments.digital/api/v1/checkout/session \\
  -H "Authorization: Bearer xp_test_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 2510,
    "currency": "EUR",
    "reference": "ORDER-PT-2026-0184",
    "customerEmail": "joao@example.com",
    "returnUrl": "https://merchant.example/payments/result",
    "allowedOrigin": "https://merchant.example",
    "expiresInMinutes": 30,
    "metadata": {
      "customerName": "João Martins",
      "description": "Pedido #0184"
    }
  }'`;

const createResponse = `{
  "success": true,
  "data": {
    "sessionId": "3cb4c392-f084-4778-97cc-a733921c8c6c",
    "checkoutUrl": "https://checkout.xpayments.digital/pay/3cb4c392-f084-4778-97cc-a733921c8c6c",
    "embedUrl": "https://checkout.xpayments.digital/embed/3cb4c392-f084-4778-97cc-a733921c8c6c",
    "expiresAt": "2026-09-08T03:20:27.233Z"
  }
}`;

const sdkExample = `<script src="https://checkout.xpayments.digital/xpay.js"></script>
<script>
  XPayments.open({
    sessionId: "3cb4c392-f084-4778-97cc-a733921c8c6c",
    theme: "light",
    closeOnBackdrop: true,
    onSuccess: function () {
      // UX only. Confirm the order on your backend/webhook.
      console.log("Checkout reported success");
    },
    onClose: function (reason) {
      console.log("Checkout closed", reason);
    }
  });
</script>`;

const iframeExample = `<iframe
  src="https://checkout.xpayments.digital/embed/3cb4c392-f084-4778-97cc-a733921c8c6c?parent_origin=https%3A%2F%2Fmerchant.example"
  title="XPayments Checkout"
  allow="payment *"
  referrerpolicy="strict-origin-when-cross-origin"
  style="width:100%;height:760px;border:0"
></iframe>`;

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">{children}</div>;
}

export default function CheckoutDocsPage() {
  return (
    <main className="min-h-screen bg-[#070b12] text-slate-100 selection:bg-cyan-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(8,145,178,0.16),transparent_32%),radial-gradient(circle_at_85%_12%,rgba(37,99,235,0.09),transparent_28%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b12]/88 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/doc" className="flex items-center gap-2.5">
            <XSymbol className="h-8 w-8" />
            <div><p className="text-sm font-semibold text-white">XPayments</p><p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Checkout Developer Docs</p></div>
          </Link>
          <div className="flex items-center gap-2">
            <a href="https://api.xpayments.digital/api/health" target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-300 sm:inline-flex"><Radio className="h-3.5 w-3.5" /> API Status</a>
            <PrintButton />
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <section className="grid gap-8 border-b border-white/10 pb-14 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">HOSTED E2E CERTIFIED</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">EMBED ROUTE ACTIVE</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">SDK 1.0</span>
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">Checkout XPay<span className="block text-cyan-400">Hosted, iframe ou SDK</span></h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">O Merchant cria uma CheckoutSession no seu backend. A XPayments devolve uma URL Hosted e uma URL Embedded, ambas ligadas à mesma Store, routing, GatewayVault, Transaction, ledger e webhooks.</p>
          </div>
          <Panel>
            <div className="flex items-center gap-2 text-sm font-medium text-white"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Fluxo certificado</div>
            <p className="mt-3 text-xs leading-6 text-slate-400">CheckoutSession → MB WAY → shared GatewayVault → signed webhook → Transaction succeeded → WalletMovement.</p>
          </Panel>
        </section>

        <div className="space-y-14 py-14">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">01 · Criar sessão</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">POST /api/v1/checkout/session</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">A chamada é server-side e usa a API Key da Store. O <code className="text-cyan-200">amount</code> é enviado na menor unidade monetária.</p>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div><p className="mb-2 text-xs font-semibold text-slate-300">Request</p><CodeBlock code={createSession} /></div>
              <div><p className="mb-2 text-xs font-semibold text-slate-300">201 Created</p><CodeBlock code={createResponse} /></div>
            </div>
          </section>

          <section className="border-t border-white/10 pt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">02 · Abrir checkout</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Escolha Hosted ou Embedded</h2>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <Panel>
                <div className="flex items-center gap-2 font-medium text-white"><ExternalLink className="h-4 w-4 text-cyan-300" /> Hosted / Redirect</div>
                <p className="mt-3 text-sm leading-6 text-slate-400">Redirecione o browser para o <code className="text-cyan-200">checkoutUrl</code>. É a integração mais simples e a superfície Hosted está certificada E2E.</p>
                <CodeBlock code={`window.location.href = checkoutUrl;`} />
              </Panel>
              <Panel>
                <div className="flex items-center gap-2 font-medium text-white"><MonitorUp className="h-4 w-4 text-cyan-300" /> Embedded / iframe</div>
                <p className="mt-3 text-sm leading-6 text-slate-400">Use <code className="text-cyan-200">embedUrl</code> ou o helper SDK. Configure <code className="text-cyan-200">allowedOrigin</code> ao criar a sessão.</p>
                <CodeBlock code={iframeExample} />
              </Panel>
            </div>
          </section>

          <section className="border-t border-white/10 pt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">03 · SDK</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Modal XPayments</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">O SDK atual expõe <code className="text-cyan-200">window.XPayments.open()</code>. O callback de sucesso serve para UX; o backend do Merchant deve continuar a confirmar o pedido por webhook/Transaction.</p>
            <div className="mt-6"><CodeBlock code={sdkExample} /></div>
          </section>

          <section className="border-t border-white/10 pt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">04 · Estado</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Consultar CheckoutSession</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">A página Checkout acompanha o estado, mas o Merchant também pode consultar a sessão pelo backend.</p>
            <div className="mt-6"><CodeBlock code={`GET https://api.xpayments.digital/api/v1/checkout/session/{sessionId}`} /></div>
            <div className="mt-5"><CodeBlock code={`{
  "success": true,
  "data": {
    "sessionId": "...",
    "storeName": "Merchant Display Name",
    "amount": 25.1,
    "currency": "EUR",
    "status": "succeeded",
    "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "paymentMethods": [
      { "code": "mb_way", "label": "MB WAY" },
      { "code": "card", "label": "Cartão" }
    ]
  }
}`} /></div>
          </section>

          <section className="border-t border-white/10 pt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">05 · Confirmação</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">O browser não é a fonte financeira</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Panel><Webhook className="h-5 w-5 text-emerald-300" /><p className="mt-3 text-sm font-medium text-white">Webhook Merchant</p><p className="mt-2 text-xs leading-5 text-slate-400">Método recomendado para atualizar o pedido no backend.</p></Panel>
              <Panel><ShieldCheck className="h-5 w-5 text-emerald-300" /><p className="mt-3 text-sm font-medium text-white">Transaction succeeded</p><p className="mt-2 text-xs leading-5 text-slate-400">Estado financeiro persistido pela XPayments.</p></Panel>
              <Panel><KeyRound className="h-5 w-5 text-emerald-300" /><p className="mt-3 text-sm font-medium text-white">API Key server-side</p><p className="mt-2 text-xs leading-5 text-slate-400">Nunca coloque xp_test_/xp_live_ no browser ou no bundle frontend.</p></Panel>
            </div>
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
              <strong>Importante:</strong> retorno ao <code>returnUrl</code>, callback <code>onSuccess</code>, fecho do modal, <code>requires_action</code> ou redirect não substituem confirmação financeira no backend.
            </div>
          </section>

          <section className="border-t border-white/10 pt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">06 · Personalização</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Branding vem da Store</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">O Checkout pode receber nome público, logo, cor principal, tema, locale e auto-return configurados na Store. O nome interno da Store não precisa ser exibido ao comprador.</p>
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/doc" className="inline-flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Developer Docs</Link>
          <Link href="/doc/s2s" className="text-slate-400 hover:text-white">Ver API S2S →</Link>
        </footer>
      </div>
    </main>
  );
}
