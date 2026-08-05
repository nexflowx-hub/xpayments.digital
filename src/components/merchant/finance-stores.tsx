"use client";

import * as React from "react";
import { RefreshCw, Building2 } from "lucide-react";
import { useFinanceStores } from "@/hooks/queries";
import { PageHeader, ErrorState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StoreWalletGrid } from "@/components/merchant/finance/store-wallet-card";
import { StoreWalletDialog } from "@/components/merchant/finance/store-wallet-dialog";
import type { FinanceStore } from "@/types";

export default function FinanceStoresPage() {
  const { data: storesRes, isLoading, isError, refetch, isFetching } = useFinanceStores("EUR");
  const stores = storesRes?.stores ?? [];
  const currency = storesRes?.currency ?? "EUR";

  const [selectedStore, setSelectedStore] = React.useState<FinanceStore | null>(null);
  const [storeDialogOpen, setStoreDialogOpen] = React.useState(false);

  function handleStoreClick(store: FinanceStore) {
    setSelectedStore(store);
    setStoreDialogOpen(true);
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Por Store" description="Dados financeiros por unidade de venda." />
        <ErrorState message="Não foi possível carregar os dados por Store." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Por Store"
        description="Dados financeiros por unidade de venda."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {stores.length} stores
            </Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className={isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Atualizar
            </Button>
          </div>
        }
      />

      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Stores — {currency}</h3>
            <p className="text-xs text-muted-foreground">Vendas líquidas e saldo operacional por unidade de venda.</p>
          </div>
        </div>
        <StoreWalletGrid
          stores={stores}
          currency={currency}
          loading={isLoading && !storesRes}
          onStoreClick={handleStoreClick}
        />
      </Card>

      <StoreWalletDialog
        open={storeDialogOpen}
        onOpenChange={setStoreDialogOpen}
        store={selectedStore}
        currency={currency}
        generatedAt={storesRes?.generatedAt}
      />
    </div>
  );
}
