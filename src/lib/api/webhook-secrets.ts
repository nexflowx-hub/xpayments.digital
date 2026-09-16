import { requestData } from "./client";

export type RevealedWebhookSecret = {
  id: string;
  storeId: string;
  storeName: string;
  storeCode: string;
  url: string;
  secret: string;
  secretPreview: string;
};

/**
 * Fetches the XPayments -> Merchant signing secret on demand.
 *
 * The webhook list intentionally never contains the full secret. The backend
 * verifies merchant ownership, marks this response no-store and audits the
 * reveal operation.
 */
export function revealWebhookSecret(id: string) {
  return requestData<RevealedWebhookSecret>({
    url: `webhooks/${id}/reveal`,
    method: "POST",
  });
}
