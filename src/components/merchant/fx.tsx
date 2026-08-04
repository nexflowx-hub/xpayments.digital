"use client";

import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function FxPage() {
  const t = useT();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.fx")}
        description="Taxas em tempo real, conversão multi-moeda e atividade de swap recente."
      />
      <DisabledSection
        title="Câmbio"
        description="Esta secção será disponibilizada na próxima versão do deploy.
           Os dados de câmbio estarão disponíveis quando o endpoint de FX estiver ativo no backend."
      />
    </div>
  );
}

function DisabledSection({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-border/60 bg-card/60 p-8 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted/40">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2">
          <p className="text-xs font-medium text-amber-400">
            Indisponível nesta versão
          </p>
        </div>
      </div>
    </Card>
  );
}
