export type RuntimeGeneration = "LEGACY" | "VNEXT";
export type ProcessingMode = "OBSERVED" | "ORCHESTRATED" | null;
export type ActivationState =
  | "DRAFT"
  | "SHADOW"
  | "VALIDATED"
  | "READY"
  | "ACTIVE"
  | "ROLLED_BACK"
  | "DISABLED"
  | null;

export interface StoreIntegrationConnection {
  id: string;
  alias: string;
  mode: string;
  status: string;
  shadowMode: boolean;
  ledgerEnabled: boolean;
}

export interface StoreIntegrationProvider {
  type: string;
  accountRef: string | null;
}

export interface StoreIntegrationObserver {
  endpointId: string | null;
  syncStatus: string | null;
  status: string | null;
}

export interface StoreIntegration {
  runtimeGeneration: RuntimeGeneration;
  processingMode: ProcessingMode;
  activationState: ActivationState;
  effectiveFrom: string | null;
  legacyCompatibility: boolean;
  connection: StoreIntegrationConnection | null;
  provider: StoreIntegrationProvider | null;
  observer: StoreIntegrationObserver;
  webhookManagement: "PROVIDER_DIRECT" | "XPAYMENTS" | "LEGACY";
}

export interface StoreControlItem {
  id: string;
  storeCode: string;
  name: string;
  domain: string | null;
  status: string;
  currency: string;
  integration: StoreIntegration;
}

export type WebhookV2Status = "ACTIVE" | "PAUSED" | "DISABLED";

export interface WebhookV2 {
  id: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  deliveryMode: "PROVIDER_DIRECT" | "XPAYMENTS";
  url: string;
  events: string[];
  status: WebhookV2Status;
  remoteEndpointId: string | null;
  remoteSyncStatus: string | null;
  lastSyncError: string | null;
  lastDeliveryAt: string | null;
  secretAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookV2Payload {
  storeId: string;
  url: string;
  events: string[];
}

export interface UpdateWebhookV2Payload {
  url?: string;
  events?: string[];
  status?: "ACTIVE" | "PAUSED";
}

export interface CreateWebhookV2Result {
  id: string;
  storeId: string;
  storeCode: string;
  url: string;
  events: string[];
  status: "ACTIVE";
  deliveryMode: "PROVIDER_DIRECT";
  remoteEndpointId: string;
  remoteSyncStatus: "SYNCED";
  signingSecret: string;
}
