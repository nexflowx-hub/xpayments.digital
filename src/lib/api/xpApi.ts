import { request, tokenStore } from "./client";
import {
  mockAdminMerchants,
  mockAnalytics,
  mockApiKeys,
  mockCustomers,
  mockInvoices,
  mockKycQueue,
  mockMovements,
  mockPaymentLinks,
  mockProducts,
  mockRisk,
  mockStores,
  mockSubscriptions,
  mockSystemHealth,
  mockTransactions,
  mockTreasury,
  mockWallets,
  mockWebhooks,
} from "./mock";
import type {
  AdminMerchant,
  AnalyticsOverview,
  ApiKey,
  AuthSession,
  Customer,
  Invoice,
  KycReview,
  Paginated,
  PaymentLink,
  Product,
  RiskProfile,
  Store,
  Subscription,
  SystemHealth,
  Transaction,
  TreasuryOverview,
  Wallet,
  WalletMovement,
  Webhook,
  DataTableFilters,
  CurrencyCode,
} from "@/types";

// ---- Auth ----
export const auth = {
  async login(email: string, password: string, remember = false) {
    return request<AuthSession>(
      { url: "/auth/login", method: "POST", data: { email, password, remember } },
      () => {
        const isAdmin = email.toLowerCase().startsWith("admin");
        const user = {
          id: isAdmin ? "usr_admin" : "usr_merchant",
          name: isAdmin ? "Alex Morgan" : "Mariana Costa",
          email,
          role: (isAdmin ? "admin" : "merchant") as "admin" | "merchant",
          company: isAdmin ? "XPayments Platform" : "Nimbus Labs",
          merchantId: isAdmin ? undefined : "mch_nimbus",
          twoFactorEnabled: true,
        } as const;
        const session: AuthSession = {
          accessToken: "xp_live_" + Math.random().toString(36).slice(2),
          refreshToken: "xp_refresh_" + Math.random().toString(36).slice(2),
          expiresAt: Date.now() + (remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 8),
          user: user as AuthSession["user"],
        };
        tokenStore.set(session.accessToken, session.refreshToken, session.user);
        return session;
      }
    );
  },
  async forgot(email: string) {
    return request<{ ok: boolean }>(
      { url: "/auth/forgot", method: "POST", data: { email } },
      () => ({ ok: true })
    );
  },
  async reset(token: string, password: string) {
    return request<{ ok: boolean }>(
      { url: "/auth/reset", method: "POST", data: { token, password } },
      () => ({ ok: true })
    );
  },
  async me() {
    return request(
      { url: "/auth/me", method: "GET" },
      () => tokenStore.user
    );
  },
  logout() {
    tokenStore.clear();
  },
};

// ---- Wallets ----
export const wallets = {
  list: () =>
    request<{ data: Wallet[] }>({ url: "/wallets", method: "GET" }, () => ({
      data: mockWallets,
    })),
  movements: (walletId?: string) =>
    request<{ data: WalletMovement[] }>(
      { url: "/wallets/movements", method: "GET", params: { walletId } },
      () => ({
        data: walletId
          ? mockMovements.filter((m) => m.walletId === walletId)
          : mockMovements,
      })
    ),
  swap: (from: CurrencyCode, to: CurrencyCode, amount: number) =>
    request<{ ok: boolean; rate: number }>(
      { url: "/wallets/swap", method: "POST", data: { from, to, amount } },
      () => ({ ok: true, rate: 0.92 + Math.random() * 0.3 })
    ),
  deposit: (currency: CurrencyCode, amount: number, method: string) =>
    request<{ ok: boolean; reference: string }>(
      { url: "/wallets/deposit", method: "POST", data: { currency, amount, method } },
      () => ({ ok: true, reference: "DEP" + Math.floor(Math.random() * 1e6) })
    ),
  payout: (currency: CurrencyCode, amount: number, beneficiary: string) =>
    request<{ ok: boolean; reference: string }>(
      { url: "/wallets/payout", method: "POST", data: { currency, amount, beneficiary } },
      () => ({ ok: true, reference: "PO" + Math.floor(Math.random() * 1e6) })
    ),
};

// ---- Analytics ----
export const analytics = {
  overview: () =>
    request<AnalyticsOverview>({ url: "/analytics/overview", method: "GET" }, () => mockAnalytics),
};

// ---- Risk ----
export const risk = {
  profile: () =>
    request<RiskProfile>({ url: "/risk/profile", method: "GET" }, () => mockRisk),
};

// ---- Transactions ----
export const transactions = {
  list: (filters: DataTableFilters = {}) =>
    request<Paginated<Transaction>>(
      { url: "/transactions", method: "GET", params: filters },
      () => {
        let data = mockTransactions.slice();
        if (filters.search) {
          const q = filters.search.toLowerCase();
          data = data.filter(
            (t) =>
              t.reference.toLowerCase().includes(q) ||
              t.customer.toLowerCase().includes(q) ||
              t.customerEmail.toLowerCase().includes(q)
          );
        }
        if (filters.status && filters.status !== "all")
          data = data.filter((t) => t.status === filters.status);
        if (filters.currency && filters.currency !== "all")
          data = data.filter((t) => t.currency === filters.currency);
        if (filters.method && filters.method !== "all")
          data = data.filter((t) => t.method === filters.method);
        if (filters.country && filters.country !== "all")
          data = data.filter((t) => t.country === filters.country);
        if (filters.gateway && filters.gateway !== "all")
          data = data.filter((t) => t.gateway === filters.gateway);
        const total = data.length;
        const page = filters.page ?? 1;
        const pageSize = filters.pageSize ?? 12;
        const start = (page - 1) * pageSize;
        return {
          data: data.slice(start, start + pageSize),
          total,
          page,
          pageSize,
        };
      }
    ),
  detail: (id: string) =>
    request<Transaction>(
      { url: `/transactions/${id}`, method: "GET" },
      () => mockTransactions.find((t) => t.id === id) ?? mockTransactions[0]
    ),
};

// ---- Customers ----
export const customers = {
  list: () =>
    request<{ data: Customer[] }>({ url: "/customers", method: "GET" }, () => ({
      data: mockCustomers,
    })),
};

// ---- Products / Stores / Links / Invoices / Subscriptions ----
export const products = {
  list: () =>
    request<{ data: Product[] }>({ url: "/products", method: "GET" }, () => ({
      data: mockProducts,
    })),
  create: (data: Partial<Product>) =>
    request<Product>({ url: "/products", method: "POST", data }, () => ({
      ...data,
      id: "prod_" + Math.random().toString(36).slice(2, 8),
      sales: 0,
      createdAt: new Date().toISOString(),
    } as Product)),
  remove: (id: string) =>
    request<{ ok: boolean }>({ url: `/products/${id}`, method: "DELETE" }, () => ({ ok: true })),
};

export const stores = {
  list: () =>
    request<{ data: Store[] }>({ url: "/stores", method: "GET" }, () => ({
      data: mockStores,
    })),
};

export const paymentLinks = {
  list: () =>
    request<{ data: PaymentLink[] }>({ url: "/payment-links", method: "GET" }, () => ({
      data: mockPaymentLinks,
    })),
};

export const invoices = {
  list: () =>
    request<{ data: Invoice[] }>({ url: "/invoices", method: "GET" }, () => ({
      data: mockInvoices,
    })),
};

export const subscriptions = {
  list: () =>
    request<{ data: Subscription[] }>({ url: "/subscriptions", method: "GET" }, () => ({
      data: mockSubscriptions,
    })),
};

// ---- Developers ----
export const apiKeys = {
  list: () =>
    request<{ data: ApiKey[] }>({ url: "/api-keys", method: "GET" }, () => ({
      data: mockApiKeys,
    })),
  create: (name: string, environment: "live" | "test", scopes: string[]) =>
    request<ApiKey>(
      { url: "/api-keys", method: "POST", data: { name, environment, scopes } },
      () => {
        const full =
          (environment === "live" ? "xp_live_" : "xp_test_") +
          Math.random().toString(36).slice(2, 26);
        return {
          id: "key_" + Math.random().toString(36).slice(2, 8),
          name,
          prefix: environment === "live" ? "xp_live_" : "xp_test_",
          lastFour: full.slice(-4),
          fullKey: full,
          scopes,
          createdAt: new Date().toISOString(),
          environment,
        } as ApiKey;
      }
    ),
  revoke: (id: string) =>
    request<{ ok: boolean }>({ url: `/api-keys/${id}`, method: "DELETE" }, () => ({ ok: true })),
};

export const webhooks = {
  list: () =>
    request<{ data: Webhook[] }>({ url: "/webhooks", method: "GET" }, () => ({
      data: mockWebhooks,
    })),
  create: (url: string, events: string[]) =>
    request<Webhook>({ url: "/webhooks", method: "POST", data: { url, events } }, () => ({
      id: "wh_" + Math.random().toString(36).slice(2, 8),
      url,
      events,
      status: "active",
      secret: "whsec_" + Math.random().toString(36).slice(2, 14),
      successRate: 100,
      createdAt: new Date().toISOString(),
    } as Webhook)),
  remove: (id: string) =>
    request<{ ok: boolean }>({ url: `/webhooks/${id}`, method: "DELETE" }, () => ({ ok: true })),
};

// ---- Payouts / Deposits ----
export const payouts = {
  list: () =>
    request<{ data: WalletMovement[] }>({ url: "/payouts", method: "GET" }, () => ({
      data: mockMovements.filter((m) => m.type === "payout" || m.type === "withdraw"),
    })),
};

export const deposits = {
  list: () =>
    request<{ data: WalletMovement[] }>({ url: "/deposits", method: "GET" }, () => ({
      data: mockMovements.filter((m) => m.type === "deposit"),
    })),
};

// ---- Treasury ----
export const treasury = {
  overview: () =>
    request<TreasuryOverview>({ url: "/treasury/overview", method: "GET" }, () => mockTreasury),
};

// ---- Admin ----
export const admin = {
  treasury: () =>
    request<TreasuryOverview>(
      { url: "/admin/treasury/overview", method: "GET" },
      () => ({ ...mockTreasury, totalLiquidity: 48200000 })
    ),
  merchants: () =>
    request<{ data: AdminMerchant[] }>({ url: "/admin/merchants", method: "GET" }, () => ({
      data: mockAdminMerchants,
    })),
  setMerchantStatus: (id: string, status: AdminMerchant["status"]) =>
    request<{ ok: boolean }>(
      { url: `/admin/merchants/${id}/status`, method: "POST", data: { status } },
      () => ({ ok: true })
    ),
  kycQueue: () =>
    request<{ data: KycReview[] }>({ url: "/admin/kyc", method: "GET" }, () => ({
      data: mockKycQueue,
    })),
  kycDecision: (id: string, decision: "approved" | "rejected") =>
    request<{ ok: boolean }>(
      { url: `/admin/kyc/${id}/${decision}`, method: "POST" },
      () => ({ ok: true })
    ),
  health: () =>
    request<SystemHealth>({ url: "/admin/health", method: "GET" }, () => mockSystemHealth),
  revenue: () =>
    request<{ total: number; series: { date: string; value: number }[] }>(
      { url: "/admin/revenue", method: "GET" },
      () => ({
        total: 18420000,
        series: mockAnalytics.revenueSeries.map((s) => ({ date: s.date, value: s.value * 4 })),
      })
    ),
};

export const xpApi = {
  auth,
  wallets,
  analytics,
  risk,
  transactions,
  customers,
  products,
  stores,
  paymentLinks,
  invoices,
  subscriptions,
  apiKeys,
  webhooks,
  payouts,
  deposits,
  treasury,
  admin,
};

export type XpApi = typeof xpApi;
