"use client";

import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./code-block";

const createIntent = `curl https://api.xpayments.digital/api/stripe/v1/payment_intents \\
  -u "xp_test_xxxxxxxxx:" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Idempotency-Key: order-12345-payment-1" \\
  --data-urlencode "amount=2500" \\
  --data-urlencode "currency=eur" \\
  --data-urlencode "automatic_payment_methods[enabled]=true" \\
  --data-urlencode "metadata[merchant_reference]=order-12345"`;

const stripeOriginal = `curl https://api.stripe.com/v1/payment_intents \\
  -u "sk_test_xxxxxxxxx:" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Idempotency-Key: order-12345-payment-1" \\
  --data-urlencode "amount=2500" \\
  --data-urlencode "currency=eur" \\
  --data-urlencode "automatic_payment_methods[enabled]=true" \\
  --data-urlencode "metadata[merchant_reference]=order-12345"`;

const elements = `// Server: create the PaymentIntent through XPayments.
const body = new URLSearchParams();
body.set("amount", "2500");
body.set("currency", "eur");
body.set("automatic_payment_methods[enabled]", "true");
body.set("metadata[merchant_reference]", "order-12345");

const response = await fetch(
  "https://api.xpayments.digital/api/stripe/v1/payment_intents",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer xp_test_xxxxxxxxx",
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": "order-12345-payment-1"
    },
    body
  }
);

if (!response.ok) throw new Error("XPAYMENTS_PAYMENT_INTENT_CREATE_FAILED");
const intent = await response.json();

// Persist intent.id + intent.metadata.nexflowx_transaction_id server-side.

// Browser: Stripe.js uses only the Store's browser-safe pk_*.
const stripe = Stripe("pk_test_xxxxxxxxx");
const elements = stripe.elements({ clientSecret: intent.client_secret });
const paymentElement = elements.create("payment");
paymentElement.mount("#payment-element");`;

export function StripeCompatibleSection() {
  return (
    <section id="stripe-compatible" className="scroll-mt-24 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Stripe-compatible Direct API</h2>
        <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
          TEST + LIVE E2E CERTIFIED
        </Badge>
      </div>

      <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
        Compatibilidade para projetos baseados em Stripe v1 Payment Intents. O request continua form-encoded,
        a autenticação server-side usa uma chave XPayments da Store e o routing segue a configuração
        ProviderAccount → ProviderConnection → GatewayVault. O fluxo de cartão foi validado end-to-end em TEST
        e num pagamento LIVE controlado, incluindo webhook Stripe verificado, Finance Core e WalletMovement.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-4">
          <KeyRound className="h-4 w-4 text-sky-300" />
          <h3 className="mt-3 text-sm font-semibold">Server key</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            <code>xp_test_*</code> / <code>xp_live_*</code>. Store-scoped e nunca exposta no browser.
          </p>
        </Card>
        <Card className="border-border/60 bg-card/60 p-4">
          <CreditCard className="h-4 w-4 text-sky-300" />
          <h3 className="mt-3 text-sm font-semibold">Stripe Elements</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Stripe.js usa a <code>pk_*</code> pública da Store e o <code>client_secret</code> do PaymentIntent.
          </p>
        </Card>
        <Card className="border-border/60 bg-card/60 p-4">
          <ShieldCheck className="h-4 w-4 text-sky-300" />
          <h3 className="mt-3 text-sm font-semibold">Gateway isolation</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            <code>sk_*</code>, <code>rk_*</code> e provider webhook secrets permanecem no GatewayVault XPayments.
          </p>
        </Card>
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-300">Fluxo certificado</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Create PaymentIntent → Transaction XPayments → <code>nexflowx_transaction_id</code> → confirmação
              Stripe.js → webhook Stripe verificado → Transaction <code>succeeded</code> → fee/net → WalletMovement
              exatamente uma vez. Retries do create usam <code>Idempotency-Key</code> estável.
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-sky-500/20 bg-sky-500/5 p-5">
        <h3 className="text-sm font-semibold text-sky-200">Métodos de pagamento</h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Para Payment Element com cobertura ampla, prefira <code>automatic_payment_methods[enabled]=true</code>.
          A lista real é dinâmica e depende da Store, conta Stripe, moeda, país, capabilities, valor e contexto do
          comprador. Não trate a lista de um PaymentIntent como garantia estática da plataforma.
        </p>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            Stripe original <ArrowRight className="h-3.5 w-3.5" /> referência
          </div>
          <CodeBlock code={stripeOriginal} lang="bash" />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-sky-300">XPayments Stripe-compatible</div>
          <CodeBlock code={createIntent} lang="bash" />
        </div>
      </div>

      <Card className="border-border/60 bg-card/60 p-5">
        <h3 className="text-sm font-semibold">PaymentIntent endpoints</h3>
        <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
          {[
            "POST /api/stripe/v1/payment_intents",
            "GET /api/stripe/v1/payment_intents/:id",
            "POST /api/stripe/v1/payment_intents/:id",
            "POST /api/stripe/v1/payment_intents/:id/confirm",
            "POST /api/stripe/v1/payment_intents/:id/cancel",
            "POST /api/stripe/v1/payment_intents/:id/capture",
          ].map((endpoint) => (
            <code key={endpoint} className="rounded-lg border border-border/50 bg-background/50 px-3 py-2">
              {endpoint}
            </code>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Payment Element no frontend do Merchant</h3>
        <p className="text-xs leading-5 text-muted-foreground">
          O backend cria o PaymentIntent através de XPayments. O browser usa Stripe.js com a publishable key
          <code> pk_* </code> disponibilizada para a Store. Nunca envie PAN/CVV ao backend XPayments.
        </p>
        <CodeBlock code={elements} lang="javascript" />
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <Webhook className="mt-0.5 h-4 w-4 text-amber-300" />
          <div>
            <h3 className="text-sm font-semibold text-amber-200">Finalidade e Merchant webhook</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Redirect, <code>return_url</code> e estado observado no browser são UX. Finalize o Order a partir do
              estado XPayments/webhook Merchant. O contrato normalizado usa <code>x-nexflowx-signature</code> com
              HMAC-SHA256 sobre o raw body. A XPayments não promete um outbound Stripe Event completo.
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-border/60 bg-card/60 p-5">
        <h3 className="text-sm font-semibold">Qual integração escolher?</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="py-2">Modelo</th><th>Frontend</th><th>Credencial browser</th><th>Provider visível</th><th>Uso recomendado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr><td className="py-3 font-medium">Checkout XPay</td><td>Hosted / Embedded</td><td>Nenhuma</td><td>Não</td><td>Provider-neutral</td></tr>
              <tr><td className="py-3 font-medium">Native S2S</td><td>Merchant-owned</td><td>Depende do método</td><td>Não</td><td>PIX/local actions</td></tr>
              <tr><td className="py-3 font-medium">Stripe-compatible + Elements</td><td>Stripe Payment Element</td><td><code>pk_*</code></td><td>Sim</td><td>Stripe-style integration</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
