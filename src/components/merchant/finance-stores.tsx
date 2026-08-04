"use client";

import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Building2, Lock } from "lucide-react";

export default function FinanceStoresPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Por Store"
        description="Dados financeiros por unidade de venda."
      />
      <Card className="border-border/60 bg-card/60 p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted/40">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Por Loja</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Esta secção será disponibilizada na próxima versão do deploy.
              Os dados financeiros por loja estarão disponíveis em breve.
            </p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2">
            <p className="text-xs font-medium text-amber-400">
              Indisponível nesta versão
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
