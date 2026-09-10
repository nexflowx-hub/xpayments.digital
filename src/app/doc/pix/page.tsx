import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, KeyRound, QrCode, ShieldCheck, Webhook } from "lucide-react";
import { CodeBlock } from "@/app/doc/doc-client";

export const metadata: Metadata = {
  title: "PIX API S2S | XPayments Developer Docs",
  description: "Integração PIX via API S2S XPayments para Stores BRL: criação, QR Code, Copia e Cola, estados, webhooks e segurança.",
  alternates: { canonical: "https://xpayments.digital/doc/pix" },
};

const request = `curl -X POST \\
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

const response = `{
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

const node = `const payload = {
  amount: 500, // R$ 5,00
  currency: "BRL",
  payment_method_types: ["pix"],
  reference: order.id,
  customer: {
    name: customer.name,
    document: customer.document.replace(/\\D/g, ""),
  },
  metadata: {
    order_id: order.id,
    description: \`Pedido \${order.id}\`,
  },
};

const r = await fetch("https://api.xpayments.digital/api/v1/payments/charge", {
  method: "POST",
  headers: {
    "x-api-key": process.env.XPAYMENTS_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const payment = await r.json();
if (!r.ok) throw new Error(payment?.error?.code ?? "PIX_CREATE_FAILED");

return {
  transactionId: payment.transactionId,
  status: payment.status,
  copyPaste: payment.action?.copyPaste,
  qrCode: payment.action?.qrCodeBase64,
};`;

const webhook = `{
  "event": "payment_intent.succeeded",
  "transaction_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reference": "ORDER-BR-10001",
  "amount": 5,
  "currency": "BRL",
  "status": "succeeded",
  "method": "pix",
  "timestamp": "2026-09-10T04:00:00.000Z"
}`;

const panel = "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

export default function PixDocsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/doc" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Developer Docs</Link>
          <div className="flex gap-2"><Link href="/doc/s2s" className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-800">S2S</Link><Link href="/doc/ai" className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-700 dark:text-violet-300">Integrar com IA</Link></div>
        </nav>

        <header className="mt-10 overflow-hidden rounded-[32px] bg-zinc-950 p-7 text-white sm:p-10">
          <div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> PIX S2S · CREATE VERIFIED</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">Stores BRL habilitadas</span></div>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">PIX via XPayments S2S</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">Crie o PIX no backend, receba Copia e Cola + QR Code e deixe a XPayments tratar routing, provider e confirmação. O Merchant integra apenas com a API XPayments.</p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <div className={panel}><KeyRound className="h-5 w-5 text-violet-500" /><p className="mt-3 text-sm font-semibold">Auth</p><p className="mt-2 text-xs leading-5 text-zinc-500">xp_live_* no backend. Nunca no browser.</p></div>
          <div className={panel}><QrCode className="h-5 w-5 text-violet-500" /><p className="mt-3 text-sm font-semibold">Resposta</p><p className="mt-2 text-xs leading-5 text-zinc-500">copyPaste, pixString e QR para apresentação.</p></div>
          <div className={panel}><Webhook className="h-5 w-5 text-violet-500" /><p className="mt-3 text-sm font-semibold">Finalidade</p><p className="mt-2 text-xs leading-5 text-zinc-500">pending não é pago. Aguarde succeeded/webhook.</p></div>
          <div className={panel}><ShieldCheck className="h-5 w-5 text-violet-500" /><p className="mt-3 text-sm font-semibold">Provider-neutral</p><p className="mt-2 text-xs leading-5 text-zinc-500">Não exponha nem codifique credenciais do provider.</p></div>
        </section>

        <section className="mt-12"><p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">01 · Criar</p><h2 className="mt-2 text-2xl font-bold">POST /api/v1/payments/charge</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">O amount usa minor units: <strong>500 = R$5,00</strong>. Use CPF/CNPJ sem formatação em customer.document e uma reference única para a tentativa lógica.</p><div className="mt-5"><CodeBlock code={request} /></div></section>

        <section className="mt-12"><p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">02 · Consumir a action</p><h2 className="mt-2 text-2xl font-bold">Não gere outro PIX para criar o QR</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">A resposta já contém o BR Code e representações gráficas. Guarde transactionId e reference, mostre action.copyPaste e renderize action.qrCodeBase64 ou um QR local a partir de action.copyPaste.</p><div className="mt-5"><CodeBlock code={response} /></div></section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">03 · Node.js</p><h2 className="mt-2 text-2xl font-bold">Implementação backend</h2><div className="mt-5"><CodeBlock code={node} /></div></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">04 · Webhook</p><h2 className="mt-2 text-2xl font-bold">Confirmação final</h2><p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">A entrega do produto/serviço deve ser acionada pelo estado financeiro final. O payload recebido deve ser verificado, deduplicado e processado de forma idempotente.</p><div className="mt-5"><CodeBlock code={webhook} /></div></div></section>

        <section className="mt-12 rounded-[28px] border border-violet-500/20 bg-violet-500/[0.06] p-6 sm:p-8"><Bot className="h-6 w-6 text-violet-500" /><h2 className="mt-4 text-2xl font-bold">Quer que uma IA implemente isto no seu projeto?</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">Abra o guia de integração com IA, copie o prompt PIX e cole no ChatGPT, Claude, Gemini, Cursor, Z.AI ou outro agente que esteja a desenvolver o seu checkout.</p><Link href="/doc/ai#pix" className="mt-5 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">Copiar prompt de integração PIX →</Link></section>

        <footer className="mt-14 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">XPayments · PIX S2S · https://api.xpayments.digital/api/v1/payments/charge</footer>
      </div>
    </main>
  );
}
