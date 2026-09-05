"use client";

import { TestTube2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DocSection, InlineCode, Callout, SubHeading } from "./code-block";

export function S2SSandboxSection() {
  const mbway = [
    ["+351 911 111 112", "Sucesso após confirmação"],
    ["+351 911 111 113", "Método indisponível"],
    ["+351 911 111 114", "Recusa do provedor"],
    ["+351 911 111 115", "Tentativa expirada"],
    ["+351 911 111 116", "Recusa do cliente"],
  ];

  const bizum = [
    ["+34 600 000 001", "Sucesso no Sandbox XPayments validado"],
    ["+34 600 000 002", "Falha no Sandbox XPayments validado"],
  ];

  const multibanco = [
    ["succeed_immediately@example.com", "Pagamento concluído em poucos segundos"],
    ["expire_immediately@example.com", "Referência expira imediatamente"],
    ["expire_with_delay@example.com", "Referência expira após atraso de teste"],
    ["fill_never@example.com", "Referência permanece sem pagamento"],
  ];

  return (
    <DocSection id="sandbox" icon={TestTube2} title="Sandbox e Simuladores">
      <Callout variant="warning" title="Apenas Test/Sandbox">
        Estes valores servem exclusivamente para ambientes de teste. Nunca utilize simuladores com uma API Key Live.
      </Callout>

      <SubHeading>MB WAY</SubHeading>
      <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur-xl">
        <table className="w-full text-xs">
          <tbody>
            {mbway.map(([value, result]) => (
              <tr key={value} className="border-b border-border/30">
                <td className="px-4 py-2 font-mono text-primary">{value}</td>
                <td className="px-4 py-2 text-muted-foreground">{result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted-foreground">
        O runtime remove espaços e normaliza o telefone antes de enviar ao provedor.
      </p>

      <SubHeading>Bizum</SubHeading>
      <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur-xl">
        <table className="w-full text-xs">
          <tbody>
            {bizum.map(([value, result]) => (
              <tr key={value} className="border-b border-border/30">
                <td className="px-4 py-2 font-mono text-primary">{value}</td>
                <td className="px-4 py-2 text-muted-foreground">{result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Callout variant="info" title="Origem dos números Bizum">
        Estes dois números correspondem aos simuladores que foram validados no ambiente Sandbox XPayments das integrações anteriores. Utilize-os apenas se a sua Store possuir Sandbox configurado.
      </Callout>

      <SubHeading>Multibanco</SubHeading>
      <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur-xl">
        <table className="w-full text-xs">
          <tbody>
            {multibanco.map(([value, result]) => (
              <tr key={value} className="border-b border-border/30">
                <td className="px-4 py-2 font-mono text-primary">{value}</td>
                <td className="px-4 py-2 text-muted-foreground">{result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted-foreground">
        Envie o email no campo <InlineCode>customer.email</InlineCode>. O resultado definitivo chega pelo webhook Merchant.
      </p>
    </DocSection>
  );
}
