import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";
import { StripeCompatibleSection } from "@/components/merchant/developer-docs/stripe-compatible-section";

export const metadata: Metadata = {
  title: "Stripe-compatible Direct API | XPayments Docs",
  description: "Guia de integração Stripe-compatible Direct, Payment Intents, Stripe Elements, credenciais e routing XPayments.",
};

export default function StripeCompatibleDocsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/doc" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> XPayments Developer Docs
            </Link>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> HTTPS · Store-scoped routing · secrets protected</div>
          </div>
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-300"><BookOpen className="h-3.5 w-3.5" /> API 03 · Stripe-compatible Direct</div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mantenha o contrato Stripe. Troque o routing.</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Para integrações existentes baseadas em Stripe v1 Payment Intents. O request continua form-encoded e a Store é resolvida pelo XPayments para o GatewayVault configurado.</p>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <StripeCompatibleSection />
      </div>
    </main>
  );
}
