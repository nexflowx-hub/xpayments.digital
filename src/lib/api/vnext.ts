import { requestData } from "./client";
import type {
  CreateWebhookV2Payload,
  CreateWebhookV2Result,
  StoreControlItem,
  StoreIntegration,
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
  webhooksV2: webhooksV2Api,
};
