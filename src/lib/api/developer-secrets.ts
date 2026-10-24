import { requestData } from "./client";

export interface RevealedApiKey {
  id: string;
  storeId: string;
  storeName: string;
  storeCode: string;
  name: string;
  environment: "live" | "test";
  scopes: string[];
  fullKey: string;
  keyPreview: string;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface RevealedWebhookSecret {
  id: string;
  storeId: string;
  storeName: string;
  storeCode: string;
  url: string;
  secret: string;
  secretPreview: string;
}

export const developerSecretsApi = {
  revealApiKey: (id: string) =>
    requestData<RevealedApiKey>({
      url: `api-keys/${id}/reveal`,
      method: "POST",
    }),

  rotateApiKey: (id: string) =>
    requestData<RevealedApiKey>({
      url: `api-keys/${id}/rotate`,
      method: "POST",
      data: { confirm: true },
    }),

  revealWebhookSecret: (id: string) =>
    requestData<RevealedWebhookSecret>({
      url: `webhooks/${id}/reveal`,
      method: "POST",
    }),

  rotateWebhookSecret: (id: string) =>
    requestData<RevealedWebhookSecret>({
      url: `webhooks/${id}/rotate-secret`,
      method: "POST",
      data: { confirm: true },
    }),
};
