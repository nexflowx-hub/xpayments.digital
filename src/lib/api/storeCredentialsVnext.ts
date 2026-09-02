import { requestData } from "./client";
import type { ObservedProviderCredentials } from "@/types/store-credentials-vnext";

export const storeCredentialsVnextApi = {
  revealObserved: (storeId: string) =>
    requestData<ObservedProviderCredentials>({
      url: `stores/${storeId}/provider-credentials/reveal`,
      method: "POST",
    }),
};
