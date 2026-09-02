"use client";

import * as React from "react";
import { Webhook, History, ServerCog } from "lucide-react";
import { useStoreControl } from "@/hooks/vnext";
import WebhooksVNextPage from "@/components/merchant/webhooks-vnext";
import WebhooksLegacyPage from "@/components/merchant/webhooks-legacy";
import WebhooksLegacyScopedPage from "@/components/merchant/webhooks-legacy-scoped";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function WebhooksPage() {
  const { data: stores = [], isLoading, isError } = useStoreControl();
  const [surface, setSurface] = React.useState<"vnext" | "legacy">("vnext");

  const vnextStores = React.useMemo(
    () => stores.filter(
      (store) =>
        store.integration.runtimeGeneration === "VNEXT" &&
        (store.integration.processingMode === "OBSERVED" ||
          store.integration.processingMode === "ORCHESTRATED"),
    ),
    [stores],
  );

  const legacyStores = React.useMemo(
    () => stores.filter(
      (store) =>
        store.integration.runtimeGeneration === "LEGACY" ||
        store.integration.webhookManagement === "LEGACY",
    ),
    [stores],
  );

  const hasVNext = vnextStores.length > 0;
  const hasLegacy = legacyStores.length > 0;

  React.useEffect(() => {
    if (!hasVNext && hasLegacy) setSurface("legacy");
    if (hasVNext && !hasLegacy) setSurface("vnext");
  }, [hasVNext, hasLegacy]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  /*
   * Backwards-compatibility circuit breaker:
   * if the additive VNext Control Plane is unavailable,
   * preserve the production legacy webhook manager exactly.
   */
  if (isError || !hasVNext) {
    return <WebhooksLegacyPage />;
  }

  if (!hasLegacy) {
    return <WebhooksVNextPage />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 border-border/60 bg-card/60 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Webhook management mode</p>
            <p className="text-[11px] text-muted-foreground">
              O Store Control Plane detetou Stores VNext e Legacy. Cada CRUD fica estritamente limitado ao respetivo Store Mode.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={surface === "vnext" ? "default" : "outline"}
            className="gap-1.5"
            onClick={() => setSurface("vnext")}
          >
            <ServerCog className="h-3.5 w-3.5" /> VNext ({vnextStores.length})
          </Button>
          <Button
            size="sm"
            variant={surface === "legacy" ? "default" : "outline"}
            className="gap-1.5"
            onClick={() => setSurface("legacy")}
          >
            <History className="h-3.5 w-3.5" /> Legacy ({legacyStores.length})
          </Button>
        </div>
      </Card>

      {surface === "vnext" ? (
        <WebhooksVNextPage />
      ) : (
        <WebhooksLegacyScopedPage allowedStoreIds={legacyStores.map((store) => store.id)} />
      )}
    </div>
  );
}
