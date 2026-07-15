"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Code2, Terminal, Copy, BookOpen, AlertTriangle, ShieldCheck, Zap,
  ExternalLink, ChevronRight, FlaskConical, Phone, CheckCircle2, XCircle,
  Clock, Ban,
} from "lucide-react";
import { PageHeader, fadeUp } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---- Code block component with copy + basic syntax tinting ----
function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const copy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => toast.success("Copied to clipboard"));
    }
  };
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-black/50">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          <span className="ml-2 text-[10px] font-medium text-muted-foreground">{lang}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-muted-foreground" onClick={copy}>
          <Copy className="h-3 w-3" /> Copy
        </Button>
      </div>
      <pre className="scrollbar-thin overflow-x-auto p-4 text-xs leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ---- Section wrapper ----
function DocSection({ id, icon: Icon, title, children }: { id: string; icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <motion.div id={id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="scroll-mt-20">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

// ---- Param table ----
function ParamTable({ rows }: { rows: { name: string; type: string; required: boolean; desc: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">Parâmetro</th>
            <th className="px-4 py-2 font-medium">Tipo</th>
            <th className="px-4 py-2 font-medium">Obrigatório</th>
            <th className="px-4 py-2 font-medium">Descrição</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border/30">
              <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.name}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.type}</td>
              <td className="px-4 py-2.5">
                {r.required ? (
                  <Badge variant="outline" className="border-rose-500/25 bg-rose-500/10 text-rose-400 text-[10px]">Obrigatório</Badge>
                ) : (
                  <Badge variant="outline" className="border-border/60 bg-muted/30 text-muted-foreground text-[10px]">Opcional</Badge>
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-foreground">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Sandbox magic numbers ----
const SANDBOX_NUMBERS = [
  { phone: "+351 911 111 112", scenario: "Sucesso", result: "Transação transita para succeeded após ~30s.", icon: CheckCircle2, color: "text-emerald-400" },
  { phone: "+351 911 111 113", scenario: "Indisponibilidade", result: "Erro: Método não disponível no momento.", icon: Ban, color: "text-amber-400" },
  { phone: "+351 911 111 114", scenario: "Recusa do Provedor", result: "Erro: Pagamento recusado pelo provedor.", icon: XCircle, color: "text-rose-400" },
  { phone: "+351 911 111 115", scenario: "Expiração", result: "Erro: Tentativa de pagamento expirada por tempo limite.", icon: Clock, color: "text-amber-400" },
  { phone: "+351 911 111 116", scenario: "Recusa do Cliente", result: "Erro: Pagamento rejeitado manualmente pelo cliente na app.", icon: XCircle, color: "text-rose-400" },
];

// ---- Code snippets ----
const SNIPPET_S2S_MBWAY = `curl -X POST https://api.xpayments.digital/api/v1/payments/charge \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_test_xpayments_v3" \\
  -d '{
    "amount": 1400,
    "currency": "EUR",
    "payment_method_types": ["mb_way"],
    "metadata": { "order_id": "XPAY-TEST-FULL-FLOW-06" },
    "customer": { "name": "Sandbox Tester", "phone": "+351911111112" }
  }'`;

const SNIPPET_S2S_MULTIBANCO = `curl -X POST https://api.xpayments.digital/api/v1/payments/charge \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_test_xpayments_v3" \\
  -d '{
    "amount": 3450,
    "currency": "EUR",
    "payment_method_types": ["multibanco"],
    "metadata": { "order_id": "XPAY-TEST-MB-16" },
    "customer": { "email": "dev@xpayments.digital" }
  }'`;

const SNIPPET_CHECKOUT = `curl -X POST https://api.xpayments.digital/api/v1/checkout/session \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_test_xpayments_v3" \\
  -d '{
    "amount": 2510,
    "currency": "EUR",
    "metadata": { "order_id": "CHECKOUT-TEST-12" },
    "customer": { "email": "test@xpayments.digital" }
  }'`;

const WEBHOOK_EXAMPLE = `{
  "event": "payment_intent.succeeded",
  "transaction_id": "e345b9d0-bbde-4696-9850-d74e8b49a7e1",
  "reference": "XPAY-TEST-MBW-02",
  "amount": 15.00,
  "currency": "EUR",
  "status": "succeeded",
  "method": "mb_way",
  "timestamp": "2026-07-15T09:05:54.835Z"
}`;

// ---- Main component ----
export default function DevelopersPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Documentação API"
        description="Documentação oficial da XPay API — integração S2S, Checkout Session, Webhooks e Sandbox."
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full flex-wrap gap-1">
          <TabsTrigger value="overview" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="auth" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Autenticação</TabsTrigger>
          <TabsTrigger value="s2s" className="gap-1.5"><Code2 className="h-3.5 w-3.5" /> Pagamentos S2S</TabsTrigger>
          <TabsTrigger value="checkout" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Checkout</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Webhooks</TabsTrigger>
          <TabsTrigger value="sandbox" className="gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Sandbox</TabsTrigger>
        </TabsList>

        {/* ===== Overview ===== */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <DocSection id="overview" icon={BookOpen} title="Visão Geral">
            <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Bem-vindo à documentação oficial da <strong className="text-foreground">XPay API</strong>. A nossa plataforma
                foi desenvolvida para ajudar o seu negócio a processar pagamentos de forma segura, escalável e intuitiva.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A XPay oferece duas modalidades principais de integração:
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">API Merchant S2S</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Server-to-Server: o seu backend comunica diretamente com a XPay API. Ideal para checkout 100% customizado.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Checkout Session</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Redirecionamento seguro para uma interface de pagamento alojada e gerida pela XPay.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-border/60 bg-card/60 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Terminal className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-foreground">Base URL</p>
                  <code className="text-sm text-primary">https://api.xpayments.digital/api/v1</code>
                </div>
              </div>
            </Card>
          </DocSection>
        </TabsContent>

        {/* ===== Auth ===== */}
        <TabsContent value="auth" className="mt-6 space-y-6">
          <DocSection id="auth" icon={ShieldCheck} title="Autenticação">
            <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <p className="text-sm text-muted-foreground">
                Todas as requisições à XPay API devem ser autenticadas utilizando a sua chave de API
                (<code className="text-primary">x-api-key</code>) no cabeçalho (header).
              </p>
              <div className="mt-4">
                <CodeBlock code={`x-api-key: A_SUA_CHAVE_AQUI`} lang="header" />
              </div>
            </Card>

            {/* Warning */}
            <div className="flex items-start gap-3 rounded-lg border border-rose-500/25 bg-rose-500/8 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div>
                <p className="text-sm font-medium text-rose-300">Aviso de Segurança</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Nunca exponha a sua chave secreta no lado do cliente (frontend, aplicações mobile ou código
                  JavaScript visível). Mantenha-a sempre segura no seu ambiente de servidor.
                </p>
              </div>
            </div>

            {/* Info card */}
            <div className="flex items-start gap-3 rounded-lg border border-sky-500/25 bg-sky-500/8 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <div>
                <p className="text-sm font-medium text-sky-300">Chave de Testes Genérica</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Para testar a API no ambiente Sandbox, utilize sempre a nossa chave genérica:{" "}
                  <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-amber-300">sk_test_xpayments_v3</code>
                </p>
              </div>
            </div>
          </DocSection>
        </TabsContent>

        {/* ===== S2S ===== */}
        <TabsContent value="s2s" className="mt-6 space-y-6">
          <DocSection id="s2s" icon={Code2} title="Pagamentos S2S (Charge)">
            <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <p className="text-sm text-muted-foreground">
                Utilize este endpoint para iniciar transações diretamente do seu servidor.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400">POST</Badge>
                <code className="text-sm text-primary">/payments/charge</code>
              </div>
            </Card>

            <ParamTable rows={[
              { name: "amount", type: "Integer", required: true, desc: "Valor total em cêntimos (ex: 1500 = 15.00€)" },
              { name: "currency", type: "String", required: true, desc: "Moeda da transação (ex: \"EUR\")" },
              { name: "payment_method_types", type: "Array", required: true, desc: "Métodos aceites: [\"mb_way\"] ou [\"multibanco\"]" },
              { name: "metadata", type: "Object", required: false, desc: "Dados customizados para referência (ex: {\"order_id\": \"123\"})" },
              { name: "customer", type: "Object", required: true, desc: "Objeto com name, phone (obrigatório para MB WAY) ou email" },
            ]} />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Exemplos</h3>
              <Tabs defaultValue="mbway">
                <TabsList>
                  <TabsTrigger value="mbway" className="gap-1.5 text-xs"><Phone className="h-3 w-3" /> MB WAY</TabsTrigger>
                  <TabsTrigger value="multibanco" className="gap-1.5 text-xs"><Code2 className="h-3 w-3" /> Multibanco</TabsTrigger>
                </TabsList>
                <TabsContent value="mbway" className="mt-3">
                  <CodeBlock code={SNIPPET_S2S_MBWAY} lang="bash" />
                </TabsContent>
                <TabsContent value="multibanco" className="mt-3">
                  <CodeBlock code={SNIPPET_S2S_MULTIBANCO} lang="bash" />
                </TabsContent>
              </Tabs>
            </div>
          </DocSection>
        </TabsContent>

        {/* ===== Checkout ===== */}
        <TabsContent value="checkout" className="mt-6 space-y-6">
          <DocSection id="checkout" icon={ExternalLink} title="Checkout Session">
            <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <p className="text-sm text-muted-foreground">
                Ideal se prefere que a XPay faça a gestão e a recolha sensível dos dados de pagamento
                através de uma página segura.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400">POST</Badge>
                <code className="text-sm text-primary">/checkout/session</code>
              </div>
            </Card>
            <CodeBlock code={SNIPPET_CHECKOUT} lang="bash" />
          </DocSection>
        </TabsContent>

        {/* ===== Webhooks ===== */}
        <TabsContent value="webhooks" className="mt-6 space-y-6">
          <DocSection id="webhooks" icon={Zap} title="Webhooks (Notificações)">
            <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
              <p className="text-sm text-muted-foreground">
                Como os pagamentos são assíncronos, a XPay envia notificações via POST para o URL
                configurado pelo Merchant.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <code className="text-xs font-medium text-foreground">payment_intent.succeeded</code>
                  <span className="text-xs text-muted-foreground">— Pagamento processado com sucesso.</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/8 px-3 py-2">
                  <XCircle className="h-4 w-4 text-rose-400" />
                  <code className="text-xs font-medium text-foreground">payment_intent.payment_failed</code>
                  <span className="text-xs text-muted-foreground">— Pagamento falhou, expirou ou foi recusado.</span>
                </div>
              </div>
            </Card>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Exemplo de payload:</p>
              <CodeBlock code={WEBHOOK_EXAMPLE} lang="json" />
            </div>
          </DocSection>
        </TabsContent>

        {/* ===== Sandbox ===== */}
        <TabsContent value="sandbox" className="mt-6 space-y-6">
          <DocSection id="sandbox" icon={FlaskConical} title="Ambiente de Testes (Sandbox)">
            {/* Highlighted sandbox card */}
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative z-10">
                <div className="mb-3 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold">Chave de Testes Genérica</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para facilitar a sua integração, utilize a chave genérica{" "}
                  <code className="rounded bg-black/40 px-2 py-0.5 font-mono text-sm text-amber-300">sk_test_xpayments_v3</code>
                  {" "}e os números "mágicos" de MB WAY para simular todos os cenários possíveis sem custos.
                </p>
              </div>
            </div>

            {/* Magic numbers table */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Phone className="h-4 w-4 text-primary" />
                Números Mágicos MB WAY
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Número de Telefone</th>
                      <th className="px-4 py-2 font-medium">Cenário Simulado</th>
                      <th className="px-4 py-2 font-medium">Resultado Esperado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SANDBOX_NUMBERS.map((n) => (
                      <tr key={n.phone} className="border-b border-border/30 transition hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            <n.icon className={cn("h-3.5 w-3.5", n.color)} />
                            <code className="font-mono text-xs text-foreground">{n.phone}</code>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px]">{n.scenario}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{n.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </DocSection>
        </TabsContent>
      </Tabs>

      {/* Support footer */}
      <motion.div {...fadeUp} className="mt-4">
        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <h3 className="text-sm font-semibold">Suporte Técnico</h3>
            <p className="max-w-md text-xs text-muted-foreground">
              Precisa de ajuda com a sua integração? A nossa equipa técnica está pronta para o apoiar.
              Contacte-nos através do nosso portal de suporte oficial.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open("/support", "_self")}>
                <ExternalLink className="h-3.5 w-3.5" /> Portal de Suporte
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open("https://t.me/XPayments_Manager", "_blank")}>
                <ChevronRight className="h-3.5 w-3.5" /> Telegram Manager
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
