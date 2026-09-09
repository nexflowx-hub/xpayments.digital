"use client";

import ApiKeysPage from "@/components/merchant/api-keys";
import { StripeElementsConfigCard } from "@/components/merchant/stripe-elements-config-card";
import { useStores } from "@/hooks/queries";

export default function ApiKeysEnhancedPage() {
  const { data: stores = [] } = useStores();

  return (
    <div className="flex flex-col gap-6">
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
