import { requestData } from "./client";
import type {
  CheckoutBranding,
  CreateWebhookV2Payload,
  CreateWebhookV2Result,
  MerchantStoreDetail,
  StoreControlItem,
  StoreIntegration,
  StorePaymentMethods,
  UpdateCheckoutBrandingPayload,
  UpdateStorePaymentMethodPayload,
  UpdateWebhookV2Payload,
  WebhookV2,
} from "@/types/vnext";

export const storeControlApi = {
  list: () =>
    requestData<StoreControlItem[]>({
      url: "store-control/stores",
      method: "GET",
    }),

  integration: (storeId: string) =>
    requestData<StoreIntegration>({
      url: `stores/${storeId}/integration`,
      method: "GET",
    }),

  merchantDetail: (storeId: string) =>
    requestData<MerchantStoreDetail>({
      url: `merchant/stores/${storeId}`,
      method: "GET",
    }),

  updateCheckoutBranding: (storeId: string, payload: UpdateCheckoutBrandingPayload) =>
    requestData<{
      storeId: string;
      storeCode: string;
      checkoutBranding: CheckoutBranding;
    }>({
      url: `merchant/stores/${storeId}/checkout-branding`,
      method: "PUT",
      data: payload,
    }),
};

export const paymentMethodsApi = {
  list: (storeId: string) =>
    requestData<StorePaymentMethods>({
      url: `stores/${storeId}/payment-methods`,
      method: "GET",
    }),

  update: (storeId: string, methodId: string, payload: UpdateStorePaymentMethodPayload) =>
    requestData<StorePaymentMethods>({
      url: `stores/${storeId}/payment-methods/${methodId}`,
      method: "PUT",
      data: payload,
    }),
};

export const webhooksV2Api = {
  list: (storeId?: string) =>
    requestData<WebhookV2[]>({
      url: "webhooks/v2",
      method: "GET",
      params: storeId ? { storeId } : undefined,
    }),

  create: (payload: CreateWebhookV2Payload) =>
    requestData<CreateWebhookV2Result>({
      url: "webhooks/v2",
      method: "POST",
      data: payload,
    }),

  update: (id: string, payload: UpdateWebhookV2Payload) =>
    requestData<WebhookV2>({
      url: `webhooks/v2/${id}`,
      method: "PUT",
      data: payload,
    }),

  reveal: (id: string) =>
    requestData<{ id: string; signingSecret: string }>({
      url: `webhooks/v2/${id}/reveal`,
      method: "POST",
    }),

  remove: (id: string) =>
    requestData<{ ok: boolean }>({
      url: `webhooks/v2/${id}`,
      method: "DELETE",
    }),
};

export const vnextApi = {
  storeControl: storeControlApi,
  paymentMethods: paymentMethodsApi,
  webhooksV2: webhooksV2Api,
};
