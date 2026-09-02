"use client";

import { useQuery } from "@tanstack/react-query";
import { vnextApi } from "@/lib/api/vnext";

export function useStoreControl() {
  return useQuery({
    queryKey: ["store-control", "stores"],
    queryFn: () => vnextApi.storeControl.list(),
    select: (data) => data ?? [],
  });
}

export function useStoreIntegration(storeId?: string | null) {
  return useQuery({
    queryKey: ["store-control", "integration", storeId],
    queryFn: () => vnextApi.storeControl.integration(storeId!),
    enabled: Boolean(storeId),
  });
}

export function useWebhooksV2(storeId?: string | null) {
  return useQuery({
    queryKey: ["webhooks", "v2", storeId ?? "all"],
    queryFn: () => vnextApi.webhooksV2.list(storeId ?? undefined),
    select: (data) => data ?? [],
  });
}
