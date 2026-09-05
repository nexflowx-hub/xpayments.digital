import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  ExternalLink,
  Globe2,
  KeyRound,
  LockKeyhole,
  MonitorCog,
  Radio,
  Server,
  ShieldCheck,
  TestTube2,
  Webhook,
} from "lucide-react";
import { XSymbol } from "@/components/shared/x-symbol";
import { CodeBlock, PrintButton } from "./doc-client";

export const metadata: Metadata = {
  title: "XPayments Developer Docs — API S2S",
  description:
    "Guia público de integração da API XPayments S2S: autenticação, API Keys, MB WAY, Bizum, Multibanco, Bancontact, BLIK, Sandbox e Webhooks.",
  alternates: { canonical: "https://xpayments.digital/doc" },
  openGraph: {
    title: "XPayments Developer Docs — API S2S",
    description:
      "Integre pagamentos Server-to-Server com XPayments. Exemplos, Sandbox, API Keys e Webhooks.",
    url: "https://xpayments.digital/doc",
    siteName: "XPayments",
    type: "website",
  },
};

const BASE_URL = "https://api.xpayments.digital/api/v1";

const quickCurl = `curl -X POST \\
  https://api.xpayments.digital/api/v1/payments/charge \\
  -H "Authorization: Bearer xp_test_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 500,
    "currency": "EUR",
    "payment_method_types": ["mb_way"],
    "reference": "ACME-PT-20260905-0001",
    "customer": {
      "name": "Cliente Sandbox",
      "phone": "+351911111112"
    },
    "metadata": {
      "order_id": "ACME-PT-20260905-0001"
    }
  }'`;

const nodeExample = `const response = await fetch(
  "https://api.xpayments.digital/api/v1/payments/charge",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XPAYMENTS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: 500,
      currency: "EUR",
      payment_method_types: ["mb_way"],
      reference: "ACME-PT-20260905-0001",
      customer: {
        name: "Cliente Exemplo",
        phone: "+351912345678",
      },
      metadata: {
        order_id: "ACME-PT-20260905-0001",
      },
    }),
  }
);

const payment = await response.json();

if (!response.ok) {
  throw new Error(payment?.error?.code ?? "PAYMENT_ERROR");
}

// requires_action não significa pago.
// O estado financeiro definitivo chega por webhook.
console.log(payment);`;

const webhookVerify = `import crypto from "node:crypto";

export function verifyXPaymentsWebhook(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(signature ?? "", "utf8");
  const b = Buffer.from(expected, "utf8");

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}`;

const webhookPayload = `{
  "event": "payment_intent.succeeded",
  "transaction_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ACME-PT-20260905-0001",
  "amount": 5,
  "currency": "EUR",
  "status": "succeeded",
  "method": "mb_way",
  "timestamp": "2026-09-05T16:00:00.000Z"
}`;

const methods = [
  {
    id: "mb-way",
    name: "MB WAY",
    badge: "EUR · bank_app",
    requirement: "Telefone válido. Recomendado em formato internacional, por exemplo +351912345678.",
    request: `{
  "amount": 500,
  "currency": "EUR",
  "payment_method_types": ["mb_way"],
  "reference": "ACME-MBWAY-20260905-0001",
  "customer": {
    "name": "Cliente Exemplo",
    "phone": "+351912345678"
  },
  "metadata": {
    "order_id": "ACME-MBWAY-20260905-0001"
  }
}`,
    response: `{
  "success": true,
  "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ACME-MBWAY-20260905-0001",
  "providerId": "pi_...",
  "status": "requires_action",
  "method": "mb_way",
  "action": {
    "type": "bank_app",
    "message": "Pedido MB WAY enviado. Confirme na aplicação."
  }
}`,
    note: "O cliente aprova na aplicação MB WAY. Só considere o pagamento concluído depois de payment_intent.succeeded.",
  },
  {
    id: "bizum",
    name: "Bizum",
    badge: "EUR · bank_app",
    requirement: "Telefone espanhol válido (+34...). O runtime XPayments limita o valor a EUR 0,50–5.000,00.",
    request: `{
  "amount": 500,
  "currency": "EUR",
  "payment_method_types": ["bizum"],
  "reference": "ACME-BIZUM-20260905-0001",
  "customer": {
    "name": "Cliente Exemplo",
    "phone": "+34612345678"
  },
  "metadata": {
    "order_id": "ACME-BIZUM-20260905-0001",
    "return_url": "https://merchant.example/payments/result"
  }
}`,
    response: `{
  "success": true,
  "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ACME-BIZUM-20260905-0001",
  "providerId": "pi_...",
  "status": "requires_action",
  "method": "bizum",
  "action": {
    "type": "bank_app",
    "message": "Pedido Bizum enviado. Confirme na aplicação do seu banco."
  }
}`,
    note: "O comprador utiliza o número associado ao Bizum e confirma no banco. Não use valores Sandbox numa Store Live.",
  },
  {
    id: "multibanco",
    name: "Multibanco",
    badge: "EUR · reference",
    requirement: "Email do cliente. A resposta devolve Entidade, Referência e Montante.",
    request: `{
  "amount": 500,
  "currency": "EUR",
  "payment_method_types": ["multibanco"],
  "reference": "ACME-MB-20260905-0001",
  "customer": {
    "name": "Cliente Exemplo",
    "email": "cliente@example.com"
  },
  "metadata": {
    "order_id": "ACME-MB-20260905-0001"
  }
}`,
    response: `{
  "success": true,
  "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ACME-MB-20260905-0001",
  "providerId": "pi_...",
  "status": "requires_action",
  "method": "multibanco",
  "action": {
    "type": "multibanco_reference",
    "entidade": "12345",
    "referencia": "123456789",
    "montante": "5.00 EUR"
  }
}`,
    note: "Mostre os três campos ao cliente e aguarde o webhook final. A geração da referência não significa pagamento.",
  },
  {
    id: "bancontact",
    name: "Bancontact",
    badge: "EUR · redirect",
    requirement: "customer.name e metadata.return_url HTTPS. O redirect deve ser aberto no browser principal, não em iframe.",
    request: `{
  "amount": 500,
  "currency": "EUR",
  "payment_method_types": ["bancontact"],
  "reference": "ACME-BE-20260905-0001",
  "customer": {
    "name": "Pieter Janssen",
    "email": "cliente@example.com"
  },
  "metadata": {
    "order_id": "ACME-BE-20260905-0001",
    "return_url": "https://merchant.example/payments/result"
  }
}`,
    response: `{
  "success": true,
  "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ACME-BE-20260905-0001",
  "providerId": "pi_...",
  "status": "requires_action",
  "method": "bancontact",
  "action": {
    "type": "redirect",
    "url": "https://..."
  }
}`,
    note: "Redirecione o cliente para action.url. O retorno ao return_url é UX; a confirmação financeira continua a ser o webhook.",
  },
  {
    id: "blik",
    name: "BLIK",
    badge: "PLN · bank_app",
    requirement: "PLN e código BLIK de 6 dígitos. O código é temporário e não deve ser guardado ou registado em logs.",
    request: `{
  "amount": 500,
  "currency": "PLN",
  "payment_method_types": ["blik"],
  "reference": "ACME-PL-20260905-0001",
  "customer": {
    "name": "Jan Kowalski",
    "email": "cliente@example.com"
  },
  "payment_method_options": {
    "blik": {
      "code": "123456"
    }
  },
  "metadata": {
    "order_id": "ACME-PL-20260905-0001"
  }
}`,
    response: `{
  "success": true,
  "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ACME-PL-20260905-0001",
  "providerId": "pi_...",
  "status": "requires_action",
  "method": "blik",
  "action": {
    "type": "bank_app",
    "message": "Confirme o pagamento BLIK na aplicação do seu banco.",
    "expiresInSeconds": 60
  }
}`,
    note: "O cliente tem 60 segundos para autorizar depois de iniciar o pagamento. Envie o código ao XPayments imediatamente.",
  },
] as const;

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-6 max-w-3xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">{description}</p> : null}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">{children}</span>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.035] p-5 ${className}`}>{children}</div>;
}

export default function PublicDeveloperDocs() {
  return (
    <main className="min-h-screen bg-[#070b12] text-slate-100 selection:bg-blue-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(37,99,235,0.14),transparent_32%),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.08),transparent_28%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b12]/85 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <XSymbol className="h-8 w-8" />
            <div>
              <p className="text-sm font-semibold text-white">XPayments</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Developer Docs</p>
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
        <section className="grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <Pill>API v1 S2S Stable</Pill>
              <Pill>Server-to-Server</Pill>
              <Pill>Live + Sandbox</Pill>
              <Pill>Sem login para ler</Pill>
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
              Integração de pagamentos XPayments
              <span className="block text-blue-400">API S2S</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
              Guia técnico público para equipas de desenvolvimento integrarem MB WAY, Bizum, Multibanco, Bancontact e BLIK pelo backend do Merchant.
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

        <nav className="sticky top-16 z-30 -mx-5 overflow-x-auto border-b border-white/10 bg-[#070b12]/90 px-5 py-3 backdrop-blur-lg print:hidden lg:mx-0 lg:px-0">
          <div className="flex min-w-max gap-1 text-xs">
            {[
              ["#quickstart", "Quickstart"], ["#credentials", "API Keys"], ["#methods", "Métodos"],
              ["#sandbox", "Sandbox"], ["#webhooks", "Webhooks"], ["#errors", "Erros"], ["#security", "Segurança"],
            ].map(([href, label]) => <a key={href} href={href} className="rounded-md px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white">{label}</a>)}
          </div>
        </nav>

        <section id="quickstart" className="scroll-mt-32 border-b border-white/10 py-14">
          <SectionTitle eyebrow="01 · Quickstart" title="Do zero ao primeiro PaymentIntent" description="A integração é backend-only. A API Key identifica uma Store XPayments e define o ambiente e permissões disponíveis." />
          <div className="grid gap-4 md:grid-cols-5">
            {[
              [KeyRound, "1", "Obter API Key", "Crie uma chave da Store com payments_write."],
              [Code2, "2", "POST charge", "Envie amount em unidade mínima e uma reference única."],
              [MonitorCog, "3", "Tratar action", "bank_app, redirect ou referência Multibanco."],
              [Webhook, "4", "Receber webhook", "Use o evento para atualizar o pedido no seu sistema."],
              [BadgeCheck, "5", "Confirmar sucesso", "Só payment_intent.succeeded confirma financeiramente."],
            ].map(([Icon, n, title, text]) => (
              <Panel key={String(n)}>
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300"><Icon className="h-4 w-4" /></div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Passo {String(n)}</p>
                <p className="mt-1 text-sm font-semibold text-white">{String(title)}</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">{String(text)}</p>
              </Panel>
            ))}
          </div>
          <div className="mt-6"><CodeBlock code={quickCurl} label="cURL · Sandbox MB WAY" /></div>
          <div className="mt-4"><CodeBlock code={nodeExample} label="Node.js · exemplo genérico" /></div>
        </section>

        <section id="credentials" className="scroll-mt-32 border-b border-white/10 py-14">
          <SectionTitle eyebrow="02 · Credenciais" title="Criar e gerir uma API Key" description="Cada API Key pertence a uma Store. Use chaves diferentes por Store e por ambiente." />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Panel>
                <ol className="space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3"><span className="font-mono text-blue-400">01</span><span>No Dashboard XPayments abra <strong className="text-white">API Keys</strong>.</span></li>
                  <li className="flex gap-3"><span className="font-mono text-blue-400">02</span><span>Clique <strong className="text-white">Create API key</strong> e selecione a Store correta.</span></li>
                  <li className="flex gap-3"><span className="font-mono text-blue-400">03</span><span>Selecione <strong className="text-white">Test</strong> para Sandbox ou <strong className="text-white">Live</strong> para produção.</span></li>
                  <li className="flex gap-3"><span className="font-mono text-blue-400">04</span><span>Ative o scope <code className="rounded bg-white/5 px-1.5 py-0.5 text-blue-200">payments_write</code>.</span></li>
                  <li className="flex gap-3"><span className="font-mono text-blue-400">05</span><span>Copie a chave e guarde-a num secret manager ou variável de ambiente do servidor.</span></li>
                  <li className="flex gap-3"><span className="font-mono text-blue-400">06</span><span>Se houver exposição, use <strong className="text-white">Revoke</strong> e gere uma nova chave.</span></li>
                </ol>
              </Panel>
              <Panel>
                <p className="text-sm font-semibold text-white">Headers suportados</p>
                <div className="mt-3 space-y-2 font-mono text-xs text-slate-300">
                  <p className="rounded-lg bg-black/30 p-3">Authorization: Bearer xp_live_********************************</p>
                  <p className="rounded-lg bg-black/30 p-3">x-api-key: xp_live_******************************** <span className="font-sans text-slate-500">(compatibilidade)</span></p>
                </div>
              </Panel>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-[#0b111d] p-4 shadow-2xl shadow-blue-950/20">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div><p className="text-sm font-semibold text-white">API Keys</p><p className="text-[11px] text-slate-500">Visual sanitizado do Dashboard · dados fictícios</p></div>
                <span className="rounded-md bg-blue-500 px-2.5 py-1.5 text-[11px] font-semibold text-white">+ Create API key</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Store</p><p className="mt-1 text-sm text-white">ACME Portugal</p><p className="font-mono text-[10px] text-slate-500">ACME-PT-ORCH</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Environment</p><span className="mt-1 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">Live</span></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Key</p><p className="mt-1 font-mono text-xs text-slate-300">xp_live_a12b••••9f30</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Scopes</p><span className="mt-1 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 font-mono text-[10px] text-blue-300">payments_write</span></div>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /> Chaves XPAYMENTS não são chaves Stripe. Nunca envie sk_live_ ou sk_test_ ao Merchant.</div>
            </div>
          </div>
        </section>

        <section id="methods" className="scroll-mt-32 border-b border-white/10 py-14">
          <SectionTitle eyebrow="03 · Payment Methods" title="Exemplos por meio de pagamento" description="Todos os exemplos usam POST /payments/charge. O amount é sempre inteiro na menor unidade monetária: 500 EUR = €5,00; 500 PLN = zł5,00." />
          <div className="mb-7 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-white/[0.04] text-slate-400"><tr><th className="px-4 py-3">Método</th><th className="px-4 py-3">Moeda</th><th className="px-4 py-3">Fluxo</th><th className="px-4 py-3">Obrigatório</th></tr></thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                <tr><td className="px-4 py-3 font-medium text-white">MB WAY</td><td className="px-4 py-3">EUR</td><td className="px-4 py-3">bank_app</td><td className="px-4 py-3">Telefone</td></tr>
                <tr><td className="px-4 py-3 font-medium text-white">Bizum</td><td className="px-4 py-3">EUR</td><td className="px-4 py-3">bank_app</td><td className="px-4 py-3">Telefone espanhol</td></tr>
                <tr><td className="px-4 py-3 font-medium text-white">Multibanco</td><td className="px-4 py-3">EUR</td><td className="px-4 py-3">multibanco_reference</td><td className="px-4 py-3">Email</td></tr>
                <tr><td className="px-4 py-3 font-medium text-white">Bancontact</td><td className="px-4 py-3">EUR</td><td className="px-4 py-3">redirect</td><td className="px-4 py-3">Nome + return_url HTTPS</td></tr>
                <tr><td className="px-4 py-3 font-medium text-white">BLIK</td><td className="px-4 py-3">PLN</td><td className="px-4 py-3">bank_app</td><td className="px-4 py-3">Código de 6 dígitos</td></tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-10">
            {methods.map((method) => (
              <article key={method.id} id={method.id} className="scroll-mt-32 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><h3 className="text-xl font-semibold text-white">{method.name}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{method.requirement}</p></div>
                  <Pill>{method.badge}</Pill>
                </div>
                <div className="grid gap-4 xl:grid-cols-2"><CodeBlock code={method.request} label={`${method.name} · request body`} /><CodeBlock code={method.response} label={`${method.name} · resposta típica`} /></div>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-500/15 bg-blue-500/5 p-3 text-xs leading-5 text-blue-100"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />{method.note}</div>
              </article>
            ))}
          </div>
        </section>

        <section id="sandbox" className="scroll-mt-32 border-b border-white/10 py-14">
          <SectionTitle eyebrow="04 · Sandbox" title="Dados de teste" description="Use estes valores apenas com uma Store XPayments Test/Sandbox (xp_test_...) ligada a um provider Test. Em Live, os simuladores não reproduzem o comportamento abaixo." />
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <div className="flex items-center gap-2"><TestTube2 className="h-4 w-4 text-blue-400" /><h3 className="font-semibold text-white">MB WAY</h3></div>
              <div className="mt-4 space-y-2 text-xs">
                {[
                  ["+351911111112", "Sucesso após requires_action"],
                  ["+351911111113", "payment_method_not_available"],
                  ["+351911111114", "payment_method_provider_decline"],
                  ["+351911111115", "payment_intent_payment_attempt_expired"],
                  ["+351911111116", "payment_method_customer_decline"],
                ].map(([value, result]) => <div key={value} className="flex items-center justify-between gap-4 rounded-lg bg-black/20 px-3 py-2"><code className="text-blue-200">{value}</code><span className="text-right text-slate-400">{result}</span></div>)}
              </div>
              <a href="https://docs.stripe.com/payments/mb-way/accept-a-payment?ui=direct-api" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">Stripe MB WAY testing <ExternalLink className="h-3 w-3" /></a>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2"><TestTube2 className="h-4 w-4 text-blue-400" /><h3 className="font-semibold text-white">Multibanco</h3></div>
              <div className="mt-4 space-y-2 text-xs">
                {[
                  ["succeed_immediately@example.com", "Sucesso em poucos segundos"],
                  ["expire_immediately@example.com", "Expira imediatamente"],
                  ["expire_with_delay@example.com", "Falha após atraso de teste"],
                  ["fill_never@example.com", "Simula referência nunca paga"],
                ].map(([value, result]) => <div key={value} className="rounded-lg bg-black/20 px-3 py-2"><code className="break-all text-blue-200">{value}</code><p className="mt-1 text-slate-400">{result}</p></div>)}
              </div>
              <a href="https://docs.stripe.com/payments/multibanco/accept-a-payment?payment-ui=direct-api" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">Stripe Multibanco testing <ExternalLink className="h-3 w-3" /></a>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2"><TestTube2 className="h-4 w-4 text-blue-400" /><h3 className="font-semibold text-white">BLIK</h3></div>
              <p className="mt-3 text-sm leading-6 text-slate-400">Em Sandbox, use um código de 6 dígitos como <code className="rounded bg-black/30 px-1.5 py-1 text-blue-200">123456</code>. O código real é temporário; o cliente confirma no banco.</p>
              <a href="https://docs.stripe.com/payments/blik/accept-a-payment?payment-ui=direct-api" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">Stripe BLIK testing <ExternalLink className="h-3 w-3" /></a>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2"><TestTube2 className="h-4 w-4 text-blue-400" /><h3 className="font-semibold text-white">Bizum / Bancontact</h3></div>
              <p className="mt-3 text-sm leading-6 text-slate-400">A documentação pública atual da Stripe não apresenta uma tabela equivalente de números Bizum como a do MB WAY. Use apenas os dados fornecidos para a sua Store Sandbox. Para Bancontact, siga o redirect gerado em Test e confirme o resultado pelo webhook.</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs"><a href="https://docs.stripe.com/payments/bizum/accept-a-payment" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-400">Bizum <ExternalLink className="h-3 w-3" /></a><a href="https://docs.stripe.com/payments/bancontact/accept-a-payment" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-400">Bancontact <ExternalLink className="h-3 w-3" /></a></div>
            </Panel>
          </div>
        </section>

        <section id="webhooks" className="scroll-mt-32 border-b border-white/10 py-14">
          <SectionTitle eyebrow="05 · Webhooks" title="Receber o estado definitivo" description="Configure um endpoint HTTPS por Store ORCHESTRATED para receber XPayments → Merchant. Estes endpoints são separados dos webhooks Stripe internos da plataforma." />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Panel>
                <p className="text-sm font-semibold text-white">Configuração no Dashboard</p>
                <ol className="mt-4 space-y-3 text-sm text-slate-300">
                  <li>1. Abra <strong className="text-white">Webhooks & API</strong>.</li>
                  <li>2. Em <strong className="text-white">Merchant Delivery · ORCHESTRATED</strong>, clique <strong className="text-white">Novo endpoint Merchant</strong>.</li>
                  <li>3. Selecione a Store e introduza uma URL HTTPS.</li>
                  <li>4. Ative os quatro eventos suportados.</li>
                  <li>5. Guarde o signing secret apresentado e valide o header em cada chamada.</li>
                </ol>
              </Panel>
              <CodeBlock code={`payment_intent.succeeded\npayment_intent.payment_failed\npayment_intent.processing\npayment_intent.canceled`} label="Eventos Merchant" />
              <CodeBlock code={webhookPayload} label="Payload" />
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-500/20 bg-[#0b111d] p-4">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3"><div><p className="text-sm font-semibold text-white">Merchant Delivery · ORCHESTRATED</p><p className="text-[11px] text-slate-500">Visual sanitizado · dados fictícios</p></div><span className="rounded-md bg-blue-500 px-2.5 py-1.5 text-[11px] font-semibold">+ Novo endpoint Merchant</span></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-white">ACME Portugal</span><Pill>ACME-PT-ORCH</Pill><span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">active</span></div>
                  <p className="mt-3 break-all font-mono text-xs text-slate-400">https://api.merchant.example/webhooks/xpayments</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{["succeeded", "failed", "processing", "canceled"].map(v => <Pill key={v}>{v}</Pill>)}</div>
                  <p className="mt-4 text-[11px] text-slate-500">Assinatura: <span className="font-mono text-slate-300">x-nexflowx-signature</span> · HMAC-SHA256</p>
                </div>
              </div>
              <CodeBlock code={webhookVerify} label="Node.js · validar assinatura" />
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Panel><p className="text-sm font-semibold text-white">amount no webhook</p><p className="mt-2 text-xs leading-5 text-slate-400">No request: <code>500</code> EUR. No webhook: <code>5</code> EUR.</p></Panel>
            <Panel><p className="text-sm font-semibold text-white">Idempotência</p><p className="mt-2 text-xs leading-5 text-slate-400">Deduplique por <code>event + transaction_id</code> e responda HTTP 2xx rapidamente.</p></Panel>
            <Panel><p className="text-sm font-semibold text-white">Confirmação</p><p className="mt-2 text-xs leading-5 text-slate-400">Nunca confirme pedido por redirect ou requires_action. Use <code>payment_intent.succeeded</code>.</p></Panel>
          </div>
        </section>

        <section id="errors" className="scroll-mt-32 border-b border-white/10 py-14">
          <SectionTitle eyebrow="06 · Erros" title="Respostas que o integrador deve tratar" />
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-white/[0.04] text-slate-400"><tr><th className="px-4 py-3">HTTP</th><th className="px-4 py-3">code</th><th className="px-4 py-3">Significado</th></tr></thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {[
                  ["401", "API_KEY_REQUIRED / ACCESS_DENIED", "Chave ausente, inválida ou Store inativa."],
                  ["403", "INSUFFICIENT_SCOPE", "A chave não possui payments_write."],
                  ["400", "INVALID_AMOUNT / INVALID_CURRENCY", "Payload inválido."],
                  ["400", "INVALID_MBWAY_PHONE / INVALID_BIZUM_PHONE", "Telefone fora do formato aceite."],
                  ["400", "BIZUM_EUR_REQUIRED / BIZUM_AMOUNT_OUT_OF_RANGE", "Regra específica do Bizum."],
                  ["400", "GATEWAY_NOT_CONFIGURED", "A Store não possui provider configurado para o método."],
                  ["409", "TRANSACTION_ALREADY_PAID", "A reference já corresponde a uma transação succeeded."],
                  ["409", "LIVE_KEY_TEST_GATEWAY_MISMATCH", "Chave Live ligada a provider Test."],
                  ["409", "TEST_KEY_LIVE_GATEWAY_MISMATCH", "Chave Test ligada a provider Live."],
                  ["402", "PAYMENT_FAILED / provider error", "O provider recusou ou não autorizou o pagamento."],
                ].map(([http, code, meaning]) => <tr key={code}><td className="px-4 py-3 font-mono text-slate-400">{http}</td><td className="px-4 py-3 font-mono text-blue-200">{code}</td><td className="px-4 py-3">{meaning}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <section id="security" className="scroll-mt-32 py-14">
          <SectionTitle eyebrow="07 · Produção" title="Checklist antes do go-live" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              [ShieldCheck, "API Key server-side", "Nunca exponha xp_live_ ou xp_test_ no browser, mobile app ou repositório público."],
              [KeyRound, "Scope correto", "A chave usada em POST /payments/charge precisa de payments_write."],
              [CircleDollarSign, "Unidade monetária", "Envie amount em centavos/cêntimos ou unidade mínima da moeda."],
              [Globe2, "Reference única", "Use uma referência forte e namespaced, por exemplo ACME-PT-20260905-0001."],
              [Webhook, "Webhook validado", "Use HTTPS, HMAC-SHA256 e idempotência no endpoint Merchant."],
              [LockKeyhole, "Separar Test e Live", "xp_test_ deve utilizar provider Test; xp_live_ deve utilizar provider Live."],
            ].map(([Icon, title, text]) => <Panel key={String(title)}><Icon className="h-5 w-5 text-blue-400" /><p className="mt-4 text-sm font-semibold text-white">{String(title)}</p><p className="mt-2 text-xs leading-5 text-slate-400">{String(text)}</p></Panel>)}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-400" /><p className="text-sm font-semibold text-white">Precisa integrar agora?</p></div><p className="mt-2 text-sm text-slate-400">Comece numa Store Sandbox e mova exatamente o mesmo contrato para uma Store Live quando estiver validado.</p></div>
            <a href="#quickstart" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">Voltar ao Quickstart <ArrowRight className="h-4 w-4" /></a>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 text-xs text-slate-500">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 XPayments · Developer Documentation</p><div className="flex flex-wrap gap-4"><a href="https://api.xpayments.digital/api/health" target="_blank" rel="noreferrer" className="hover:text-slate-300">API Health</a><a href="/docs/xpayments-api-s2s-guide.html" className="hover:text-slate-300">Guia HTML legado</a><Link href="/support" className="hover:text-slate-300">Support</Link></div></div>
        </footer>
      </div>
    </main>
  );
}
