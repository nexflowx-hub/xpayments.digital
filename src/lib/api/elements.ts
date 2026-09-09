import { requestData } from "./client";

export type ElementsConfig = {
  storeId: string;
  storeCode: string;
  storeName: string;
  available: boolean;
  mode: "STRIPE_ELEMENTS_COMPAT" | "XPAYMENTS_EMBED";
  environment?: string;
  publishableKey?: string;
  stripeAccountId?: string | null;
  relayBaseUrl?: string;
  reason?: string;
  note?: string;
};

export const elementsApi = {
  config: (storeId: string) =>
    requestData<ElementsConfig>({
      url: `developer/stores/${storeId}/elements-config`,
      method: "GET",
    }),
};
