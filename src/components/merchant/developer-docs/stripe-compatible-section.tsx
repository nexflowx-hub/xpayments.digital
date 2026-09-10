"use client";

import { ArrowRight, CheckCircle2, CreditCard, KeyRound, ShieldCheck, Webhook } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./code-block";

const createIntent = `curl https://api.xpayments.digital/api/stripe/v1/payment_intents \\
  -u "xp_test_xxxxxxxxx:" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Idempotency-Key: order-12345" \\
  --data-urlencode "amount=2500" \\
  --data-urlencode "currency=eur" \\
  --data-urlencode "payment_method_types[]=card" \\
  --data-urlencode "metadata[merchant_reference]=order-12345"`;

const stripeOriginal = `curl https://api.stripe.com/v1/payment_intents \\
  -u "sk_test_xxxxxxxxx:" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Idempotency-Key: order-12345" \\
  --data-urlencode "amount=2500" \\
  --data-urlencode "currency=eur" \\
  --data-urlencode "payment_method_types[]=card" \\
  --data-urlencode "metadata[merchant_reference]=order-12345"`;

const elements = `// Backend: create the PaymentIntent through XPayments
const body = new URLSearchParams();
body.set("amount", "2500");
body.set("currency", "eur");
body.append("payment_method_types[]", "card");
body.set("metadata[merchant_reference]", "order-12345");

const response = await fetch(
  "https://api.xpayments.digital/api/stripe/v1/payment_intents",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer xp_test_xxxxxxxxx",
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": "order-12345"
    },
    body
  }
);

if (!response.ok) throw new Error("XPAYMENTS_PAYMENT_INTENT_CREATE_FAILED");
const intent = await response.json();

// Browser: Stripe.js uses the public Store key only.
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
        <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-300">E2E CERTIFIED · PRODUCTION PATH</Badge>
      </div>
      <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
        Compatibilidade para Merchants que já utilizam Stripe v1 Payment Intents. O request continua form-encoded, a autenticação server-side passa a usar uma chave XPayments da Store e o routing segue ProviderAccount, ProviderConnection e GatewayVault configurados. O fluxo de cartão foi certificado end-to-end em Stripe TEST com criação, confirmação, webhook verificado, Finance Core, ledger exatamente uma vez, Merchant webhook e replay idempotente.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60 p-4"><KeyRound className="h-4 w-4 text-sky-300" /><h3 className="mt-3 text-sm font-semibold">Server key</h3><p className="mt-1 text-xs leading-5 text-muted-foreground"><code>xp_test_*</code> / <code>xp_live_*</code>. Nunca colocar no browser.</p></Card>
        <Card className="border-border/60 bg-card/60 p-4"><CreditCard className="h-4 w-4 text-sky-300" /><h3 className="mt-3 text-sm font-semibold">Stripe Elements</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Stripe.js usa a <code>pk_*</code> pública da Store e o <code>client_secret</code> do PaymentIntent. A <code>pk_*</code> pode ser exposta no frontend; segredos não.</p></Card>
        <Card className="border-border/60 bg-card/60 p-4"><ShieldCheck className="h-4 w-4 text-sky-300" /><h3 className="mt-3 text-sm font-semibold">Gateway isolation</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">A <code>sk_*</code> física, <code>rk_*</code> e webhook secret permanecem no GatewayVault XPayments.</p></Card>
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" /><div><h3 className="text-sm font-semibold text-emerald-300">Fluxo certificado</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Create PaymentIntent → Transaction XPayments → metadata <code>nexflowx_transaction_id</code> → confirm → Stripe webhook verificado → Transaction <code>succeeded</code> → WalletMovement exatamente uma vez → Merchant webhook. Repetir o mesmo create com o mesmo <code>Idempotency-Key</code> devolve o PaymentIntent existente sem duplicar a Transaction.</p></div></div>
      </Card>

      <Card className="border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" /><div><h3 className="text-sm font-semibold text-emerald-300">Migração mínima do request</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Formato <code>application/x-www-form-urlencoded</code>, <code>Idempotency-Key</code> e <code>Stripe-Version</code> são preservados pelo relay. HTTP Basic com <code>-u xp_*:</code>, Bearer e <code>x-api-key</code> são aceites. Nunca envie a chave Stripe secreta ao XPayments.</p></div></div>
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
        <p className="mt-3 text-xs leading-5 text-muted-foreground">O exemplo acima usa <code>payment_method_types[]=card</code>, que corresponde ao caminho certificado. Outros métodos Stripe dependem da configuração, moeda, país e capabilities da conta física associada à Store; não assuma disponibilidade apenas porque o parâmetro é aceite pelo relay.</p>
      </Card>

      <div className="space-y-2"><h3 className="text-sm font-semibold">Usar Payment Element no seu próprio frontend</h3><p className="text-xs leading-5 text-muted-foreground">O Payment Element é Stripe-specific: a criação do PaymentIntent ocorre no seu backend através de XPayments, mas Stripe.js no browser necessita da publishable key <code>pk_*</code>. A área Developers &gt; API Keys mostra essa chave separadamente das credenciais secretas. Se não quiser expor o provider, utilize Checkout XPay Embedded.</p><CodeBlock code={elements} lang="javascript" /></div>

      <Card className="border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3"><Webhook className="mt-0.5 h-4 w-4 text-amber-300" /><div><h3 className="text-sm font-semibold text-amber-200">Webhooks</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">A confirmação financeira é assíncrona. O webhook Merchant normalizado XPayments está certificado para o fluxo Stripe-compatible e deve ser tratado de forma idempotente pelo Merchant. Não documentamos nem garantimos, neste momento, uma reentrega outbound em formato de Event Stripe completo; integre contra o contrato de webhook XPayments.</p></div></div>
      </Card>

      <Card className="border-border/60 bg-card/60 p-5">
        <h3 className="text-sm font-semibold">Qual integração escolher?</h3>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="text-muted-foreground"><tr className="border-b border-border/60"><th className="py-2">Modelo</th><th>Frontend</th><th>Credencial browser</th><th>Provider visível</th><th>Uso recomendado</th></tr></thead><tbody className="divide-y divide-border/40"><tr><td className="py-3 font-medium">Checkout XPay Embedded</td><td>iframe payment-only</td><td>Nenhuma</td><td>Não</td><td>Provider-neutral</td></tr><tr><td className="py-3 font-medium">XPayments S2S Native</td><td>Merchant-owned</td><td>Depende do método</td><td>Não</td><td>Integração XPayments nova</td></tr><tr><td className="py-3 font-medium">Stripe-compatible + Elements</td><td>Stripe Payment Element</td><td><code>pk_*</code></td><td>Sim</td><td>Migrar integração Stripe existente</td></tr></tbody></table></div>
      </Card>
    </section>
  );
}
