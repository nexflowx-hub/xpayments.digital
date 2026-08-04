"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PayoutRequestStatus } from "@/types";

const statusMap: Record<PayoutRequestStatus, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "border-border bg-muted/40 text-muted-foreground" },
  requested: { label: "Validação solicitada", className: "border-sky-500/25 bg-sky-500/12 text-sky-400" },
  under_review: { label: "Em análise", className: "border-amber-500/25 bg-amber-500/12 text-amber-400" },
  rejected: { label: "Rejeitado", className: "border-rose-500/25 bg-rose-500/12 text-rose-400" },
  cancelled: { label: "Cancelado", className: "border-border bg-muted/40 text-muted-foreground" },
  stale: { label: "Desatualizado", className: "border-amber-500/25 bg-amber-500/8 text-amber-400" },
  confirmed: { label: "Confirmado", className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400" },
};

export function PayoutRequestStatusBadge({ status }: { status: PayoutRequestStatus }) {
  const s = statusMap[status] ?? { label: status, className: "border-border bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={cn("text-[10px]", s.className)}>{s.label}</Badge>;
}
