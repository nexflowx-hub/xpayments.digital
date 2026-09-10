"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import ApiKeysPage from "@/components/merchant/api-keys";
import { StripeElementsConfigCard } from "@/components/merchant/stripe-elements-config-card";
import { Card } from "@/components/ui/card";
import { useStores } from "@/hooks/queries";

export default function ApiKeysEnhancedPage() {
  const { data: stores = [] } = useStores();

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 border-violet-500/20 bg-violet-500/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">XPayments Developer Docs</h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Store onboarding, API Keys, Merchant Webhooks, Native S2S, Checkout XPay,
              Stripe-compatible Direct, payment methods, OpenAPI, exemplos e idempotência.
            </p>
          </div>
        </div>
        <a
          href="https://docs.xpayments.digital"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-xs font-semibold transition hover:bg-background"
        >
          Abrir documentação <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Card>

      <ApiKeysPage />
      <StripeElementsConfigCard
        stores={stores.map((store) => ({
          id: store.id,
          name: store.name,
          storeCode: store.storeCode,
        }))}
      />
    </div>
  );
}
