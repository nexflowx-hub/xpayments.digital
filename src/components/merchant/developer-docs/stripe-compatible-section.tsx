"use client";

import { ArrowRight, CheckCircle2, CreditCard, KeyRound, ShieldCheck, Webhook } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./code-block";

const createIntent = `curl https://api.xpayments.digital/api/stripe/v1/payment_intents \\
  -H "Authorization: Bearer xp_test_xxxxxxxxx" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Idempotency-Key: order-12345" \\
  --data-urlencode "amount=2500" \\
  --data-urlencode "currency=eur" \\
  --data-urlencode "automatic_payment_methods[enabled]=true"`;

const stripeOriginal = `curl https://api.stripe.com/v1/payment_intents \\
  -H "Authorization: Bearer sk_test_xxxxxxxxx" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Idempotency-Key: order-12345" \\
  --data-urlencode "amount=2500" \\
  --data-urlencode "currency=eur" \\
  --data-urlencode "automatic_payment_methods[enabled]=true"`;

const elements = `// Backend: create the PaymentIntent through XPayments
const intent = await fetch(
  "https://api.xpayments.digital/api/stripe/v1/payment_intents",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer xp_test_xxxxxxxxx",
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": "order-12345"
    },
    body: new URLSearchParams({
      amount: "2500",
      currency: "eur",
      "automatic_payment_methods[enabled]": "true"
    })
  }
).then(r => r.json());

// Browser: Stripe.js still requires the Store publishable key.
// Get pk_* from Dashboard > Developers > API Keys > Stripe Elements compatibility.
const stripe = Stripe("pk_test_xxxxxxxxx");
const elements = stripe.elements({ clientSecret: intent.client_secret });
const paymentElement = elements.create("payment");
paymentElement.mount("#payment-element");`;

export function StripeCompatibleSection() {
  return (
    <section id="stripe-compatible" className="scroll-mt-24 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Stripe-compatible Direct API</h2>
        <Badge variant="outline" className="border-sky-500/25 bg-sky-500/10 text-sky-300">TEST / CONTROLLED BETA</Badge>
      </div>
      <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
        Compatibilidade para Merchants que já utilizam o contrato Stripe v1. O objetivo é manter o request Stripe e alterar essencialmente a base URL e a credencial server-side. A Store continua a ser roteada pelo XPayments para o ProviderAccount, ProviderConnection e GatewayVault configurados.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-4"><KeyRound className="h-4 w-4 text-sky-300" /><h3 className="mt-3 text-sm font-semibold">Server key</h3><p className="mt-1 text-xs leading-5 text-muted-foreground"><code>xp_test_*</code> / <code>xp_live_*</code>. Nunca colocar no browser.</p></Card>
        <Card className="border-border/60 bg-card/60 p-4"><CreditCard className="h-4 w-4 text-sky-300" /><h3 className="mt-3 text-sm font-semibold">Stripe Elements</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Opcional. Stripe.js usa a <code>pk_*</code> pública da Store e o <code>client_secret</code> do PaymentIntent.</p></Card>
        <Card className="border-border/60 bg-card/60 p-4"><ShieldCheck className="h-4 w-4 text-sky-300" /><h3 className="mt-3 text-sm font-semibold">Gateway isolation</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">A <code>sk_*</code> física e webhook secret permanecem no GatewayVault XPayments.</p></Card>
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" /><div><h3 className="text-sm font-semibold text-emerald-300">Migração mínima do request</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Formato <code>application/x-www-form-urlencoded</code>, <code>Idempotency-Key</code> e <code>Stripe-Version</code> são preservados pelo relay. Não envie a chave Stripe secreta ao XPayments request; use a API key <code>xp_*</code> associada à Store.</p></div></div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">Stripe original <ArrowRight className="h-3.5 w-3.5" /> referência</div><CodeBlock code={stripeOriginal} lang="bash" /></div>
        <div><div className="mb-2 text-xs font-semibold text-sky-300">XPayments Stripe-compatible</div><CodeBlock code={createIntent} lang="bash" /></div>
      </div>

      <Card className="border-border/60 bg-card/60 p-5">
        <h3 className="text-sm font-semibold">PaymentIntent endpoints disponíveis</h3>
        <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
          {[
            "POST /api/stripe/v1/payment_intents",
            "GET /api/stripe/v1/payment_intents/:id",
            "POST /api/stripe/v1/payment_intents/:id",
            "POST /api/stripe/v1/payment_intents/:id/confirm",
            "POST /api/stripe/v1/payment_intents/:id/cancel",
            "POST /api/stripe/v1/payment_intents/:id/capture",
          ].map((endpoint) => <code key={endpoint} className="rounded-lg border border-border/50 bg-background/50 px-3 py-2">{endpoint}</code>)}
        </div>
      </Card>

      <div className="space-y-2"><h3 className="text-sm font-semibold">Usar Payment Element no seu próprio frontend</h3><p className="text-xs leading-5 text-muted-foreground">O Payment Element é Stripe-specific: a criação do PaymentIntent ocorre no seu backend através de XPayments, mas Stripe.js no browser necessita da publishable key <code>pk_*</code>. Essa chave é pública por natureza; o Dashboard XPayments mostra-a separadamente das credenciais secretas. Se não quiser expor o provider, utilize Checkout XPay Embedded.</p><CodeBlock code={elements} lang="javascript" /></div>

      <Card className="border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3"><Webhook className="mt-0.5 h-4 w-4 text-amber-300" /><div><h3 className="text-sm font-semibold text-amber-200">Webhooks</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">A confirmação financeira continua assíncrona por webhook. O webhook Merchant normalizado XPayments está disponível no core atual. A reentrega <strong>STRIPE_COMPAT</strong> com Event Stripe completo e assinatura própria XPayments está em certificação e não deve ser assumida como disponível até aparecer como CERTIFIED nesta documentação.</p></div></div>
      </Card>

      <Card className="border-border/60 bg-card/60 p-5">
        <h3 className="text-sm font-semibold">Qual integração escolher?</h3>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="text-muted-foreground"><tr className="border-b border-border/60"><th className="py-2">Modelo</th><th>Frontend</th><th>Credencial browser</th><th>Provider visível</th><th>Uso recomendado</th></tr></thead><tbody className="divide-y divide-border/40"><tr><td className="py-3 font-medium">Checkout XPay Embedded</td><td>iframe payment-only</td><td>Nenhuma</td><td>Não</td><td>Provider-neutral</td></tr><tr><td className="py-3 font-medium">XPayments S2S Native</td><td>Merchant-owned</td><td>Depende do método</td><td>Não</td><td>Integração XPayments nova</td></tr><tr><td className="py-3 font-medium">Stripe-compatible + Elements</td><td>Stripe Payment Element</td><td><code>pk_*</code></td><td>Sim</td><td>Migrar integração Stripe existente</td></tr></tbody></table></div>
      </Card>
    </section>
  );
}
