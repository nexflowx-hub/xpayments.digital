import { request, tokenStore } from "./client";
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
 * Base URL is inherited from `client.ts` (NEXT_PUBLIC_API_URL). Every protected
 * request carries `Authorization: Bearer <token>` via the request interceptor.
 *
 * Routes are RELATIVE (no leading slash) so axios appends them to the baseURL
 * (https://api.xpayments.digital/api/v1). Adding a leading slash would make
 * axios treat the path as absolute and discard the /api/v1 prefix.
 */

// ---- Auth ----

/**
 * Maps the Master Backend auth envelope
 * `{ success, data: { merchantId, name, tier, token, role } }`
 * into the internal `AuthSession` shape used by the Zustand store and the
 * Axios request interceptor (which reads `tokenStore.access`).
 */
function mapEnvelopeToSession(envelope: AuthEnvelope, email: string): AuthSession {
  if (!envelope.success || !envelope.data) {
    throw {
      message: envelope.error || "Authentication failed.",
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
  /** POST auth/login — parses the { success, data: {...} } envelope */
  login: async (email: string, password: string, remember = false): Promise<AuthSession> => {
    const envelope = await request<AuthEnvelope>({
      url: "auth/login",
      method: "POST",
      data: { email, password, remember },
    });
    return mapEnvelopeToSession(envelope, email);
  },
  /** POST auth/register — same envelope as login */
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const envelope = await request<AuthEnvelope>({
      url: "auth/register",
      method: "POST",
      data,
    });
    return mapEnvelopeToSession(envelope, data.email);
  },
  /** POST auth/forgot */
  forgot: (email: string) =>
    request<{ ok: boolean }>({ url: "auth/forgot", method: "POST", data: { email } }),
  /** POST auth/reset */
  reset: (token: string, password: string) =>
    request<{ ok: boolean }>({ url: "auth/reset", method: "POST", data: { token, password } }),
  /** GET auth/me */
  me: () => request({ url: "auth/me", method: "GET" }),
  /** Client-side only: clears the persisted session */
  logout() {
    tokenStore.clear();
  },
};

// ---- Wallets (merchant-scoped) ----
export const wallets = {
  list: () => request<{ data: Wallet[] }>({ url: "merchants/wallets", method: "GET" }),
  movements: (walletId?: string) =>
    request<{ data: WalletMovement[] }>({ url: "merchants/wallets/movements", method: "GET", params: { walletId } }),
  swap: (from: CurrencyCode, to: CurrencyCode, amount: number) =>
    request<{ ok: boolean; rate: number }>({ url: "merchants/wallets/swap", method: "POST", data: { from, to, amount } }),
  deposit: (currency: CurrencyCode, amount: number, method: string) =>
    request<{ ok: boolean; reference: string }>({ url: "merchants/wallets/deposit", method: "POST", data: { currency, amount, method } }),
  payout: (currency: CurrencyCode, amount: number, beneficiary: string) =>
    request<{ ok: boolean; reference: string }>({ url: "merchants/wallets/payout", method: "POST", data: { currency, amount, beneficiary } }),
};

// ---- Analytics ----
export const analytics = {
  overview: () => request<AnalyticsOverview>({ url: "merchants/analytics", method: "GET" }),
};

// ---- Risk ----
export const risk = {
  profile: () => request<RiskProfile>({ url: "merchants/risk/profile", method: "GET" }),
};

// ---- Transactions ----
export const transactions = {
  list: (filters: DataTableFilters = {}) =>
    request<Paginated<Transaction>>({ url: "merchants/transactions", method: "GET", params: filters }),
  detail: (id: string) =>
    request<Transaction>({ url: `merchants/transactions/${id}`, method: "GET" }),
};

// ---- Customers ----
export const customers = {
  list: () => request<{ data: Customer[] }>({ url: "merchants/customers", method: "GET" }),
};

// ---- Commerce ----
export const products = {
  list: () => request<{ data: Product[] }>({ url: "merchants/products", method: "GET" }),
  create: (data: Partial<Product>) =>
    request<Product>({ url: "merchants/products", method: "POST", data }),
  remove: (id: string) =>
    request<{ ok: boolean }>({ url: `merchants/products/${id}`, method: "DELETE" }),
};

export const stores = {
  list: () => request<{ data: Store[] }>({ url: "merchants/stores", method: "GET" }),
};

export const paymentLinks = {
  list: () => request<{ data: PaymentLink[] }>({ url: "merchants/payment-links", method: "GET" }),
};

export const invoices = {
  list: () => request<{ data: Invoice[] }>({ url: "merchants/invoices", method: "GET" }),
};

export const subscriptions = {
  list: () => request<{ data: Subscription[] }>({ url: "merchants/subscriptions", method: "GET" }),
};

// ---- Developers ----
export const apiKeys = {
  list: () => request<{ data: ApiKey[] }>({ url: "api-keys", method: "GET" }),
  create: (name: string, environment: "live" | "test", scopes: string[]) =>
    request<ApiKey>({ url: "api-keys", method: "POST", data: { name, environment, scopes } }),
  revoke: (id: string) =>
    request<{ ok: boolean }>({ url: `api-keys/${id}`, method: "DELETE" }),
};

export const webhooks = {
  list: () => request<{ data: Webhook[] }>({ url: "merchants/webhooks", method: "GET" }),
  create: (url: string, events: string[]) =>
    request<Webhook>({ url: "merchants/webhooks", method: "POST", data: { url, events } }),
  remove: (id: string) =>
    request<{ ok: boolean }>({ url: `merchants/webhooks/${id}`, method: "DELETE" }),
};

// ---- Payouts / Deposits ----
export const payouts = {
  list: () => request<{ data: WalletMovement[] }>({ url: "merchants/payouts", method: "GET" }),
};

export const deposits = {
  list: () => request<{ data: WalletMovement[] }>({ url: "merchants/deposits", method: "GET" }),
};

// ---- Treasury ----
export const treasury = {
  overview: () => request<TreasuryOverview>({ url: "merchants/treasury", method: "GET" }),
};

// ---- KYC ----
export const kyc = {
  status: () =>
    request<{ status: string; submittedAt?: string; documents?: unknown[]; riskFlags?: string[] }>({
      url: "kyc/status",
      method: "GET",
    }),
};

// ---- Admin ----
export const admin = {
  treasury: () => request<TreasuryOverview>({ url: "admin/treasury/overview", method: "GET" }),
  merchants: () => request<{ data: AdminMerchant[] }>({ url: "admin/merchants", method: "GET" }),
  setMerchantStatus: (id: string, status: AdminMerchant["status"]) =>
    request<{ ok: boolean }>({ url: `admin/merchants/${id}/status`, method: "POST", data: { status } }),
  kycQueue: () => request<{ data: KycReview[] }>({ url: "admin/kyc", method: "GET" }),
  kycDecision: (id: string, decision: "approved" | "rejected") =>
    request<{ ok: boolean }>({ url: `admin/kyc/${id}/${decision}`, method: "POST" }),
  health: () => request<SystemHealth>({ url: "admin/health", method: "GET" }),
  revenue: () =>
    request<{ total: number; series: { date: string; value: number }[] }>({ url: "admin/revenue", method: "GET" }),
};

export const xpApi = {
  auth, wallets, analytics, risk, transactions, customers, products, stores,
  paymentLinks, invoices, subscriptions, apiKeys, webhooks, payouts, deposits,
  treasury, kyc, admin,
};

export type XpApi = typeof xpApi;
