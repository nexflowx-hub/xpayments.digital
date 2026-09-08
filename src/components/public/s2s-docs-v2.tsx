import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  Code2,
  CreditCard,
  KeyRound,
  LockKeyhole,
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
      metadata: {
        order_id: "ORDER-2026-0001",
      },
    }),
  }
);

const payment = await response.json();
if (!response.ok) {
  throw new Error(payment?.error?.code ?? "PAYMENT_ERROR");
}

// requires_action NÃO significa pago.
// Aguarde a Transaction / webhook final = succeeded.
console.log(payment);`;

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
  "timestamp": "2026-09-08T05:00:00.000Z"
}`;

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.035] p-5 ${className}`}>
      {children}
    </div>
  );
}

function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "ok" | "warn" | "neutral" }) {
  const styles =
    tone === "ok"
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
            <div>
              <p className="text-sm font-semibold text-white">XPayments</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">S2S Developer Docs</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <a href="https://api.xpayments.digital/api/health" target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-300 sm:inline-flex">
              <Radio className="h-3.5 w-3.5" /> API Status
            </a>
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
              <StatusPill>Sandbox + Live</StatusPill>
              <StatusPill>Updated 08 Sep 2026</StatusPill>
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
              API Server-to-Server
              <span className="block text-blue-400">para checkout próprio do Merchant</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
              O backend do Merchant chama a XPayments diretamente. A API Key seleciona a Store, e a Store define routing, ambiente e GatewayVault. O Merchant apresenta no seu frontend apenas a ação devolvida pela API.
            </p>
          </div>

          <Panel>
            <div className="flex items-center gap-2 text-sm font-medium text-white"><Server className="h-4 w-4 text-blue-400" /> Endpoint base</div>
            <code className="mt-3 block break-all rounded-lg bg-black/30 px-3 py-2.5 text-xs text-blue-200">{BASE_URL}</code>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-slate-500">Criar pagamento</p><p className="mt-1 font-mono text-slate-200">POST /payments/charge</p></div>
              <div><p className="text-slate-500">Auth</p><p className="mt-1 font-mono text-slate-200">Bearer xp_...</p></div>
            </div>
          </Panel>
        </section>

        <nav className="sticky top-16 z-30 -mx-5 overflow-x-auto border-b border-white/10 bg-[#070b12]/92 px-5 py-3 backdrop-blur-lg print:hidden lg:mx-0 lg:px-0">
          <div className="flex min-w-max gap-1 text-xs">
            {[
              ["#quickstart", "Quickstart"],
              ["#contract", "Contrato"],
              ["#methods", "Métodos"],
              ["#card", "Card"],
              ["#states", "Estados"],
              ["#webhooks", "Webhooks"],
              ["#security", "Segurança"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-md px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white">{label}</a>
            ))}
          </div>
        </nav>

        <div className="space-y-14 py-14">
          <section>
            <SectionTitle id="quickstart" eyebrow="01 · Quickstart" title="Primeiro pagamento">
              <p>A API Key deve ficar exclusivamente no backend do Merchant. Envie apenas um método por request em <code className="text-blue-200">payment_method_types</code>; o runtime atual utiliza o primeiro item do array.</p>
            </SectionTitle>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div><p className="mb-2 text-xs font-semibold text-slate-300">cURL</p><CodeBlock code={curlExample} /></div>
              <div><p className="mb-2 text-xs font-semibold text-slate-300">Node.js</p><CodeBlock code={nodeExample} /></div>
            </div>
          </section>

          <section>
            <SectionTitle id="contract" eyebrow="02 · Contrato" title="Campos de criação">
              <p>O valor é sempre enviado na menor unidade monetária. Exemplo: <code className="text-blue-200">500 EUR = €5,00</code>. A referência deve ser única por Merchant e deve representar o pedido no seu sistema.</p>
            </SectionTitle>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-xs text-slate-400"><tr><th className="px-4 py-3">Campo</th><th className="px-4 py-3">Obrigatório</th><th className="px-4 py-3">Descrição</th></tr></thead>
                <tbody className="divide-y divide-white/10 text-slate-300">
                  <tr><td className="px-4 py-3 font-mono text-blue-200">amount</td><td className="px-4 py-3">Sim</td><td className="px-4 py-3">Integer positivo na menor unidade.</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-blue-200">currency</td><td className="px-4 py-3">Sim</td><td className="px-4 py-3">ISO 4217, por exemplo EUR ou PLN.</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-blue-200">payment_method_types</td><td className="px-4 py-3">Sim</td><td className="px-4 py-3">Envie exatamente um método suportado para a Store.</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-blue-200">reference</td><td className="px-4 py-3">Recomendado</td><td className="px-4 py-3">Chave de idempotência funcional do pedido.</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-blue-200">customer</td><td className="px-4 py-3">Depende</td><td className="px-4 py-3">Telefone, email e nome conforme o método.</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-blue-200">metadata</td><td className="px-4 py-3">Opcional</td><td className="px-4 py-3">Dados do Merchant. Use order_id/reference para rastreio.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionTitle id="methods" eyebrow="03 · Métodos" title="Matriz de suporte S2S">
              <p>“Provider suporta” não significa “XPayments S2S certificado”. Um método só deve ser usado diretamente quando existe tratamento completo de criação, confirmação, ação e webhook no runtime XPayments.</p>
            </SectionTitle>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-xs text-slate-400"><tr><th className="px-4 py-3">Método</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Fluxo</th><th className="px-4 py-3">Nota</th></tr></thead>
                <tbody className="divide-y divide-white/10 text-slate-300">
                  <tr><td className="px-4 py-3 font-medium text-white">MB WAY</td><td className="px-4 py-3"><StatusPill tone="ok">CERTIFIED E2E</StatusPill></td><td className="px-4 py-3 font-mono text-blue-200">bank_app</td><td className="px-4 py-3">EUR; telefone PT válido.</td></tr>
                  <tr><td className="px-4 py-3 font-medium text-white">Bizum</td><td className="px-4 py-3"><StatusPill>STORE-DEPENDENT</StatusPill></td><td className="px-4 py-3 font-mono text-blue-200">bank_app / redirect</td><td className="px-4 py-3">EUR; telefone ES; exige Store configurada.</td></tr>
                  <tr><td className="px-4 py-3 font-medium text-white">Multibanco</td><td className="px-4 py-3"><StatusPill>STORE-DEPENDENT</StatusPill></td><td className="px-4 py-3 font-mono text-blue-200">reference</td><td className="px-4 py-3">EUR; devolve Entidade/Referência quando configurado.</td></tr>
                  <tr><td className="px-4 py-3 font-medium text-white">Card</td><td className="px-4 py-3"><StatusPill tone="warn">NOT YET DIRECT</StatusPill></td><td className="px-4 py-3">—</td><td className="px-4 py-3">Use Checkout XPay até existir tokenização/confirmation S2S dedicada.</td></tr>
                  <tr><td className="px-4 py-3 font-medium text-white">Bancontact</td><td className="px-4 py-3"><StatusPill tone="warn">NOT YET DIRECT</StatusPill></td><td className="px-4 py-3">—</td><td className="px-4 py-3">Não utilizar no endpoint direto sem certificação da Store.</td></tr>
                  <tr><td className="px-4 py-3 font-medium text-white">BLIK</td><td className="px-4 py-3"><StatusPill tone="warn">NOT YET DIRECT</StatusPill></td><td className="px-4 py-3">—</td><td className="px-4 py-3">Suporte direto ainda não publicado como contrato.</td></tr>
                  <tr><td className="px-4 py-3 font-medium text-white">PIX</td><td className="px-4 py-3"><StatusPill tone="warn">PRIVATE ROLLOUT</StatusPill></td><td className="px-4 py-3">provider-specific</td><td className="px-4 py-3">MisticPay em integração multi-tenant; ainda não é endpoint público certificado.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionTitle id="card" eyebrow="04 · Card" title="Por que card ainda não está certificado no S2S direto?">
              <p>Cartões exigem uma etapa segura de tokenização/PaymentMethod e confirmação. Enviar apenas <code className="text-blue-200">payment_method_types: ["card"]</code> não fornece um instrumento de pagamento ao PaymentIntent.</p>
            </SectionTitle>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <Panel>
                <div className="flex items-center gap-2 font-medium text-white"><CircleAlert className="h-4 w-4 text-amber-300" /> Não faça isto ainda</div>
                <CodeBlock code={`{
  "amount": 500,
  "currency": "EUR",
  "payment_method_types": ["card"]
}`} />
                <p className="mt-3 text-xs leading-5 text-slate-400">O runtime atual não recebe um payment_method/token nem devolve client_secret para concluir a confirmação no frontend do Merchant.</p>
              </Panel>
              <Panel>
                <div className="flex items-center gap-2 font-medium text-white"><CreditCard className="h-4 w-4 text-emerald-300" /> Opção recomendada hoje</div>
                <p className="mt-3 text-sm leading-6 text-slate-400">Para cartões, wallets e métodos Stripe dinâmicos utilize o Checkout XPay Hosted/Embedded. A próxima versão S2S Card deverá aceitar PaymentMethod tokenizado e suportar SCA/3DS sem o Merchant enviar PAN bruto à XPayments.</p>
                <Link href="/doc/checkout" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200">Abrir documentação Checkout →</Link>
              </Panel>
            </div>
          </section>

          <section>
            <SectionTitle id="states" eyebrow="05 · Estados" title="Como interpretar a resposta">
              <p>A resposta inicial descreve o estado do provider naquele instante. O estado financeiro final é determinado pela Transaction XPayments e pelos webhooks.</p>
            </SectionTitle>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div><p className="mb-2 text-xs font-semibold text-slate-300">Exemplo MB WAY</p><CodeBlock code={successResponse} /></div>
              <Panel>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li><strong className="text-white">requires_action:</strong> o cliente ainda precisa aprovar/autenticar. Não está pago.</li>
                  <li><strong className="text-white">processing:</strong> aceite pelo fluxo, mas ainda sem estado final.</li>
                  <li><strong className="text-white">succeeded:</strong> pagamento confirmado e persistido pela XPayments.</li>
                  <li><strong className="text-white">failed / canceled:</strong> não creditar o pedido.</li>
                </ul>
              </Panel>
            </div>
          </section>

          <section>
            <SectionTitle id="webhooks" eyebrow="06 · Webhooks" title="Confirmação financeira definitiva">
              <p>O webhook Merchant é a fonte assíncrona recomendada para atualizar o pedido. Responda 2xx rapidamente, valide a assinatura configurada para a Store e processe de forma idempotente.</p>
            </SectionTitle>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div><p className="mb-2 text-xs font-semibold text-slate-300">Payload normalizado</p><CodeBlock code={webhookPayload} /></div>
              <Panel>
                <div className="flex items-center gap-2 font-medium text-white"><Webhook className="h-4 w-4 text-blue-300" /> Regras</div>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• deduplique por evento + transaction_id;</li>
                  <li>• não dependa do browser/redirect;</li>
                  <li>• trate retries como normais;</li>
                  <li>• mantenha o endpoint HTTPS;</li>
                  <li>• nunca exponha webhook secrets no frontend.</li>
                </ul>
              </Panel>
            </div>
          </section>

          <section>
            <SectionTitle id="security" eyebrow="07 · Segurança" title="Regras obrigatórias">
              <p>As credenciais XPayments são server-side. Nunca envie PAN/CVV para endpoints não especificamente certificados para card tokenization.</p>
            </SectionTitle>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Panel><KeyRound className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-medium text-white">API Key por Store</p><p className="mt-2 text-xs leading-5 text-slate-400">Separe xp_test_ e xp_live_. Não use a mesma chave em múltiplas Stores.</p></Panel>
              <Panel><LockKeyhole className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-medium text-white">TLS obrigatório</p><p className="mt-2 text-xs leading-5 text-slate-400">Use HTTPS em todas as chamadas, callbacks e webhooks.</p></Panel>
              <Panel><ShieldCheck className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-medium text-white">Idempotência</p><p className="mt-2 text-xs leading-5 text-slate-400">Reutilize a mesma reference em retries do mesmo pedido.</p></Panel>
              <Panel><WalletCards className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-medium text-white">Métodos certificados</p><p className="mt-2 text-xs leading-5 text-slate-400">Só ative no seu checkout métodos publicados como suportados para a sua Store.</p></Panel>
            </div>
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/doc" className="inline-flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Developer Docs</Link>
          <span>Base API · {BASE_URL}</span>
        </footer>
      </div>
    </main>
  );
}
