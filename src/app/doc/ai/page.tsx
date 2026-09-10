import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bot, Braces, CreditCard, ExternalLink, QrCode, ShieldCheck } from "lucide-react";
import { CodeBlock } from "@/app/doc/doc-client";

export const metadata: Metadata = {
  title: "Integrar XPayments com IA | Developer Docs",
  description: "Prompts prontos para copiar e colar em agentes de IA e implementar PIX S2S, Checkout XPay e Stripe-compatible + Elements.",
  alternates: { canonical: "https://xpayments.digital/doc/ai" },
};

const pixPrompt = `És o engenheiro responsável por integrar XPayments no meu projeto.

OBJETIVO
Implementar PIX S2S usando exclusivamente o backend da aplicação.

CONTRATO XPAYMENTS
- Base URL: https://api.xpayments.digital
- Endpoint: POST /api/v1/payments/charge
- Autenticação server-side: x-api-key: process.env.XPAYMENTS_API_KEY
- Nunca expor xp_live_* ou xp_test_* no browser.
- Body JSON:
  {
    "amount": <integer em centavos>,
    "currency": "BRL",
    "payment_method_types": ["pix"],
    "reference": <ID único do pedido/tentativa>,
    "customer": {
      "name": <nome>,
      "document": <CPF/CNPJ somente números>
    },
    "metadata": {
      "order_id": <ID do pedido>,
      "description": <descrição>
    }
  }
- 500 significa R$ 5,00.
- Resposta de sucesso inclui transactionId, reference, status="pending", method="pix" e action.
- action pode conter copyPaste, pixString, qrCode, qrCodeBase64 e qrCodeUrl.
- Não criar um segundo PIX apenas para gerar QR Code: usar a action já devolvida.
- pending NÃO significa pago.
- Só entregar o pedido após confirmação final XPayments/webhook com status succeeded.

IMPLEMENTAÇÃO PEDIDA
1. Analisa primeiro a stack e a estrutura atual deste repositório.
2. Cria uma rota backend segura para iniciar PIX.
3. Guarda XPayments transactionId + reference no pedido local.
4. No frontend, mostra QR Code, Copia e Cola, botão copiar e estado pendente.
5. Cria endpoint webhook HTTPS da XPayments e processamento idempotente.
6. Nunca credites/libertes o pedido a partir do browser, redirect ou simples criação do PIX.
7. Usa variáveis de ambiente; não hardcodes segredos.
8. Mantém logs sanitizados: nunca imprimir API keys ou dados sensíveis completos.
9. Entrega as alterações completas, ficheiros modificados, variáveis de ambiente necessárias e testes.

Antes de alterar código, identifica o framework, package manager, rotas/API existentes e padrão de env do projeto. Não inventes APIs XPayments além das descritas acima.`;

const checkoutPrompt = `És o engenheiro responsável por integrar o Checkout XPay no meu projeto.

OBJETIVO
Criar sessões de checkout no backend e enviar o comprador para o Checkout XPayments, mantendo credenciais privadas no servidor.

CONTRATO
- Base URL: https://api.xpayments.digital
- Criar sessão: POST /api/v1/checkout/session
- Página de pagamento: https://checkout.xpayments.digital/pay/{sessionId}
- API Key XPayments é server-side e pertence a uma Store.
- Nunca colocar xp_live_* / xp_test_* no JavaScript público.
- O retorno/redirect ao meu site é UX, não confirmação financeira.
- O estado final do pedido deve vir da Transaction/webhook XPayments.

IMPLEMENTAÇÃO PEDIDA
1. Analisa a stack/repositório e reutiliza padrões existentes.
2. Cria endpoint backend create-checkout-session.
3. Mapeia amount em minor units, currency, reference/order_id, customer e return URL conforme o contrato existente do projeto.
4. Devolve ao frontend apenas sessionId/checkout URL necessários.
5. Implementa loading, erro e prevenção de duplo clique.
6. Implementa webhook XPayments idempotente para succeeded/failed/canceled/processing.
7. Não marque pedido como pago pelo redirect.
8. Segredos apenas em env server-side.
9. Produz testes e lista de ficheiros alterados.

Se algum campo do contrato de Checkout não estiver disponível no contexto atual do projeto, não inventes: isola-o numa função/config e marca exatamente o que preciso confirmar na documentação XPayments.`;

const stripePrompt = `És o engenheiro responsável por migrar a integração Stripe existente para XPayments Stripe-compatible.

OBJETIVO
Manter Stripe Payment Intents/Stripe.js/Payment Element, mas criar e gerir PaymentIntents através da XPayments.

SERVER-SIDE
- Base relay: https://api.xpayments.digital/api/stripe/v1
- Server key: XPAYMENTS_API_KEY = xp_test_* ou xp_live_* da Store.
- Nunca expor xp_* no browser.
- POST /payment_intents
- GET /payment_intents/:id
- POST /payment_intents/:id
- POST /payment_intents/:id/confirm
- POST /payment_intents/:id/cancel
- POST /payment_intents/:id/capture
- Requests POST usam application/x-www-form-urlencoded, como Stripe v1.
- Preservar Idempotency-Key.

BROWSER / STRIPE ELEMENTS
- O browser continua a usar Stripe.js.
- Usar a publishable key pk_test_* / pk_live_* disponibilizada pela Store XPayments.
- pk_* é pública/browser-safe; sk_*, rk_*, webhook secrets e GatewayVault credentials nunca são expostos.
- Payment Element usa o client_secret do PaymentIntent criado pelo relay.

REGRAS
1. Analisa a integração Stripe atual antes de editar.
2. Substitui a base URL das chamadas server-side Stripe Payment Intents pela XPayments.
3. Substitui a secret key server-side pela XPAYMENTS_API_KEY.
4. Mantém Stripe.js/Elements no frontend com XPAYMENTS_STRIPE_PUBLISHABLE_KEY (pk_*).
5. Nunca envie PAN/CVV ao backend XPayments.
6. Usa Idempotency-Key estável por tentativa lógica.
7. Confirma pagamentos pelo webhook/estado final, não pelo redirect.
8. Mantém compatibilidade com SCA/3DS e next_action/client_secret.
9. Não hardcodes credenciais.
10. Mostra diff/ficheiros alterados e testes de integração.

Não uses diretamente sk_test_* ou sk_live_* do provider: essas credenciais físicas são geridas no GatewayVault XPayments.`;

const universalPrompt = `Analisa este repositório e escolhe a superfície XPayments mais adequada sem misturar contratos:

A) PIX / métodos bancários com checkout próprio -> Native S2S
   POST https://api.xpayments.digital/api/v1/payments/charge

B) Checkout provider-neutral gerido -> Checkout XPay
   POST https://api.xpayments.digital/api/v1/checkout/session
   https://checkout.xpayments.digital/pay/{sessionId}

C) Projeto já integrado com Stripe Payment Intents/Elements -> Stripe-compatible
   https://api.xpayments.digital/api/stripe/v1

SEGURANÇA
- xp_test_* / xp_live_*: server-side only.
- pk_test_* / pk_live_*: browser-safe apenas para Stripe.js/Elements.
- Nunca pedir, expor ou imprimir sk_*, rk_*, webhook secrets físicos ou GatewayVault credentials.
- amount usa minor units nas APIs de criação (500 = 5,00 na moeda).
- Store define moeda, ambiente, routing e providers.
- Finalidade financeira vem de succeeded/webhook; pending/requires_action/redirect não é liquidação.

Primeiro descreve qual das opções A/B/C corresponde ao código existente. Depois implementa a integração com o menor número de mudanças possível, mantendo idempotência, webhooks, logs sanitizados e env vars.`;

function PromptCard({ id, icon: Icon, title, text, prompt }: { id: string; icon: React.ElementType; title: string; text: string; prompt: string }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Icon className="h-5 w-5" /></div><div><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{text}</p></div></div>
      <div className="mt-6"><CodeBlock code={prompt} /></div>
    </section>
  );
}

export default function AiIntegrationDocs() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-white">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <nav className="flex flex-wrap items-center justify-between gap-3"><Link href="/doc" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Developer Docs</Link><div className="flex gap-2"><Link href="/doc/pix" className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-800">PIX</Link><Link href="/doc/stripe" className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-800">Stripe-compatible</Link></div></nav>

        <header className="relative mt-10 overflow-hidden rounded-[34px] bg-zinc-950 p-7 text-white sm:p-10"><div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" /><div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200"><Bot className="h-3.5 w-3.5" /> AI Integration Playbooks</span><h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Copie o contrato. Cole na IA. Implemente com menos ambiguidade.</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">Prompts operacionais para ChatGPT, Claude, Gemini, Cursor, Z.AI e outros agentes. Eles descrevem endpoints, separação frontend/backend, segurança, idempotência e critérios de confirmação.</p></div></header>

        <div className="mt-8 grid gap-4 md:grid-cols-4"><a href="#pix" className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-950"><QrCode className="mb-3 h-5 w-5 text-violet-500" />PIX S2S</a><a href="#checkout" className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-950"><ExternalLink className="mb-3 h-5 w-5 text-violet-500" />Checkout XPay</a><a href="#stripe" className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-950"><CreditCard className="mb-3 h-5 w-5 text-violet-500" />Stripe + Elements</a><a href="#universal" className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-950"><Braces className="mb-3 h-5 w-5 text-violet-500" />Escolha automática</a></div>

        <div className="mt-8 space-y-6"><PromptCard id="pix" icon={QrCode} title="Prompt — implementar PIX S2S" text="Para checkout próprio BRL com QR Code e Copia e Cola." prompt={pixPrompt} /><PromptCard id="checkout" icon={ExternalLink} title="Prompt — implementar Checkout XPay" text="Para redirecionamento/embedded provider-neutral." prompt={checkoutPrompt} /><PromptCard id="stripe" icon={CreditCard} title="Prompt — migrar Stripe + Payment Element" text="Para projetos que já usam Stripe Payment Intents e Stripe.js." prompt={stripePrompt} /><PromptCard id="universal" icon={Bot} title="Prompt — analisar o projeto e escolher a integração" text="Quando o Merchant quer entregar o repositório à IA e deixar que ela identifique a superfície adequada." prompt={universalPrompt} /></div>

        <section className="mt-8 rounded-[28px] border border-amber-500/20 bg-amber-500/[0.06] p-6"><ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-300" /><h2 className="mt-3 text-lg font-bold">Não cole segredos reais na IA</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">Use placeholders como <code>XPAYMENTS_API_KEY</code> e <code>XPAYMENTS_STRIPE_PUBLISHABLE_KEY</code>. Configure os valores reais diretamente no gestor de variáveis de ambiente do projeto/hosting. Uma pk_* é pública para Stripe.js; xp_*, sk_*, rk_* e signing secrets permanecem privados.</p></section>

        <footer className="mt-14 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">XPayments Developer Platform · AI-ready integration contracts</footer>
      </div>
    </main>
  );
}
