"use client";

import type { LucideIcon } from "lucide-react";
import { Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocSection } from "./code-block";

export function MaintenanceSection({
  id,
  title,
  icon,
  description,
}: {
  id: string;
  title: string;
  icon?: LucideIcon;
  description: string;
}) {
  const Icon = icon ?? Wrench;

  return (
    <DocSection id={id} icon={Icon} title={title}>
      <Card className="border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-500/25 bg-amber-500/10 text-amber-300 text-[11px]"
          >
            Em manutenção
          </Badge>
          <span className="text-xs text-muted-foreground">
            Não utilizar como contrato de integração em produção.
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          A documentação ativa e certificada neste momento é a integração <strong className="text-foreground">API Merchant S2S</strong>, incluindo autenticação, criação de pagamentos, métodos suportados e webhooks.
        </p>
      </Card>
    </DocSection>
  );
}
