import { request, requestData, tokenStore } from "./client";
import type {
  AdminMerchant,
  AnalyticsOverview,
  ApiKey,
  AuthEnvelope,
  AuthResponse,
  AuthSession,
  Customer,
  Invoice,
  KycReview,
  Paginated,
  PaymentLink,
  Product,
  RegisterPayload,
  RiskProfile,
  Store,
  Subscription,
  SystemHealth,
  Transaction,
  TreasuryOverview,
  User,
  Wallet,
  WalletMovement,
  Webhook,
  DataTableFilters,
  CurrencyCode,
  UserRole,
} from "@/types";

/**
 * XPayments API surface — real REST only.
 *
 * Routes are RELATIVE (no leading slash) and match BACKEND.md §5.4 exactly:
 *   - Merchant-scoped resources are TOP-LEVEL (the JWT identifies the merchant;
 *     no /merchants/ prefix in the URL).
 *   - Admin resources live under admin/...
 *   - Auth lives under auth/...
 *
 * ALL non-auth endpoints use `requestData<T>()` which unwraps the standard
 * `{ success, data, message? }` envelope and returns `.data` directly.
 * Components receive clean domain objects, never the envelope wrapper.
 */

// ---- Auth ----

function mapEnvelopeToSession(envelope: AuthEnvelope, email: string): AuthSession {
  if (!envelope.success || !envelope.data) {
    throw {
      message: envelope.error || envelope.message || "Authentication failed.",
      status: 401,
    };
  }
  const d = envelope.data;
  const user: User = {
    id: d.merchantId,
    name: d.name,
    email,
    role: (d.role || "merchant") as UserRole,
    merchantId: d.merchantId,
    tier: d.tier,
  };
  return {
    accessToken: d.token,
    refreshToken: d.token,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8,
    user,
  };
}

export const auth = {
  login: async (email: string, password: string, remember = false): Promise<AuthSession> => {
    const envelope = await request<AuthEnvelope>({
      url: "auth/login",
      method: "POST",
      data: { email, password, remember },
    });
    return mapEnvelopeToSession(envelope, email);
  },
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const envelope = await request<AuthEnvelope>({
      url: "auth/register",
      method: "POST",
      data,
    });
    return mapEnvelopeToSession(envelope, data.email);
  },
  forgot: (email: string) =>
    request<{ success: boolean; message?: string }>({ url: "auth/forgot", method: "POST", data: { email } }),
  reset: (token: string, password: string) =>
    request<{ success: boolean; message?: string }>({ url: "auth/reset", method: "POST", data: { token, password } }),
  me: () => requestData<User>({ url: "auth/me", method: "GET" }),
  /** POST auth/logout — revokes the refresh token server-side */
  logout: () =>
    request<{ success: boolean }>({ url: "auth/logout", method: "POST" }).catch(() => {
      // Best-effort — even if the network fails, clear locally
    }).then(() => tokenStore.clear()),
};

// ---- Wallets (top-level per BACKEND.md) ----
export const wallets = {
  /** GET wallets */
  list: () => requestData<Wallet[]>({ url: "wallets", method: "GET" }),
  /** GET wallets/movements?walletId= */
  movements: (walletId?: string) =>
    requestData<WalletMovement[]>({ url: "wallets/movements", method: "GET", params: { walletId } }),
  /** POST wallets/swap */
  swap: (from: CurrencyCode, to: CurrencyCode, amount: number) =>
    requestData<{ ok: boolean; rate: number }>({ url: "wallets/swap", method: "POST", data: { from, to, amount } }),
  /** POST wallets/deposit */
  deposit: (currency: CurrencyCode, amount: number, method: string) =>
    requestData<{ ok: boolean; reference: string }>({ url: "wallets/deposit", method: "POST", data: { currency, amount, method } }),
  /** POST wallets/payout */
  payout: (currency: CurrencyCode, amount: number, beneficiary: string) =>
    requestData<{ ok: boolean; reference: string }>({ url: "wallets/payout", method: "POST", data: { currency, amount, beneficiary } }),
};

// ---- Analytics (top-level per BACKEND.md) ----
export const analytics = {
  /** GET analytics/overview */
  overview: () => requestData<AnalyticsOverview>({ url: "analytics/overview", method: "GET" }),
};

// ---- Risk (top-level per BACKEND.md) ----
export const risk = {
  /** GET risk/profile */
  profile: () => requestData<RiskProfile>({ url: "risk/profile", method: "GET" }),
};

// ---- Transactions (top-level per BACKEND.md) ----
export const transactions = {
  /** GET transactions — paginated + filtered */
  list: (filters: DataTableFilters = {}) =>
    requestData<Paginated<Transaction>>({ url: "transactions", method: "GET", params: filters }),
  /** GET transactions/:id */
  detail: (id: string) =>
    requestData<Transaction>({ url: `transactions/${id}`, method: "GET" }),
};

// ---- Customers (top-level per BACKEND.md) ----
export const customers = {
  /** GET customers */
  list: () => requestData<Customer[]>({ url: "customers", method: "GET" }),
};

// ---- Commerce (top-level per BACKEND.md) ----
export const products = {
  /** GET products */
  list: () => requestData<Product[]>({ url: "products", method: "GET" }),
  /** POST products */
  create: (data: Partial<Product>) =>
    requestData<Product>({ url: "products", method: "POST", data }),
  /** DELETE products/:id */
  remove: (id: string) =>
    requestData<{ ok: boolean }>({ url: `products/${id}`, method: "DELETE" }),
};

export const stores = {
  /** GET stores */
  list: () => requestData<Store[]>({ url: "stores", method: "GET" }),
};

export const paymentLinks = {
  /** GET payment-links */
  list: () => requestData<PaymentLink[]>({ url: "payment-links", method: "GET" }),
};

export const invoices = {
  /** GET invoices */
  list: () => requestData<Invoice[]>({ url: "invoices", method: "GET" }),
};

export const subscriptions = {
  /** GET subscriptions */
  list: () => requestData<Subscription[]>({ url: "subscriptions", method: "GET" }),
};

// ---- Developers (top-level per BACKEND.md) ----
export const apiKeys = {
  /** GET api-keys */
  list: () => requestData<ApiKey[]>({ url: "api-keys", method: "GET" }),
  /** POST api-keys */
  create: (name: string, environment: "live" | "test", scopes: string[]) =>
    requestData<ApiKey>({ url: "api-keys", method: "POST", data: { name, environment, scopes } }),
  /** DELETE api-keys/:id */
  revoke: (id: string) =>
    requestData<{ ok: boolean }>({ url: `api-keys/${id}`, method: "DELETE" }),
};

export const webhooks = {
  /** GET webhooks */
  list: () => requestData<Webhook[]>({ url: "webhooks", method: "GET" }),
  /** POST webhooks */
  create: (url: string, events: string[]) =>
    requestData<Webhook>({ url: "webhooks", method: "POST", data: { url, events } }),
  /** DELETE webhooks/:id */
  remove: (id: string) =>
    requestData<{ ok: boolean }>({ url: `webhooks/${id}`, method: "DELETE" }),
};

// ---- Payouts / Deposits (top-level per BACKEND.md) ----
export const payouts = {
  /** GET payouts */
  list: () => requestData<WalletMovement[]>({ url: "payouts", method: "GET" }),
};

export const deposits = {
  /** GET deposits */
  list: () => requestData<WalletMovement[]>({ url: "deposits", method: "GET" }),
};

// ---- Treasury (top-level per BACKEND.md) ----
export const treasury = {
  /** GET treasury/overview */
  overview: () => requestData<TreasuryOverview>({ url: "treasury/overview", method: "GET" }),
};

// ---- KYC (top-level per BACKEND.md) ----
export const kyc = {
  /** GET kyc/status */
  status: () =>
    requestData<{ status: string; submittedAt?: string; documents?: unknown[]; riskFlags?: string[] }>({
      url: "kyc/status",
      method: "GET",
    }),
};

// ---- Admin (platform-level per BACKEND.md) ----
export const admin = {
  /** GET admin/treasury/overview */
  treasury: () => requestData<TreasuryOverview>({ url: "admin/treasury/overview", method: "GET" }),
  /** GET admin/merchants */
  merchants: () => requestData<AdminMerchant[]>({ url: "admin/merchants", method: "GET" }),
  /** POST admin/merchants/:id/status */
  setMerchantStatus: (id: string, status: AdminMerchant["status"]) =>
    requestData<{ ok: boolean }>({ url: `admin/merchants/${id}/status`, method: "POST", data: { status } }),
  /** GET admin/kyc — approval queue */
  kycQueue: () => requestData<KycReview[]>({ url: "admin/kyc", method: "GET" }),
  /** POST admin/kyc/:id/approved | admin/kyc/:id/rejected */
  kycDecision: (id: string, decision: "approved" | "rejected") =>
    requestData<{ ok: boolean }>({ url: `admin/kyc/${id}/${decision}`, method: "POST" }),
  /** GET admin/health */
  health: () => requestData<SystemHealth>({ url: "admin/health", method: "GET" }),
  /** GET admin/revenue */
  revenue: () =>
    requestData<{ total: number; series: { date: string; value: number }[] }>({ url: "admin/revenue", method: "GET" }),
};

export const xpApi = {
  auth, wallets, analytics, risk, transactions, customers, products, stores,
  paymentLinks, invoices, subscriptions, apiKeys, webhooks, payouts, deposits,
  treasury, kyc, admin,
};

export type XpApi = typeof xpApi;
