import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  MonitorUp,
  Palette,
  Server,
  ShieldCheck,
  Sparkles,
  Store,
  Webhook,
} from "lucide-react";

export const metadata: Metadata = {
  title: "XPayments Checkout API — Redirect & Embedded",
  description:
    "Integre Checkout XPay por redirecionamento ou modal iframe, com branding por Store, localização, Stripe Payment Element, estados, segurança e webhooks.",
  alternates: {
    canonical: "https://xpayments.digital/doc/checkout",
  },
};

const code =
  "rounded-2xl border border-white/10 bg-black p-4 overflow-x-auto text-xs leading-6 text-zinc-200 font-mono shadow-inner";
const card =
  "rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_16px_50px_-38px_rgba(15,23,42,.45)] dark:border-zinc-800 dark:bg-zinc-950";

const params = [
  ["amount", "integer", "Sim", "Valor na menor unidade monetária. Ex.: 1500 EUR = €15,00."],
  ["currency", "string", "Sim", "Moeda ISO 4217 com 3 letras, por exemplo EUR, GBP ou PLN."],
  ["reference", "string", "Recomendado", "Referência única e namespaced do pedido. Evite reutilizar referências."],
  ["customerEmail", "string", "Não", "Email inicial do comprador, quando disponível."],
  ["returnUrl", "HTTPS URL", "Recomendado", "Destino do Merchant após sucesso no modo Redirect."],
  ["allowedOrigin", "HTTPS URL", "Embedded", "Origem esperada do Merchant para integração Embedded."],
  ["expiresInMinutes", "integer", "Não", "Validade da sessão entre 5 e 1440 minutos. Default atual: 30."],
  ["metadata", "object", "Não", "Dados públicos controlados, como customerName e description."],
] as const;

const statuses = [
  ["pending", "Sessão criada ou pagamento ainda não confirmado. Inclui fluxos provider em requires_action/processing enquanto não existe estado final."],
  ["succeeded", "Pagamento financeiramente confirmado. Estado final de sucesso."],
  ["failed", "Pagamento recusado, cancelado ou não concluído."],
  ["expired", "CheckoutSession ultrapassou a validade configurada."],
] as const;

const errors = [
  ["401", "API Key inválida / Store inativa", "A sessão não é criada."],
  ["403", "INSUFFICIENT_SCOPE", "A API Key não possui payments_write."],
  ["400", "CHECKOUT_METHOD_NOT_AVAILABLE", "O método pedido não está disponível na Store."],
  ["409", "CHECKOUT_ALREADY_PAID", "A sessão já está associada a pagamento succeeded."],
  ["410", "CHECKOUT_EXPIRED", "A sessão expirou."],
  ["400", "LIVE_KEY_TEST_GATEWAY_MISMATCH", "API Key Live ligada a provider Test."],
  ["400", "TEST_KEY_LIVE_GATEWAY_MISMATCH", "API Key Test ligada a provider Live."],
] as const;

export default function CheckoutDocsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/doc" className="inline-flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Developer Docs
          </Link>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Checkout API VNext
          </span>
        </div>

        <header className="max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">API 02</p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Checkout XPay</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Crie uma única CheckoutSession e escolha como apresentar o pagamento: numa página externa XPayments ou num modal/iframe sobre a página do Merchant. Redirect e Embedded usam a mesma Store, routing, GatewayVault, Transaction, ledger e webhooks.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Prereq icon={Store} title="Store ativa" text="Use uma Store ORCHESTRATED com provider e métodos de pagamento configurados." />
          <Prereq icon={KeyRound} title="API Key" text="Use xp_test_ ou xp_live_ da Store com scope payments_write. A chave fica sempre no servidor." />
          <Prereq icon={Webhook} title="Webhook" text="Configure Merchant Delivery para receber o estado financeiro definitivo no seu backend." />
          <Prereq icon={Palette} title="Branding" text="Defina nome público, logo, cor e tema do Checkout sem alterar o nome interno da Store." />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className={card}>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <ExternalLink className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">A. Redirect Checkout</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Redirecione para <code>checkout.xpayments.digital/pay/:sessionId</code>. Depois de <code>succeeded</code>, o Checkout apresenta confirmação e retorna automaticamente ao <code>returnUrl</code> do Merchant.
            </p>
          </div>
          <div className={card}>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
              <MonitorUp className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">B. Embedded / iframe</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              O SDK abre a mesma sessão num modal seguro. Quando a sessão chega a <code>succeeded</code>, o iframe emite <code>XPAYMENTS_STATUS: SUCCESS</code>, fecha o modal e executa <code>onSuccess</code>.
            </p>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">1. Criar a CheckoutSession</h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Esta chamada é sempre server-to-server. Nunca coloque <code>xp_live_</code> ou <code>xp_test_</code> no JavaScript público do browser, numa app mobile ou num repositório público.
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
    "expiresInMinutes": 30,
    "metadata": {
      "customerName": "João Martins",
      "description": "Order #1001"
    }
  }'`}</pre>
        </section>

        <section className="mt-8 overflow-x-auto rounded-[24px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
              <tr><th className="px-4 py-3">Campo</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Uso</th><th className="px-4 py-3">Descrição</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {params.map(([field, type, usage, desc]) => (
                <tr key={field}><td className="px-4 py-3 font-mono font-semibold">{field}</td><td className="px-4 py-3 text-zinc-500">{type}</td><td className="px-4 py-3">{usage}</td><td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{desc}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold">2. Resposta da sessão</h2>
          <pre className={code}>{`{
  "success": true,
  "data": {
    "sessionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "checkoutUrl": "https://checkout.xpayments.digital/pay/xxxxxxxx-...",
    "embedUrl": "https://checkout.xpayments.digital/embed/xxxxxxxx-...",
    "expiresAt": "2026-09-05T18:30:00.000Z"
  }
}`}</pre>
          <p className="text-xs leading-5 text-zinc-500">
            <strong>checkoutUrl</strong> é usado no fluxo Redirect. <strong>embedUrl</strong> representa a sessão embedded; para integração normal recomendamos o SDK <code>xpay.js</code>, que cria e fecha o modal por si.
          </p>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <h2 className="text-xl font-bold">Redirect URL</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Use o <code>checkoutUrl</code> devolvido pela API.</p>
            <pre className={`${code} mt-4`}>{`window.location.href = checkoutUrl;`}</pre>
            <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-zinc-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> O retorno ao Merchant só ocorre depois de o Checkout observar estado financeiro confirmado.</div>
          </div>

          <div className={card}>
            <h2 className="text-xl font-bold">Embedded SDK</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">O Merchant não precisa construir ou gerir o iframe manualmente.</p>
            <pre className={`${code} mt-4`}>{`<script src="https://checkout.xpayments.digital/xpay.js"></script>
<script>
  XPayments.open({
    sessionId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    theme: "light",
    closeOnBackdrop: true,
    onSuccess: () => {
      // Recarregue o pedido no seu backend antes de mostrar "Pago".
      window.location.reload();
    },
    onClose: (reason) => {
      console.log("Checkout closed", reason);
    }
  });
</script>`}</pre>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniSpec title="sessionId" value="Obrigatório" text="UUID da CheckoutSession criada no servidor." />
          <MiniSpec title="theme" value="Opcional" text="light ou dark. O branding da Store continua autoritativo para identidade." />
          <MiniSpec title="onSuccess" value="Callback" text="Executado quando o iframe comunica SUCCESS e o modal é fechado." />
          <MiniSpec title="onClose" value="Callback" text="Recebe CLOSED, CANCELLED ou outro motivo de fecho não sucedido." />
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-500" /><h2 className="text-2xl font-bold">3. Métodos de pagamento</h2></div>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            O Checkout apresenta métodos rápidos configurados no routing da Store e um modo Stripe dinâmico. O provider continua a decidir quais métodos são elegíveis para aquele pagamento.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["card", "Cartões"],
              ["mb_way", "MB WAY"],
              ["bizum", "Bizum"],
              ["multibanco", "Multibanco"],
              ["stripe_all", "Mais opções"],
            ].map(([method, label]) => (
              <div key={method} className={card}><code className="text-xs font-semibold">{method}</code><p className="mt-2 text-sm">{label}</p></div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            <strong className="text-zinc-950 dark:text-white">Mais opções</strong> utiliza Stripe Payment Element com métodos dinâmicos. Stripe filtra e ordena métodos elegíveis com base em moeda, dispositivo, disponibilidade e configuração do provider. Não existe um segundo motor financeiro: a Transaction continua no core XPayments.
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <div className="flex items-center gap-2"><Palette className="h-5 w-5 text-cyan-500" /><h2 className="text-xl font-bold">Branding por Store</h2></div>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Em <strong>Stores → Gerenciar → Checkout Experience</strong>, configure nome público, logo HTTPS, cor principal, tema e retorno automático. O nome interno da Store e o Store Code permanecem operacionais e não são mostrados como identidade comercial quando existe nome público.
            </p>
          </div>

          <div className={card}>
            <h2 className="text-xl font-bold">Localização e moeda</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              O runtime atual adapta idioma, formatação e prioridade dos métodos através do locale e timezone do browser. Portugal prioriza MB WAY/Multibanco; Espanha prioriza Bizum; outros mercados priorizam Card/Stripe Dynamic.
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              A moeda financeira não é alterada silenciosamente por localização. <code>currency</code> da CheckoutSession é definida pelo Merchant/Store e permanece autoritativa. Isto evita conversões implícitas e divergência contabilística.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-emerald-500" /><h2 className="text-2xl font-bold">4. Estados da CheckoutSession</h2></div>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Redirect, <code>requires_action</code>, regresso do browser ou fecho de iframe não significam sucesso. XPayments reconcilia CheckoutSession e Transaction com o estado do provider. Enquanto o provider ainda está em ação/processamento, a sessão permanece <code>pending</code>; o estado final positivo é <code>succeeded</code>.
          </p>
          <div className="mt-5 overflow-x-auto rounded-[24px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60"><tr><th className="px-4 py-3">status</th><th className="px-4 py-3">Significado</th></tr></thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">{statuses.map(([status, desc]) => <tr key={status}><td className="px-4 py-3 font-mono font-semibold">{status}</td><td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{desc}</td></tr>)}</tbody>
            </table>
          </div>
          <pre className={`${code} mt-5`}>{`GET /api/v1/checkout/session/{sessionId}

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

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <div className="flex items-center gap-2"><Webhook className="h-5 w-5 text-violet-500" /><h2 className="text-xl font-bold">Webhook é a confirmação do Merchant</h2></div>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              O Checkout melhora UX e acompanha o estado, mas o backend do Merchant deve atualizar o pedido a partir do Merchant Delivery assinado. Não use redirect ou callback do browser como fonte única de verdade.
            </p>
            <Link href="/doc/s2s#webhooks" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-300">Configurar webhooks <ExternalLink className="h-3.5 w-3.5" /></Link>
          </div>
          <div className={card}>
            <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-cyan-500" /><h2 className="text-xl font-bold">API Keys e ambientes</h2></div>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Cada sessão é criada com uma API Key da Store. Mantenha Test e Live separados e nunca exponha a chave ao browser.
            </p>
            <Link href="/doc/s2s#credentials" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-300">Gerir API Keys <ExternalLink className="h-3.5 w-3.5" /></Link>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /><h2 className="text-2xl font-bold">5. Erros a tratar</h2></div>
          <div className="mt-5 overflow-x-auto rounded-[24px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60"><tr><th className="px-4 py-3">HTTP</th><th className="px-4 py-3">code / situação</th><th className="px-4 py-3">Ação</th></tr></thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">{errors.map(([http, err, action]) => <tr key={`${http}-${err}`}><td className="px-4 py-3 font-mono">{http}</td><td className="px-4 py-3 font-mono font-semibold">{err}</td><td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{action}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-500" /><h2 className="text-2xl font-bold">6. Checklist de produção</h2></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SecurityCard icon={LockKeyhole} title="API Key server-side" text="Nunca exponha xp_live_ ou xp_test_ no browser, HTML, app móvel ou frontend compilado." />
            <SecurityCard icon={Server} title="Criação server-to-server" text="Crie CheckoutSession a partir do backend do Merchant e entregue apenas sessionId/checkoutUrl ao browser." />
            <SecurityCard icon={Webhook} title="Webhook validado" text="Valide HMAC, deduplique eventos e responda HTTP 2xx rapidamente." />
            <SecurityCard icon={Store} title="Store correta" text="Confirme moeda, ambiente, provider e métodos da Store antes de usar xp_live_." />
            <SecurityCard icon={Clock3} title="Expiração" text="Defina uma validade compatível com o fluxo e trate CHECKOUT_EXPIRED no Merchant." />
            <SecurityCard icon={CheckCircle2} title="Sucesso confirmado" text="Só marque o pedido como pago quando o estado financeiro for succeeded." />
          </div>
        </section>

        <section className="mt-12 rounded-[24px] border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="font-semibold">Sandbox</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            Use Store Sandbox + <code>xp_test_</code>. Para MB WAY, Multibanco e outros métodos com simuladores, utilize apenas valores de teste no ambiente Test. Em Live use dados reais e nunca misture API Key Test com Gateway Live.
          </p>
          <Link href="/doc/s2s#sandbox" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">Ver dados de Sandbox <ExternalLink className="h-3.5 w-3.5" /></Link>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
          <Link className="underline underline-offset-4" href="/doc">Developer Portal</Link>
          <Link className="underline underline-offset-4" href="/doc/s2s">API Server-to-Server</Link>
        </footer>
      </div>
    </main>
  );
}

function Prereq({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className={card}>
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"><Icon className="h-5 w-5" /></div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{text}</p>
    </div>
  );
}

function MiniSpec({ title, value, text }: { title: string; value: string; text: string }) {
  return (
    <div className={card}>
      <p className="font-mono text-xs font-semibold">{title}</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">{value}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{text}</p>
    </div>
  );
}

function SecurityCard({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className={card}>
      <Icon className="h-5 w-5 text-emerald-500" />
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{text}</p>
    </div>
  );
}
