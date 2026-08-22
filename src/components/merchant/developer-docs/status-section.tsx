"use client";

import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DocSection,
  InlineCode,
  Callout,
  StatusBadge,
} from "./code-block";

const METHOD_STATUS = [
  { method: "Cards", status: "available" as const },
  { method: "MB WAY", status: "available" as const },
  { method: "Multibanco", status: "available" as const },
  { method: "Bizum", status: "available" as const },
  { method: "BLIK", status: "available" as const },
  { method: "Bancontact", status: "available" as const },
  { method: "PIX", status: "new" as const },
  { method: "Revolut Pay", status: "store" as const },
  { method: "Amazon Pay", status: "store" as const },
  { method: "Satispay", status: "store" as const },
];

export function StatusSection() {
  return (
    <DocSection id="status" icon={Activity} title="Estado da API">
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <StatusBadge variant="available">API v1 Stable</StatusBadge>
          <span className="text-xs text-muted-foreground">
            Endpoint: <InlineCode>https://api.xpayments.digital</InlineCode>
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          A XPayments API v1 está em estado <strong className="text-foreground">Stable</strong>.
          Todas as alterações ao contrato são feitas de forma retrocompatível.
        </p>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Método</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {METHOD_STATUS.map((m) => (
              <tr key={m.method} className="border-b border-border/30">
                <td className="px-4 py-2.5 text-sm font-medium text-foreground">{m.method}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge variant={m.status}>
                    {m.status === "available"
                      ? "Available"
                      : m.status === "new"
                        ? "NEW"
                        : "Store dependent"}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout variant="info" title="Monitorização de Uptime">
        A monitorização de uptime em tempo real não está disponível nesta versão da documentação.
        Contacte o suporte para informações sobre a disponibilidade de um método específico.
      </Callout>
    </DocSection>
  );
}
