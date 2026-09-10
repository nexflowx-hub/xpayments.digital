import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CircleAlert,
  CreditCard,
  KeyRound,
  LockKeyhole,
  QrCode,
  Radio,
  Server,
  ShieldCheck,
  WalletCards,
  Webhook,
} from "lucide-react";
import { XSymbol } from "@/components/shared/x-symbol";
import { CodeBlock, PrintButton } from "@/app/doc/doc-client";

const BASE_URL = "https://api.xpayments.digital/api/v1";

const curlExample = `curl -X POST \\
  https://api.xpayments.digital/api/v1/payments/charge \\
  -H "Authorization: Bearer xp_test_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 500,
    "currency": "EUR",
    "payment_method_types": ["mb_way"],
    "reference": "ORDER-2026-0001",
    "customer": {
      "name": "Cliente Exemplo",
      "phone": "+351912345678"
    },
    "metadata": {
      "order_id": "ORDER-2026-0001"
    }
  }'`;

const nodeExample = `const response = await fetch(
  "https://api.xpayments.digital/api/v1/payments/charge",
  {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${process.env.XPAYMENTS_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: 500,
      currency: "EUR",
      payment_method_types: ["mb_way"],
      reference: "ORDER-2026-0001",
      customer: {
        name: "Cliente Exemplo",
        phone: "+351912345678",
      },
      metadata: { order_id: "ORDER-2026-0001" },
    }),
  }
);

const payment = await response.json();
if (!response.ok) throw new Error(payment?.error?.code ?? "PAYMENT_ERROR");

// Uma action ou redirect não significa pagamento liquidado.
// Confirme o estado final por webhook / Transaction = succeeded.
console.log(payment);`;

const pixCurl = `curl -X POST \\
  https://api.xpayments.digital/api/v1/payments/charge \\
  -H "x-api-key: xp_live_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 500,
    "currency": "BRL",
    "payment_method_types": ["pix"],
    "reference": "ORDER-BR-10001",
    "customer": {
      "name": "Nome do Cliente",
      "document": "12345678909"
    },
    "metadata": {
      "order_id": "ORDER-BR-10001",
      "description": "Pagamento do pedido 10001"
    }
  }'`;

const pixResponse = `{
  "success": true,
  "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ORDER-BR-10001",
  "status": "pending",
  "method": "pix",
  "action": {
    "type": "pix",
    "copyPaste": "000201...",
    "pixString": "000201...",
    "qrCode": "data:image/png;base64,...",
    "qrCodeBase64": "data:image/png;base64,...",
    "qrCodeUrl": "https://..."
  }
}`;

const successResponse = `{
  "success": true,
  "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ORDER-2026-0001",
  "providerId": "pi_...",
  "status": "requires_action",
  "method": "mb_way",
  "action": {
    "type": "bank_app",
    "message": "Pedido MB WAY enviado. Confirme na aplicação."
  }
}`;

const webhookPayload = `{
  "event": "payment_intent.succeeded",
  "transaction_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ORDER-2026-0001",
  "amount": 5,
  "currency": "EUR",
  "status": "succeeded",
  "method": "mb_way",
  "timestamp": "2026-09-10T04:00:00.000Z"
}`;

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.035] p-5 ${className}`}>{children}</div>;
}

function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "ok" | "warn" | "neutral" }) {
  const styles = tone === "ok"
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
    : tone === "warn"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
      : "border-white/10 bg-white/5 text-slate-300";
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles}`}>{children}</span>;
}

function SectionTitle({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-32 border-t border-white/10 pt-12 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
      {children ? <div className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">{children}</div> : null}
    </div>
  );
}

export default function S2SDocsV2() {
  return (
    <main className="min-h-screen bg-[#070b12] text-slate-100 selection:bg-blue-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.15),transparent_32%),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.08),transparent_28%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b12]/88 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/doc" className="flex items-center gap-2.5">
            <XSymbol className="h-8 w-8" />
            <div><p className="text-sm font-semibold text-white">XPayments</p><p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">S2S Developer Docs</p></div>
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
              <StatusPill tone="ok">API v1 · S2S Stable</StatusPill>
              <StatusPill tone="ok">MB WAY E2E Certified</StatusPill>
              <StatusPill tone="ok">PIX Create Verified</StatusPill>
              <StatusPill>Sandbox + Live</StatusPill>
              <StatusPill>Updated 10 Sep 2026</StatusPill>
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">API Server-to-Server<span className="block text-blue-400">para checkout próprio do Merchant</span></h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">O backend do Merchant chama a XPayments diretamente. A API Key seleciona a Store, e a Store define moeda, routing, ambiente e GatewayVault. O Merchant apresenta no seu frontend apenas a action devolvida pela API.</p>
          </div>
          <Panel>
            <div className="flex items-center gap-2 text-sm font-medium text-white"><Server className="h-4 w-4 text-blue-400" /> Endpoint base</div>
            <code className="mt-3 block break-all rounded-lg bg-black/30 px-3 py-2.5 text-xs text-blue-200">{BASE_URL}</code>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-slate-500">Criar pagamento</p><p className="mt-1 font-mono text-slate-200">POST /payments/charge</p></div><div><p className="text-slate-500">Auth</p><p className="mt-1 font-mono text-slate-200">Bearer / x-api-key</p></div></div>
          </Panel>
        </section>

        <nav className="sticky top-16 z-30 -mx-5 overflow-x-auto border-b border-white/10 bg-[#070b12]/92 px-5 py-3 backdrop-blur-lg print:hidden lg:mx-0 lg:px-0">
          <div className="flex min-w-max gap-1 text-xs">
            {[["#quickstart","Quickstart"],["#contract","Contrato"],["#methods","Métodos"],["#pix","PIX"],["#card","Cartões"],["#states","Estados"],["#webhooks","Webhooks"],["#security","Segurança"]].map(([href,label]) => <a key={href} href={href} className="rounded-md px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white">{label}</a>)}
          </div>
        </nav>

        <div className="space-y-14 py-14">
          <section>
            <SectionTitle id="quickstart" eyebrow="01 · Quickstart" title="Primeiro pagamento"><p>A API Key fica exclusivamente no backend do Merchant. Envie um método por request em <code className="text-blue-200">payment_method_types</code>; o runtime utiliza o primeiro item do array.</p></SectionTitle>
            <div className="mt-6 grid gap-5 lg:grid-cols-2"><div><p className="mb-2 text-xs font-semibold text-slate-300">cURL</p><CodeBlock code={curlExample} /></div><div><p className="mb-2 text-xs font-semibold text-slate-300">Node.js</p><CodeBlock code={nodeExample} /></div></div>
          </section>

          <section>
            <SectionTitle id="contract" eyebrow="02 · Contrato" title="Campos de criação"><p><code className="text-blue-200">amount</code> é sempre um integer na menor unidade monetária: <code className="text-blue-200">500</code> significa €5,00 em EUR ou R$5,00 em BRL. A reference deve identificar unicamente a tentativa lógica no sistema do Merchant.</p></SectionTitle>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/[0.04] text-xs text-slate-400"><tr><th className="px-4 py-3">Campo</th><th className="px-4 py-3">Obrigatório</th><th className="px-4 py-3">Descrição</th></tr></thead><tbody className="divide-y divide-white/10 text-slate-300">
              <tr><td className="px-4 py-3 font-mono text-blue-200">amount</td><td className="px-4 py-3">Sim</td><td className="px-4 py-3">Integer positivo em minor units.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-blue-200">currency</td><td className="px-4 py-3">Sim</td><td className="px-4 py-3">ISO 4217, por exemplo EUR, PLN ou BRL.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-blue-200">payment_method_types</td><td className="px-4 py-3">Sim</td><td className="px-4 py-3">Um método habilitado para a Store.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-blue-200">reference</td><td className="px-4 py-3">Recomendado</td><td className="px-4 py-3">Referência única do pedido/tentativa.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-blue-200">customer</td><td className="px-4 py-3">Depende</td><td className="px-4 py-3">name, email, phone e document conforme o método.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-blue-200">metadata</td><td className="px-4 py-3">Opcional</td><td className="px-4 py-3">Dados do Merchant. Recomendado: order_id e description.</td></tr>
            </tbody></table></div>
          </section>

          <section>
            <SectionTitle id="methods" eyebrow="03 · Métodos" title="Matriz de integração"><p>A disponibilidade final depende da Store e do provider configurado. Métodos que usam Stripe Payment Element pertencem à superfície Stripe-compatible, não exigem que o Merchant envie PAN/CVV à XPayments.</p></SectionTitle>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/[0.04] text-xs text-slate-400"><tr><th className="px-4 py-3">Método</th><th className="px-4 py-3">Superfície recomendada</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Action / nota</th></tr></thead><tbody className="divide-y divide-white/10 text-slate-300">
              <tr><td className="px-4 py-3 font-medium text-white">PIX</td><td className="px-4 py-3">Native S2S</td><td className="px-4 py-3"><StatusPill tone="ok">CREATE VERIFIED</StatusPill></td><td className="px-4 py-3">BRL · copyPaste + QR · Store habilitada.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-white">MB WAY</td><td className="px-4 py-3">Native S2S / Checkout</td><td className="px-4 py-3"><StatusPill tone="ok">CERTIFIED E2E</StatusPill></td><td className="px-4 py-3">EUR · telefone PT · bank_app.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-white">Multibanco</td><td className="px-4 py-3">Native S2S / Checkout</td><td className="px-4 py-3"><StatusPill>STORE-DEPENDENT</StatusPill></td><td className="px-4 py-3">Entidade/Referência quando habilitado.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-white">Bizum</td><td className="px-4 py-3">Native S2S / Checkout</td><td className="px-4 py-3"><StatusPill>STORE-DEPENDENT</StatusPill></td><td className="px-4 py-3">EUR · fluxo bank app / redirect.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-white">Card / Visa / Mastercard / Amex</td><td className="px-4 py-3">Stripe-compatible + Elements / Checkout</td><td className="px-4 py-3"><StatusPill>STORE-DEPENDENT</StatusPill></td><td className="px-4 py-3">Use pk_* pública + client_secret ou Checkout XPay.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-white">BLIK</td><td className="px-4 py-3">Native S2S / Checkout</td><td className="px-4 py-3"><StatusPill>STORE-DEPENDENT</StatusPill></td><td className="px-4 py-3">PLN · exige capability Stripe da Store.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-white">Bancontact / iDEAL / EPS / outros APM</td><td className="px-4 py-3">Checkout / Stripe-compatible</td><td className="px-4 py-3"><StatusPill>STORE-DEPENDENT</StatusPill></td><td className="px-4 py-3">Disponibilidade determinada pela conta/provider.</td></tr>
            </tbody></table></div>
          </section>

          <section>
            <SectionTitle id="pix" eyebrow="04 · PIX" title="PIX via API S2S"><p>Para Stores BRL habilitadas, <code className="text-blue-200">payment_method_types: ["pix"]</code> cria uma cobrança PIX dinâmica. O retorno já contém os dados necessários para o Merchant renderizar o pagamento sem conhecer o provider subjacente.</p></SectionTitle>
            <div className="mt-6 grid gap-5 lg:grid-cols-2"><div><p className="mb-2 text-xs font-semibold text-slate-300">Criar PIX · R$5,00</p><CodeBlock code={pixCurl} /></div><div><p className="mb-2 text-xs font-semibold text-slate-300">Resposta</p><CodeBlock code={pixResponse} /></div></div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Panel><QrCode className="h-5 w-5 text-emerald-300" /><p className="mt-3 text-sm font-medium text-white">Apresentação</p><p className="mt-2 text-xs leading-5 text-slate-400">Use <code>action.copyPaste</code> ou <code>action.qrCodeBase64</code>. Não derive um novo pagamento para gerar QR.</p></Panel>
              <Panel><ShieldCheck className="h-5 w-5 text-emerald-300" /><p className="mt-3 text-sm font-medium text-white">Finalidade</p><p className="mt-2 text-xs leading-5 text-slate-400"><code>pending</code> significa apenas PIX criado. Entregue o produto somente após confirmação final XPayments.</p></Panel>
              <Panel><Webhook className="h-5 w-5 text-emerald-300" /><p className="mt-3 text-sm font-medium text-white">Confirmação</p><p className="mt-2 text-xs leading-5 text-slate-400">A XPayments valida o estado do provider server-to-server antes do ledger e envia o webhook Merchant configurado.</p></Panel>
            </div>
            <Link href="/doc/pix" className="mt-5 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200">Abrir guia PIX completo →</Link>
          </section>

          <section>
            <SectionTitle id="card" eyebrow="05 · Cartões" title="Cartões: use Stripe-compatible + Elements ou Checkout"><p>A API Native S2S não deve receber PAN/CVV. Para um checkout próprio com cartões, crie o PaymentIntent pelo relay Stripe-compatible e confirme no browser com Stripe.js/Payment Element usando a publishable key <code className="text-blue-200">pk_*</code> da Store.</p></SectionTitle>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <Panel><CreditCard className="h-5 w-5 text-sky-300" /><p className="mt-3 text-sm font-medium text-white">Stripe-compatible</p><p className="mt-2 text-sm leading-6 text-slate-400">Ideal para projetos que já usam Stripe Payment Intents/Elements. A server key passa a ser <code>xp_test_*</code> / <code>xp_live_*</code>; a pk_* permanece browser-safe.</p><Link href="/doc/stripe" className="mt-4 inline-flex text-sm font-semibold text-blue-300">Abrir Stripe-compatible →</Link></Panel>
              <Panel><CircleAlert className="h-5 w-5 text-amber-300" /><p className="mt-3 text-sm font-medium text-white">Nunca envie PAN bruto</p><p className="mt-2 text-sm leading-6 text-slate-400">Não envie número de cartão, CVV ou dados PCI sensíveis no JSON de <code>/payments/charge</code>. Use Stripe.js/Elements ou Checkout XPay.</p><Link href="/doc/checkout" className="mt-4 inline-flex text-sm font-semibold text-blue-300">Abrir Checkout →</Link></Panel>
            </div>
          </section>

          <section>
            <SectionTitle id="states" eyebrow="06 · Estados" title="Como interpretar a resposta"><p>A resposta inicial descreve o estado daquele instante. O estado financeiro definitivo vem da Transaction XPayments/webhook.</p></SectionTitle>
            <div className="mt-6 grid gap-5 lg:grid-cols-2"><div><p className="mb-2 text-xs font-semibold text-slate-300">Exemplo MB WAY</p><CodeBlock code={successResponse} /></div><Panel><ul className="space-y-3 text-sm text-slate-300"><li><strong className="text-white">pending:</strong> cobrança criada; pagamento ainda não confirmado.</li><li><strong className="text-white">requires_action:</strong> cliente precisa aprovar/autenticar.</li><li><strong className="text-white">processing:</strong> aceite pelo fluxo, ainda sem estado final.</li><li><strong className="text-white">succeeded:</strong> pagamento confirmado no core.</li><li><strong className="text-white">failed / canceled:</strong> não creditar o pedido.</li></ul></Panel></div>
          </section>

          <section>
            <SectionTitle id="webhooks" eyebrow="07 · Webhooks" title="Confirmação financeira definitiva"><p>O webhook Merchant é a fonte assíncrona recomendada para atualizar o pedido. Responda 2xx rapidamente, valide a assinatura da Store e processe idempotentemente.</p></SectionTitle>
            <div className="mt-6 grid gap-5 lg:grid-cols-2"><div><p className="mb-2 text-xs font-semibold text-slate-300">Payload normalizado</p><CodeBlock code={webhookPayload} /></div><Panel><div className="flex items-center gap-2 font-medium text-white"><Webhook className="h-4 w-4 text-blue-300" /> Regras</div><ul className="mt-4 space-y-3 text-sm text-slate-400"><li>• deduplique por evento + transaction_id;</li><li>• não dependa do browser/redirect;</li><li>• trate retries como normais;</li><li>• mantenha HTTPS;</li><li>• nunca exponha webhook secrets no frontend.</li></ul></Panel></div>
          </section>

          <section>
            <SectionTitle id="security" eyebrow="08 · Segurança" title="Regras obrigatórias"><p>As credenciais <code>xp_*</code> são server-side. As <code>pk_*</code> Stripe são públicas e só são necessárias para Stripe.js/Elements.</p></SectionTitle>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Panel><KeyRound className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-medium text-white">API Key por Store</p><p className="mt-2 text-xs leading-5 text-slate-400">Separe xp_test_ e xp_live_. Nunca exponha xp_* no browser.</p></Panel>
              <Panel><LockKeyhole className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-medium text-white">TLS obrigatório</p><p className="mt-2 text-xs leading-5 text-slate-400">HTTPS em chamadas, callbacks e webhooks.</p></Panel>
              <Panel><ShieldCheck className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-medium text-white">Idempotência</p><p className="mt-2 text-xs leading-5 text-slate-400">Reutilize a mesma reference em retries da mesma tentativa lógica.</p></Panel>
              <Panel><WalletCards className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-medium text-white">Store-scoped</p><p className="mt-2 text-xs leading-5 text-slate-400">Moeda, providers e métodos dependem da Store identificada pela API Key.</p></Panel>
            </div>
            <Link href="/doc/ai" className="mt-6 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200">Copiar instruções prontas para uma IA implementar →</Link>
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><Link href="/doc" className="inline-flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Developer Docs</Link><span>Base API · {BASE_URL}</span></footer>
      </div>
    </main>
  );
}
