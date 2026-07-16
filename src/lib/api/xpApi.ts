import { request, requestData } from "./client";
import type {
  AdminMerchant,
  AnalyticsOverview,
  ApiKey,
  AuthEnvelope,
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
  WalletsResponse,
  Webhook,
  DataTableFilters,
  CurrencyCode,
} from "@/types";

/**
 * XPayments API surface — aligned with API Contract v3.1.
 *
 * Base URL: https://api.xpayments.digital/api/v1 (NEXT_PUBLIC_API_URL)
 * Routes are RELATIVE (no leading slash).
 *
 * Envelope:
 *   Success: { success: true, data: T, meta?: {} }
 *   Error:   { success: false, error: { code, message } }
 *
 * Auth envelope (login only):
 *   { success: true, data: { token: "JWT", merchant: { id, name, email } } }
 *
 * requestData<T>() unwraps the standard envelope and returns `.data`.
 */

// ---- Auth ----

function mapEnvelopeToSession(envelope: AuthEnvelope, email: string): AuthSession {
  if (!envelope.success || !envelope.data) {
    throw {
      message: envelope.error?.message || "Authentication failed.",
      code: envelope.error?.code,
      status: 401,
    };
  }
  const { token, merchant } = envelope.data;
  const user: User = {
    id: merchant.id,
    name: merchant.name,
    email: merchant.email || email,
    role: "merchant",
    merchantId: merchant.id,
  };
  return {
    accessToken: token,
    refreshToken: token, // v3.1 doesn't issue a separate refresh token yet
    expiresAt: Date.now() + 1000 * 60 * 60 * 8,
    user,
  };
}

export const auth = {
  /** POST auth/login — v3.1: { token, merchant: { id, name, email } } */
  login: async (email: string, password: string, remember = false): Promise<AuthSession> => {
    const envelope = await request<AuthEnvelope>({
      url: "auth/login",
      method: "POST",
      data: { email, password, remember },
    });
    return mapEnvelopeToSession(envelope, email);
  },
  /** POST auth/register */
  register: async (data: RegisterPayload): Promise<AuthSession> => {
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
  logout: () =>
    request<{ success: boolean }>({ url: "auth/logout", method: "POST" }).catch(() => {}),
};

// ---- Analytics (v3.1: GET /analytics/overview) ----
export const analytics = {
  /** GET analytics/overview — returns { wallet, transactions, recentTransactions } */
  overview: () => requestData<AnalyticsOverview>({ url: "analytics/overview", method: "GET" }),
};

// ---- Transactions (v3.1: GET /transactions with ?page&limit&status&gateway&currency&reference) ----
export const transactions = {
  /** GET transactions — paginated, supports page, limit, status, gateway, currency, reference */
  list: (filters: DataTableFilters = {}) => {
    // Map frontend filters to v3.1 query params
    const params: Record<string, unknown> = {};
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    else if (filters.pageSize) params.limit = filters.pageSize;
    if (filters.status && filters.status !== "all") params.status = filters.status;
    if (filters.gateway && filters.gateway !== "all") params.gateway = filters.gateway;
    if (filters.currency && filters.currency !== "all") params.currency = filters.currency;
    if (filters.reference) params.reference = filters.reference;
    else if (filters.search) params.reference = filters.search;
    return requestData<Paginated<Transaction>>({ url: "transactions", method: "GET", params });
  },
  /** GET transactions/stats — aggregate stats */
  stats: () =>
    requestData<{
      total: number;
      approved: number;
      failed: number;
      pending: number;
      successRate: number;
      volume: number;
    }>({ url: "transactions/stats", method: "GET" }),
  /** GET transactions/:id */
  detail: (id: string) =>
    requestData<Transaction>({ url: `transactions/${id}`, method: "GET" }),
};

// ---- Wallets (v3.1: GET /wallets returns { wallets[], summary }) ----
export const wallets = {
  /** GET wallets — returns { wallets: Wallet[], summary: WalletSummary } */
  list: () => requestData<WalletsResponse>({ url: "wallets", method: "GET" }),
  /** GET wallets/movements — returns WalletMovement[] */
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

// ---- Risk ----
export const risk = {
  profile: () => requestData<RiskProfile>({ url: "risk/profile", method: "GET" }),
};

// ---- Customers ----
export const customers = {
  list: () => requestData<Customer[]>({ url: "customers", method: "GET" }),
};

// ---- Commerce ----
export const products = {
  list: () => requestData<Product[]>({ url: "products", method: "GET" }),
  create: (data: Partial<Product>) =>
    requestData<Product>({ url: "products", method: "POST", data }),
  remove: (id: string) =>
    requestData<{ ok: boolean }>({ url: `products/${id}`, method: "DELETE" }),
};

export const stores = {
  list: () => requestData<Store[]>({ url: "stores", method: "GET" }),
};

export const paymentLinks = {
  list: () => requestData<PaymentLink[]>({ url: "payment-links", method: "GET" }),
};

export const invoices = {
  list: () => requestData<Invoice[]>({ url: "invoices", method: "GET" }),
};

export const subscriptions = {
  list: () => requestData<Subscription[]>({ url: "subscriptions", method: "GET" }),
};

// ---- Developers ----
export const apiKeys = {
  list: () => requestData<ApiKey[]>({ url: "api-keys", method: "GET" }),
  create: (data: { name: string; environment: "live" | "test"; scopes: string[]; storeId: string }) =>
    requestData<ApiKey>({ url: "api-keys", method: "POST", data }),
  reveal: (id: string) =>
    requestData<ApiKey & { fullKey: string }>({ url: `api-keys/${id}/reveal`, method: "POST" }),
  revoke: (id: string) =>
    requestData<{ ok: boolean }>({ url: `api-keys/${id}`, method: "DELETE" }),
};

export const webhooks = {
  list: () => requestData<Webhook[]>({ url: "webhooks", method: "GET" }),
  create: (data: { url: string; events: string[]; storeId: string }) =>
    requestData<Webhook>({ url: "webhooks", method: "POST", data }),
  update: (id: string, url: string, events: string[]) =>
    requestData<Webhook>({ url: `webhooks/${id}`, method: "PUT", data: { url, events } }),
  remove: (id: string) =>
    requestData<{ ok: boolean }>({ url: `webhooks/${id}`, method: "DELETE" }),
};

// ---- Treasury ----
export const treasury = {
  overview: () => requestData<TreasuryOverview>({ url: "treasury/overview", method: "GET" }),
};

// ---- Checkout (v3.1) ----
export const checkout = {
  /** POST checkout/session — create checkout session (uses API key, not JWT) */
  createSession: (data: {
    amount: number;
    currency: string;
    reference: string;
    customerEmail: string;
    metadata?: Record<string, string>;
  }) =>
    requestData<{
      sessionId: string;
      checkoutUrl: string;
    }>({ url: "checkout/session", method: "POST", data }),
  /** GET checkout/session/:id — load session details (public) */
  loadSession: (id: string) =>
    requestData<{
      sessionId: string;
      storeName: string;
      amount: number;
      currency: string;
      reference: string;
    }>({ url: `checkout/session/${id}`, method: "GET" }),
};

// ---- KYC ----
export const kyc = {
  status: () =>
    requestData<{ status: string; submittedAt?: string; documents?: unknown[]; riskFlags?: string[] }>({
      url: "kyc/status",
      method: "GET",
    }),
};

// ---- Admin ----
export const admin = {
  treasury: () => requestData<TreasuryOverview>({ url: "admin/treasury/overview", method: "GET" }),
  merchants: () => requestData<AdminMerchant[]>({ url: "admin/merchants", method: "GET" }),
  setMerchantStatus: (id: string, status: AdminMerchant["status"]) =>
    requestData<{ ok: boolean }>({ url: `admin/merchants/${id}/status`, method: "POST", data: { status } }),
  kycQueue: () => requestData<KycReview[]>({ url: "admin/kyc", method: "GET" }),
  kycDecision: (id: string, decision: "approved" | "rejected") =>
    requestData<{ ok: boolean }>({ url: `admin/kyc/${id}/${decision}`, method: "POST" }),
  health: () => requestData<SystemHealth>({ url: "admin/health", method: "GET" }),
  revenue: () =>
    requestData<{ total: number; series: { date: string; value: number }[] }>({ url: "admin/revenue", method: "GET" }),
};

export const xpApi = {
  auth, analytics, transactions, wallets, risk, customers, products, stores,
  paymentLinks, invoices, subscriptions, apiKeys, webhooks, treasury, checkout,
  kyc, admin,
};

export type XpApi = typeof xpApi;
