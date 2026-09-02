export interface ObservedProviderCredentials {
  storeId: string;
  provider: string;
  environment: string | null;
  accountId: string | null;
  publishableKey: string | null;
  secretKey: string | null;
  observerWebhookSecret: string | null;
  observerRemoteEndpointId: string | null;
}

export interface RevealedXPaymentsApiKey {
  id: string;
  fullKey: string;
}
