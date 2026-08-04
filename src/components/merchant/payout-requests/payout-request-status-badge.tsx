"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { PayoutRequestStatus } from "@/types";

const statusKeyMap: Record<PayoutRequestStatus, string> = {
  draft: "pr.draft",
  requested: "pr.requested",
  under_review: "pr.underReview",
  rejected: "pr.rejected",
  cancelled: "pr.cancelled",
  stale: "pr.stale",
  confirmed: "pr.confirmed",
};

const statusClassMap: Record<PayoutRequestStatus, string> = {
  draft: "border-border bg-muted/40 text-muted-foreground",
  requested: "border-sky-500/25 bg-sky-500/12 text-sky-400",
  under_review: "border-amber-500/25 bg-amber-500/12 text-amber-400",
  rejected: "border-rose-500/25 bg-rose-500/12 text-rose-400",
  cancelled: "border-border bg-muted/40 text-muted-foreground",
  stale: "border-amber-500/25 bg-amber-500/8 text-amber-400",
  confirmed: "border-emerald-500/25 bg-emerald-500/12 text-emerald-400",
};

export function PayoutRequestStatusBadge({ status }: { status: PayoutRequestStatus }) {
  const t = useT();
  return <Badge variant="outline" className={cn("text-[10px]", statusClassMap[status])}>{t(statusKeyMap[status])}</Badge>;
}
