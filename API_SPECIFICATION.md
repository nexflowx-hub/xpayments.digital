# XPayments Frontend — API Specification & Gap Analysis

**Document version:** 1.0
**Source of truth:** `src/lib/api/xpApi.ts`, `src/lib/api/client.ts`, `src/types/index.ts`, `src/hooks/queries.ts`
**Backend contract reference:** `BACKEND.md` §5.3 (39 documented routes) and `src/lib/api/mock.ts` (live fallback data shapes)
**Base URL:** `process.env.NEXT_PUBLIC_API_URL` (default `https://api.xpayments.digital/api/v1`) — defined in `src/config/index.ts:163`

> All routes below are **relative** to the base URL (no leading slash). The frontend uses two HTTP wrappers:
> - `request<T>()` (`client.ts:204`) — raw `res.data`, used by auth endpoints that have their own envelope mapping.
> - `requestData<T>()` (`client.ts:218`) — unwraps the `{ success, data, meta?, error? }` envelope and returns `.data`. If `success === false` it throws an `ApiError`. If `envelope.data` is `null | undefined` it returns `null` — **callers must guard with `?? []` or optional chaining**.

---

## 1. API Endpoints (complete table)

The `xpApi` object (`xpApi.ts:260`) groups 17 domains: `auth, analytics, transactions, wallets, risk, customers, products, stores, paymentLinks, invoices, subscriptions, apiKeys, webhooks, treasury, checkout, kyc, admin`. Below is every endpoint, the hook that calls it, the components that consume the hook, and the backend status per `BACKEND.md` §5.3.

### 1.1 Auth (`xpApi.auth` — `xpApi.ts:72`)

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook / caller | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|---------------|---------------------|---------|
| 1 | POST | `auth/login` | None | `{ email: string, password: string, remember?: boolean }` (all required except `remember`) | `AuthEnvelope.data = { token: string, merchant: { id, name, email } }` — mapped by `mapEnvelopeToSession()` (`xpApi.ts:48`) into `AuthSession` | `auth.login()` (`xpApi.ts:74`) — called directly from `auth-screen.tsx` | `src/components/auth/auth-screen.tsx` | ✅ (`BACKEND.md` §5.3.1 #1) |
| 2 | POST | `auth/register` | None | `RegisterPayload = { name, email, password, companyName }` (all required) | `AuthEnvelope` → `AuthSession` | `auth.register()` (`xpApi.ts:83`) | `auth-screen.tsx` | ⚠️ Not in the 39-route contract (`BACKEND.md` §5.4); mocked only |
| 3 | POST | `auth/forgot` | None | `{ email: string }` | `{ success: boolean, message?: string }` (raw envelope) | `auth.forgot()` (`xpApi.ts:91`) | `auth-screen.tsx` (forgot view) | ✅ (`BACKEND.md` §5.3.1 #2) |
| 4 | POST | `auth/reset` | None | `{ token: string, password: string }` (both required) | `{ success: boolean, message?: string }` | `auth.reset()` (`xpApi.ts:93`) | `auth-screen.tsx` (reset view) | ✅ (`BACKEND.md` §5.3.1 #3) |
| 5 | GET | `auth/me` | Bearer JWT | — | `User` (bare) | `auth.me()` (`xpApi.ts:95`) | Used by `auth-provider` to rehydrate session | ✅ (`BACKEND.md` §5.3.1 #4) |
| 6 | POST | `auth/logout` | Bearer JWT | — | `{ success: boolean }` (swallowed — `.catch(() => {})` then `tokenStore.clear()`) | `auth.logout()` (`xpApi.ts:96`) | `dashboard/shell.tsx` user menu | ⚠️ Not yet implemented server-side (`BACKEND.md` §5.4); client-side clear only |
| 7 | POST | `auth/refresh` | None (refresh token in body) | `{ refreshToken: string }` | `{ accessToken, refreshToken, user }` — **asymmetric to login** (no `expiresAt`) | Invoked by `client.ts` 401 interceptor (`client.ts:153`), NOT by any hook | Implicit on every 401 from a protected route | ✅ (`BACKEND.md` §5.3.1 #5) |

### 1.2 Analytics (`xpApi.analytics` — `xpApi.ts:101`)

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|------|---------------------|---------|
| 8 | GET | `analytics/overview` | Bearer | — | `AnalyticsOverview` (see §2.4) | `useAnalyticsOverview()` (`queries.ts:8`) | `merchant/dashboard.tsx:24`, `merchant/analytics.tsx:35`, `admin/admin-analytics.tsx:60` (via `analytics?.currencies`), `admin/admin-analytics.tsx:165` (via `analytics?.paymentMethods`) | ✅ (`BACKEND.md` §5.3.3 #11) |

### 1.3 Transactions (`xpApi.transactions` — `xpApi.ts:107`)

| # | Method | Full path | Auth | Request body / query | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|----------------------|----------------------|------|---------------------|---------|
| 9 | GET | `transactions` | Bearer | query params mapped from `DataTableFilters` (`xpApi.ts:109`): `page, limit (alias pageSize), status, gateway, currency, reference (alias search)`. `status/gateway/currency === "all"` are dropped. | `Paginated<Transaction>` = `{ data: Transaction[], meta: { page, limit, total, pages } }` plus legacy fields `total?, page?, pageSize?` (`types/index.ts:384`) | `useTransactions(filters)` (`queries.ts:70`) | `merchant/payments.tsx:90`, `merchant/dashboard.tsx:27`, `merchant/customers.tsx:56` | ✅ (`BACKEND.md` §5.3.5 #13) |
| 10 | GET | `transactions/stats` | Bearer | — | `{ total: number, approved: number, failed: number, pending: number, successRate: number, volume: number }` (inline type at `xpApi.ts:124`) | `useTransactionStats()` (`queries.ts:73`) | **Not currently consumed by any component** — orphaned hook | ⚠️ Not in the 39-route contract; backend has no `/transactions/stats` route. The dashboard reuses `analytics/overview.transactions.successRate` instead. |
| 11 | GET | `transactions/:id` | Bearer | — | `Transaction` (bare, with `events[]` populated) | None — no hook wraps this | Not currently called (dashboard and payments use list rows directly; `payments.tsx` opens a Sheet with the row object already in memory) | ✅ (`BACKEND.md` §5.3.5 #14) |

### 1.4 Wallets (`xpApi.wallets` — `xpApi.ts:138`)

| # | Method | Full path | Auth | Request body / query | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|----------------------|----------------------|------|---------------------|---------|
| 12 | GET | `wallets` | Bearer | — | `WalletsResponse = { wallets: Wallet[], summary: WalletSummary }` (`types/index.ts:112`) | `useWallets()` (`queries.ts:23`) — selects `.wallets ?? []`; `useWalletsSummary()` (`queries.ts:30`) — selects `.summary ?? null` | `merchant/dashboard.tsx:26`, `merchant/wallets.tsx:57`, `merchant/treasury.tsx:47`, `merchant/fx.tsx:98`, `admin/admin-treasury.tsx` | ✅ (`BACKEND.md` §5.3.2 #6) |
| 13 | GET | `wallets/movements` | Bearer | `?walletId=<uuid>` (optional) | `WalletMovement[]` | `useWalletMovements(walletId?)` (`queries.ts:37`) — selects `d ?? []` | `merchant/wallets.tsx:58`, `merchant/treasury.tsx:48`, `merchant/fx.tsx:99` | ✅ (`BACKEND.md` §5.3.2 #7) |
| 14 | POST | `wallets/swap` | Bearer | `{ from: CurrencyCode, to: CurrencyCode, amount: number }` (all required) | `{ ok: boolean, rate: number }` | `useWalletSwap()` mutation (`queries.ts:44`) | `merchant/wallets.tsx` Swap dialog (`submitSwap`), `merchant/fx.tsx` calculator (`executeConvert`) | ✅ (`BACKEND.md` §5.3.2 #8) |
| 15 | POST | `wallets/deposit` | Bearer | `{ currency: CurrencyCode, amount: number, method: string }` (all required) | `{ ok: boolean, reference: string }` | `useWalletDeposit()` mutation (`queries.ts:52`) | `merchant/wallets.tsx` Deposit dialog | ✅ (`BACKEND.md` §5.3.2 #9) |
| 16 | POST | `wallets/payout` | Bearer | `{ currency: CurrencyCode, amount: number, beneficiary: string }` (all required) | `{ ok: boolean, reference: string }` | `useWalletPayout()` mutation (`queries.ts:60`) | `merchant/wallets.tsx` Payout dialog | ✅ (`BACKEND.md` §5.3.2 #10) |

### 1.5 Risk (`xpApi.risk` — `xpApi.ts:156`)

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|------|---------------------|---------|
| 17 | GET | `risk/profile` | Bearer | — | `RiskProfile` (see §2.5) | `useRiskProfile()` (`queries.ts:13`) | `merchant/dashboard.tsx:25`, `merchant/risk.tsx:34`, `admin/admin-risk.tsx` (indirectly via avg risk derivation) | ✅ (`BACKEND.md` §5.3.4 #12) |

### 1.6 Customers (`xpApi.customers` — `xpApi.ts:161`)

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|------|---------------------|---------|
| 18 | GET | `customers` | Bearer | — | `Customer[]` | `useCustomers()` (`queries.ts:78`) — selects `d ?? []` | `merchant/customers.tsx:55` | ✅ (`BACKEND.md` §5.3.6 #15) |

### 1.7 Commerce — Products / Stores / Payment Links / Invoices / Subscriptions

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|------|---------------------|---------|
| 19 | GET | `products` | Bearer | — | `Product[]` | `useProducts()` (`queries.ts:83`) | `merchant/products.tsx` | ✅ (`BACKEND.md` §5.3.7 #16) |
| 20 | POST | `products` | Bearer | `Partial<Product>` (name, price, currency required) | `Product` (bare) | `products.create(data)` (`xpApi.ts:168`) — called directly, no hook | `merchant/products.tsx` create dialog | ✅ (`BACKEND.md` §5.3.7 #17) |
| 21 | DELETE | `products/:id` | Bearer | — | `{ ok: boolean }` | `products.remove(id)` (`xpApi.ts:170`) — called directly | `merchant/products.tsx` row delete | ✅ (`BACKEND.md` §5.3.7 #18) |
| 22 | GET | `stores` | Bearer | — | `Store[]` | `useStores()` (`queries.ts:86`) | `merchant/stores.tsx` | ✅ (`BACKEND.md` §5.3.8 #19) |
| 23 | GET | `payment-links` | Bearer | — | `PaymentLink[]` | `usePaymentLinks()` (`queries.ts:89`) | `merchant/payment-links.tsx` | ✅ (`BACKEND.md` §5.3.9 #20) |
| 24 | GET | `invoices` | Bearer | — | `Invoice[]` | `useInvoices()` (`queries.ts:92`) | `merchant/invoices.tsx` | ✅ (`BACKEND.md` §5.3.10 #21) |
| 25 | GET | `subscriptions` | Bearer | — | `Subscription[]` | `useSubscriptions()` (`queries.ts:95`) | `merchant/subscriptions.tsx` | ✅ (`BACKEND.md` §5.3.11 #22) |

### 1.8 Developers — API Keys / Webhooks

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|------|---------------------|---------|
| 26 | GET | `api-keys` | Bearer | — | `ApiKey[]` (never includes `fullKey`) | `useApiKeys()` (`queries.ts:100`) | `merchant/api-keys.tsx` | ✅ (`BACKEND.md` §5.3.12 #23) |
| 27 | POST | `api-keys` | Bearer | `{ name: string, environment: "live" \| "test", scopes: string[] }` (all required) | `ApiKey` (with `fullKey` exactly once on create) | `apiKeys.create(...)` (`xpApi.ts:193`) | `merchant/api-keys.tsx` create dialog | ✅ (`BACKEND.md` §5.3.12 #24) |
| 28 | DELETE | `api-keys/:id` | Bearer | — | `{ ok: boolean }` | `apiKeys.revoke(id)` (`xpApi.ts:195`) | `merchant/api-keys.tsx` revoke button | ✅ (`BACKEND.md` §5.3.12 #25) |
| 29 | GET | `webhooks` | Bearer | — | `Webhook[]` | `useWebhooks()` (`queries.ts:103`) | `merchant/webhooks.tsx` | ✅ (`BACKEND.md` §5.3.13 #26) |
| 30 | POST | `webhooks` | Bearer | `{ url: string, events: string[] }` (both required) | `Webhook` (with `secret` shown once) | `webhooks.create(...)` (`xpApi.ts:201`) | `merchant/webhooks.tsx` create dialog | ✅ (`BACKEND.md` §5.3.13 #27) |
| 31 | DELETE | `webhooks/:id` | Bearer | — | `{ ok: boolean }` | `webhooks.remove(id)` (`xpApi.ts:203`) | `merchant/webhooks.tsx` remove | ✅ (`BACKEND.md` §5.3.13 #28) |

### 1.9 Treasury (`xpApi.treasury` — `xpApi.ts:208`)

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|------|---------------------|---------|
| 32 | GET | `treasury/overview` | Bearer | — | `TreasuryOverview` (see §2.10) | `useTreasury()` (`queries.ts:18`) | `merchant/treasury.tsx:46` | ✅ (`BACKEND.md` §5.3.16 #31) |

### 1.10 Checkout (`xpApi.checkout` — `xpApi.ts:213`)

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|------|---------------------|---------|
| 33 | POST | `checkout/session` | API Key (not JWT) | `{ amount: number, currency: string, reference: string, customerEmail: string, metadata?: Record<string,string> }` (first 4 required) | `{ sessionId: string, checkoutUrl: string }` | None — called directly from the public checkout form | Embedded checkout widget (not in admin/merchant shell) | ⚠️ Not in the 39-route contract; designed per API Contract v3.1 but no backend route tabled in `BACKEND.md` |
| 34 | GET | `checkout/session/:id` | Public (no auth) | — | `{ sessionId, storeName, amount, currency, reference }` | None | Checkout iframe / hosted page | ⚠️ Same as above |

### 1.11 KYC (`xpApi.kyc` — `xpApi.ts:238`)

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|------|---------------------|---------|
| 35 | GET | `kyc/status` | Bearer | — | `{ status: string, submittedAt?: string, documents?: unknown[], riskFlags?: string[] }` (inline type at `xpApi.ts:240`) | None — no hook wraps this | **Not consumed by any component** (merchant-side KYC submission is noted in `BACKEND.md` §5.3.17 as not implemented) | ⚠️ Not in the 39-route contract; flagged for future merchant self-onboarding |

### 1.12 Admin (`xpApi.admin` — `xpApi.ts:247`)

| # | Method | Full path | Auth | Request body | Response `data` shape | Hook | Component consumers | Backend |
|---|--------|-----------|------|--------------|----------------------|------|---------------------|---------|
| 36 | GET | `admin/treasury/overview` | Bearer (admin) | — | `TreasuryOverview` (platform-wide) | `useAdminTreasury()` (`queries.ts:114`) | `admin/admin-dashboard.tsx:32`, `admin/admin-treasury.tsx` | ✅ (`BACKEND.md` §5.3.18 #33) |
| 37 | GET | `admin/merchants` | Bearer (admin) | — | `AdminMerchant[]` | `useAdminMerchants()` (`queries.ts:108`) — selects `d ?? []` | `admin/admin-dashboard.tsx:30`, `admin/admin-merchants.tsx:40`, `admin/admin-revenue.tsx:20`, `admin/admin-analytics.tsx`, `admin/admin-risk.tsx` | ✅ (`BACKEND.md` §5.3.18 #34) |
| 38 | POST | `admin/merchants/:id/status` | Bearer (admin) | `{ status: AdminMerchant["status"] }` — `"active" \| "frozen" \| "suspended" \| "pending"` | `{ ok: boolean }` | `useMutation` inline at `admin-merchants.tsx:47` (calls `xpApi.admin.setMerchantStatus`) | `admin/admin-merchants.tsx` status dropdown / suspend dialog | ✅ (`BACKEND.md` §5.3.18 #35) |
| 39 | GET | `admin/kyc` | Bearer (admin) | — | `KycReview[]` | `useAdminKyc()` (`queries.ts:111`) — selects `d ?? []` | `admin/admin-dashboard.tsx:34` (count badge), `admin/admin-kyc.tsx`, `admin/admin-compliance.tsx` | ✅ (`BACKEND.md` §5.3.17 #32) |
| 40 | POST | `admin/kyc/:id/:decision` | Bearer (admin) | URL-encoded `decision ∈ {"approved","rejected"}` | `{ ok: boolean }` | `xpApi.admin.kycDecision(id, decision)` (`xpApi.ts:253`) — called inline from `admin-kyc.tsx` | `admin/admin-kyc.tsx` approve/reject buttons | ✅ (`BACKEND.md` §5.3.18 #36–37) |
| 41 | GET | `admin/health` | Bearer (admin) | — | `SystemHealth` (see §2.13) | `useAdminHealth()` (`queries.ts:117`) | `admin/admin-dashboard.tsx:33`, `admin/admin-health.tsx:104` | ✅ (`BACKEND.md` §5.3.18 #38) |
| 42 | GET | `admin/revenue` | Bearer (admin) | — | `{ total: number, series: { date: string, value: number }[] }` (inline type at `xpApi.ts:257`) — **bare object, no `data` wrapper** | `useAdminRevenue()` (`queries.ts:120`) | `admin/admin-dashboard.tsx:31`, `admin/admin-revenue.tsx:19` | ✅ (`BACKEND.md` §5.3.18 #39) |

### 1.13 Endpoints referenced by the codebase but with NO backend route

These exist in `xpApi.ts` or are silently relied on by hooks/components but are **not** in the canonical 39-route contract:

| Endpoint | Caller | Reason | Priority |
|----------|--------|--------|----------|
| `POST auth/register` | `auth.register()` (`xpApi.ts:83`) | Not in `BACKEND.md` §5.3.1; flagged in §5.4 as "if self-serve signup is desired" | P2 |
| `POST auth/logout` | `auth.logout()` (`xpApi.ts:96`) | Client-side `tokenStore.clear()` is the only effect; no server-side revocation. Flagged in `BACKEND.md` §5.4 | P3 |
| `GET transactions/stats` | `useTransactionStats()` (`queries.ts:73`) | Hook exists but no component consumes it; no backend route. Dashboard reads stats from `analytics/overview.transactions` instead | P3 (orphan — remove the hook or wire it) |
| `POST checkout/session` & `GET checkout/session/:id` | `xpApi.checkout` (`xpApi.ts:213`) | Checkout API key flow defined in API Contract v3.1 but no controller in `BACKEND.md` | P2 |
| `GET kyc/status` | `xpApi.kyc.status()` (`xpApi.ts:238`) | Merchant-side KYC view defined but no controller; `BACKEND.md` §5.3.17 explicitly notes merchant self-onboarding is not implemented | P3 |
| `GET admin/gateways` | not called (admin-gateways.tsx uses local `GATEWAYS` const) | `BACKEND.md` §5.4 recommends adding it | P3 |
| `GET admin/feature-flags` + `PATCH /admin/feature-flags/:key` | not called (admin-flags.tsx uses local state) | `BACKEND.md` §5.4 recommends adding | P3 |
| `GET admin/audit-logs` | not called (admin-logs.tsx generates mock entries) | `BACKEND.md` §5.4 recommends adding | P3 |
| `GET admin/support/tickets` | not called (admin-support.tsx uses local `TICKETS`) | `BACKEND.md` §5.4 recommends adding | P3 |
| `GET /support/tickets` + `POST /support/tickets` | not called (merchant `support.tsx` uses local `RECENT_TICKETS`) | `BACKEND.md` §5.4 recommends adding | P3 |
| `GET admin/workers`, `GET admin/queues`, `GET admin/analytics/overview` | not called (admin-workers/queues/analytics.tsx use local mock arrays) | Implied by nav items; no backend route | P3 |

---

## 2. Type Dictionary

Every interface/type that appears in an API response. Fields marked **[Decimal]** are Prisma `Decimal`-equivalent financial values that need precision handling (server should serialize as `string` or pre-rounded `number`).

### 2.1 `User` (`types/index.ts:15`)

```typescript
interface User {
  id: string; name: string; email: string; role: UserRole;
  avatarUrl?: string; company?: string; merchantId?: string;
  tier?: string; twoFactorEnabled?: boolean;
}
```

| Field | Type | Req/Opt | Array | Num | Str | Decimal | Description |
|-------|------|---------|-------|-----|-----|---------|-------------|
| id | string | required | no | no | yes | no | User UUID |
| name | string | required | no | no | yes | no | Display name |
| email | string | required | no | no | yes | no | Login email |
| role | `"merchant" \| "admin" \| "guest"` | required | no | no | yes | no | Authorization role |
| avatarUrl | string | optional | no | no | yes | no | Avatar URL (not surfaced in DB schema) |
| company | string | optional | no | no | yes | no | Merchant company name |
| merchantId | string | optional | no | no | yes | no | Owning merchant UUID |
| tier | string | optional | no | no | yes | no | Subscription tier |
| twoFactorEnabled | boolean | optional | no | no | no | no | 2FA enforced |

### 2.2 `AuthSession` (`types/index.ts:27`)

```typescript
interface AuthSession {
  accessToken: string; refreshToken: string; expiresAt: number; user: User;
}
```

| Field | Type | Req/Opt | Description |
|-------|------|---------|-------------|
| accessToken | string | required | JWT (8h TTL per `xpApi.ts:67`) |
| refreshToken | string | required | Opaque refresh token; v3.1 reuses `accessToken` for now (`xpApi.ts:67` comment) |
| expiresAt | number | required | Epoch ms; set to `Date.now() + 8h` by `mapEnvelopeToSession` |
| user | User | required | Embedded user object |

### 2.3 `Wallet` (`types/index.ts:91`)

```typescript
interface Wallet {
  currency: CurrencyCode; balance: number; available: number; reserved: number;
  type: "fiat" | "crypto" | "card";
  id?: string; label?: string; cardLast4?: string; changePct?: number; color?: string;
}
```

| Field | Type | Req/Opt | Array | Num | Str | Decimal | Description |
|-------|------|---------|-------|-----|-----|---------|-------------|
| currency | `CurrencyCode` | required | no | no | yes | no | `"EUR" \| "USD" \| "BRL" \| "USDT" \| "GBP" \| "BTC"` (`types/index.ts:89`) |
| balance | number | required | no | yes | no | **YES** | Wallet balance — financial value, needs precision |
| available | number | required | no | yes | no | **YES** | Available (balance − reserved) |
| reserved | number | required | no | yes | no | **YES** | Held for pending settlements/reserve |
| type | `"fiat" \| "crypto" \| "card"` | required | no | no | yes | no | Wallet class |
| id | string | optional | no | no | yes | no | Wallet UUID — **used as React key** in `wallets.tsx:203`, `treasury.tsx:288`, `fx.tsx:346` |
| label | string | optional | no | no | yes | no | Display label (`"Euro Operating"`) |
| cardLast4 | string | optional | no | no | yes | no | Last 4 digits for card wallets |
| changePct | number | optional | no | yes | no | no | 24h change % — **consumed without guard** in `wallets.tsx:70` (`w.changePct * ...`) and `treasury.tsx:306` (`w.changePct >= 0`); if undefined, `undefined * x = NaN` |
| color | string | optional | no | no | yes | no | Hex color for charts/sparklines — consumed unguarded in `wallets.tsx:208` (`${w.color}22`) |

### 2.4 `AnalyticsOverview` (`types/index.ts:179`)

```typescript
interface AnalyticsOverview {
  wallet: { totalBalance: number; availableBalance: number; currencies: number };
  transactions: { today: number; month: number; total: number;
    successRate: number; volumeToday: number; volumeMonth: number };
  recentTransactions: Transaction[];
  // Legacy / optional v2 fields
  revenue?: number; revenueChange?: number; volume?: number; volumeChange?: number;
  conversion?: number; conversionChange?: number; approvalRate?: number;
  approvalChange?: number; riskScore?: number; riskChange?: number;
  revenueSeries?: { date: string; value: number }[];
  volumeSeries?: { date: string; value: number }[];
  paymentMethods?: { method: PaymentMethod; share: number; volume: number }[];
  currencies_dist?: { currency: CurrencyCode; share: number; volume: number }[];
  topCustomers?: { name: string; ltv: number; orders: number }[];
  realtime?: { id: string; label: string; amount: number; currency: CurrencyCode; ago: string }[];
}
```

| Field | Type | Req/Opt | Array | Num | Str | Decimal | Description |
|-------|------|---------|-------|-----|-----|---------|-------------|
| wallet.totalBalance | number | required | no | yes | no | **YES** | Sum of all wallet balances |
| wallet.availableBalance | number | required | no | yes | no | **YES** | Sum of available balances |
| wallet.currencies | number | required | no | yes | no | no | Distinct currency count |
| transactions.today | number | required | no | yes | no | no | Count of txns today |
| transactions.month | number | required | no | yes | no | no | Count this month |
| transactions.total | number | required | no | yes | no | no | All-time count |
| transactions.successRate | number | required | no | yes | no | no | 0–100 success % |
| transactions.volumeToday | number | required | no | yes | no | **YES** | EUR-equivalent volume today |
| transactions.volumeMonth | number | required | no | yes | no | **YES** | EUR-equivalent volume this month |
| recentTransactions | Transaction[] | required | yes | — | — | — | Last ~6 transactions |
| revenue | number | optional | no | yes | no | **YES** | 30-day net revenue (legacy) |
| revenueChange | number | optional | no | yes | no | no | Period-over-period delta % |
| volume | number | optional | no | yes | no | **YES** | 30-day gross volume |
| volumeChange | number | optional | no | yes | no | no | Delta % |
| conversion | number | optional | no | yes | no | no | Visit→capture % (defaulted to `4.7` in `analytics.tsx:40`) |
| conversionChange | number | optional | no | yes | no | no | Delta % |
| approvalRate | number | optional | no | yes | no | no | Authorization approval % (defaulted to `96.8` in `analytics.tsx:41`) |
| approvalChange | number | optional | no | yes | no | no | Delta % |
| riskScore | number | optional | no | yes | no | no | Composite risk 0–100 |
| riskChange | number | optional | no | yes | no | no | Delta |
| revenueSeries | `{date,value}[]` | optional | yes | yes | yes | **YES** | Daily revenue series |
| volumeSeries | `{date,value}[]` | optional | yes | yes | yes | **YES** | Daily volume series |
| paymentMethods | `{method,share,volume}[]` | optional | yes | yes | yes | **YES** | Per-method breakdown |
| currencies_dist | `{currency,share,volume}[]` | optional | yes | yes | yes | **YES** | Per-currency breakdown. **MISMATCH:** `analytics.tsx:144` reads `a?.currencies` (no `_dist`) — the type definition is wrong vs the consumer; the backend returns `currencies` per `BACKEND.md` §5.3.3. |
| topCustomers | `{name,ltv,orders}[]` | optional | yes | yes | yes | **YES** | Top 5 by LTV |
| realtime | `{...}[]` | optional | yes | yes | yes | **YES** | Last-5-min activity feed (not currently consumed by any component) |

### 2.5 `RiskProfile` (`types/index.ts:214`)

```typescript
interface RiskProfile {
  score: number; reservePct: number; chargebackRate: number;
  trustStatus: "trusted" | "standard" | "elevated" | "high_risk";
  alerts: RiskAlert[]; recommendations: string[];
  history: { date: string; score: number; chargebacks: number }[];
}
```

| Field | Type | Req/Opt | Array | Num | Str | Decimal | Description |
|-------|------|---------|-------|-----|-----|---------|-------------|
| score | number | required | no | yes | no | no | 0–100, lower is better |
| reservePct | number | required | no | yes | no | no | Rolling reserve % |
| chargebackRate | number | required | no | yes | no | no | Card scheme rate (threshold 1%) |
| trustStatus | enum | required | no | no | yes | no | Trust tier |
| alerts | `RiskAlert[]` | required | yes | — | — | — | Active alerts |
| recommendations | `string[]` | required | yes | no | yes | no | Recommendations |
| history | `{date,score,chargebacks}[]` | required | yes | yes | yes | no | 30-day history for charts |

### 2.6 `RiskAlert` (`types/index.ts:224`)

| Field | Type | Req/Opt | Description |
|-------|------|---------|-------------|
| id | string | required | Alert UUID |
| severity | `"low" \| "medium" \| "high" \| "critical"` | required | Mapped via `severityConfig` in `risk.tsx:26` |
| title | string | required | One-line title |
| description | string | required | Detail copy |
| createdAt | string | required | ISO timestamp — fed to `timeAgo()` in `risk.tsx:204` |

### 2.7 `Transaction` (`types/index.ts:151`)

```typescript
interface Transaction {
  id: string; reference: string; customer: string; customerEmail: string;
  amount: number; currency: CurrencyCode; amountEur: number;
  status: TxStatus; method: PaymentMethod; country: string; gateway: string;
  createdAt: string; riskScore: number; fee: number;
  metadata?: Record<string, string>; events?: TxEvent[];
}
```

| Field | Type | Req/Opt | Array | Num | Str | Decimal | Description |
|-------|------|---------|-------|-----|-----|---------|-------------|
| id | string | required | no | no | yes | no | Tx UUID |
| reference | string | required | no | no | yes | no | Merchant-facing reference (used as React key in tables) |
| customer | string | required | no | no | yes | no | Customer name |
| customerEmail | string | required | no | no | yes | no | Email |
| amount | number | required | no | yes | no | **YES** | Tx amount in `currency` |
| currency | `CurrencyCode` | required | no | no | yes | no | Tx currency |
| amountEur | number | required | no | yes | no | **YES** | EUR equivalent |
| status | `TxStatus` | required | no | no | yes | no | `"succeeded" \| "pending" \| "failed" \| "refunded" \| "disputed" \| "authorized"` |
| method | `PaymentMethod` | required | no | no | yes | no | One of `visa\|mastercard\|amex\|pix\|mbway\|apple_pay\|google_pay\|crypto\|sepa\|wise` |
| country | string | required | no | no | yes | no | Customer country |
| gateway | string | required | no | no | yes | no | Gateway name (`xpayments`, `stripe-rail`, `adyen`, `checkout`, `wise`) |
| createdAt | string | required | no | no | yes | no | ISO timestamp |
| riskScore | number | required | no | yes | no | no | 0–100 |
| fee | number | required | no | yes | no | **YES** | Processing fee |
| metadata | `Record<string,string>` | optional | no | no | yes | no | Free-form merchant metadata |
| events | `TxEvent[]` | optional | yes | — | — | — | Timeline events |

### 2.8 `TxEvent` (`types/index.ts:170`)

| Field | Type | Req/Opt | Description |
|-------|------|---------|-------------|
| id | string | required | Event UUID |
| type | string | required | Event type code |
| label | string | required | Display label |
| createdAt | string | required | ISO timestamp |
| detail | string | optional | Optional detail copy |

### 2.9 `WalletMovement` (`types/index.ts:117`)

```typescript
interface WalletMovement {
  id: string; currency: CurrencyCode; amount: number;
  direction: "in" | "out"; status: string; createdAt: string;
  walletId?: string; type?: "deposit" | "withdraw" | "swap" | "payment" | "fee" | "payout";
  reference?: string;
}
```

| Field | Type | Req/Opt | Array | Num | Str | Decimal | Notes |
|-------|------|---------|-------|-----|-----|---------|-------|
| id | string | required | no | no | yes | no | UUID |
| currency | `CurrencyCode` | required | no | no | yes | no | |
| amount | number | required | no | yes | no | **YES** | Movement amount |
| direction | `"in" \| "out"` | required | no | no | yes | no | |
| status | string | required | no | no | yes | no | Free-form (`pending`, `completed`, `failed`); fed to `<StatusBadge>` which has fallback |
| createdAt | string | required | no | no | yes | no | |
| walletId | string | optional | no | no | yes | no | Required to join with wallet in `wallets.tsx:290` (`walletById.get(m.walletId)`) — if missing, lookup returns undefined and falls back to literal `m.walletId` |
| type | enum | optional | no | no | yes | no | **REQUIRED by `treasury.tsx:245`** (`movementIcon[m.type]`) and `wallets.tsx:305` (`movementTypeLabel[m.type]`) — if undefined, `movementIcon[undefined]` is `undefined` and React throws |
| reference | string | optional | no | no | yes | no | Display reference |

### 2.10 `TreasuryOverview` (`types/index.ts:331`)

```typescript
interface TreasuryOverview {
  totalLiquidity: number; reserve: number; pendingPayouts: number;
  netFlow: number; liquidityChange: number;
  cashFlowSeries: { date: string; inflow: number; outflow: number }[];
  settlementSeries: { date: string; value: number }[];
  balances: { currency: CurrencyCode; amount: number; changePct: number }[];
}
```

| Field | Type | Req/Opt | Array | Num | Str | Decimal | Notes |
|-------|------|---------|-------|-----|-----|---------|-------|
| totalLiquidity | number | required | no | yes | no | **YES** | Sum of all wallet balances |
| reserve | number | required | no | yes | no | **YES** | Held reserve |
| pendingPayouts | number | required | no | yes | no | **YES** | Sum of pending payout amounts |
| netFlow | number | required | no | yes | no | **YES** | 30d net flow |
| liquidityChange | number | required | no | yes | no | no | Delta % — reused for `netFlow` `change` in `treasury.tsx:105` (smell — same delta on two cards) |
| cashFlowSeries | `{date,inflow,outflow}[]` | required | yes | yes | yes | **YES** | 30-day daily series; both keys required by stacked `<BarTrend>` |
| settlementSeries | `{date,value}[]` | required | yes | yes | yes | **YES** | 14-day daily settlement |
| balances | `{currency,amount,changePct}[]` | required | yes | yes | yes | **YES** | Per-currency breakdown |

### 2.11 `Customer` (`types/index.ts:233`)

| Field | Type | Req/Opt | Array | Num | Str | Decimal | Notes |
|-------|------|---------|-------|-----|-----|---------|-------|
| id | string | required | no | no | yes | no | UUID |
| name | string | required | no | no | yes | no | |
| email | string | required | no | no | yes | no | |
| country | string | required | no | no | yes | no | |
| ltv | number | required | no | yes | no | **YES** | Lifetime value (EUR) |
| avgOrder | number | required | no | yes | no | **YES** | Average order value |
| orders | number | required | no | yes | no | no | Order count |
| segment | `"vip" \| "regular" \| "new" \| "at_risk"` | required | no | no | yes | no | |
| firstSeen | string | required | no | no | yes | no | ISO timestamp — consumed via `new Date(...)` in `customers.tsx:294` (no guard) |
| lastSeen | string | required | no | no | yes | no | Fed to `timeAgo()` |
| status | `"active" \| "inactive" \| "blocked"` | required | no | no | yes | no | |

### 2.12 `AdminMerchant` (`types/index.ts:343`)

| Field | Type | Req/Opt | Array | Num | Str | Decimal | Notes |
|-------|------|---------|-------|-----|-----|---------|-------|
| id | string | required | no | no | yes | no | Merchant UUID |
| name | string | required | no | no | yes | no | |
| email | string | required | no | no | yes | no | |
| country | string | required | no | no | yes | no | |
| status | `"active" \| "frozen" \| "suspended" \| "pending"` | required | no | no | yes | no | |
| riskScore | number | required | no | yes | no | no | 0–100 |
| revenue | number | required | no | yes | no | **YES** | Total platform revenue from merchant |
| volume | number | required | no | yes | no | **YES** | Total tx volume |
| createdAt | string | required | no | no | yes | no | ISO timestamp |
| kycStatus | `"approved" \| "pending" \| "rejected" \| "not_submitted"` | required | no | no | yes | no | |

### 2.13 `SystemHealth` (`types/index.ts:375`)

```typescript
interface SystemHealth {
  status: "operational" | "degraded" | "outage"; uptime: number;
  services: { name: string; status: "operational" | "degraded" | "outage"; latencyMs: number }[];
  queues: { name: string; pending: number; processing: number; throughput: number }[];
  workers: { name: string; active: number; idle: number; region: string }[];
}
```

| Field | Type | Req/Opt | Array | Notes |
|-------|------|---------|-------|-------|
| status | enum | required | no | Overall platform status |
| uptime | number | required | no | 90-day SLA %. Rendered with `.toFixed(3)` in `admin-health.tsx:155` and `admin-dashboard.tsx:164` — throws if undefined |
| services | array | required | yes | Each `{name, status, latencyMs}` — `latencyMs` consumed via `s.latencyMs > 200` ternary in `admin-dashboard.tsx:234` (no guard) |
| queues | array | required | yes | Each `{name, pending, processing, throughput}` — consumed in `admin-dashboard.tsx:43` (`q.throughput`, `q.pending`, `q.name.split(".")[0]`) |
| workers | array | required | yes | Defined but **not consumed by any component** |

### 2.14 `KycReview` & `KycDocument` (`types/index.ts:356`, `:367`)

```typescript
interface KycReview {
  id: string; merchantName: string; merchantId: string; country: string;
  submittedAt: string; documents: KycDocument[];
  status: "pending" | "approved" | "rejected"; riskFlags: string[];
}
interface KycDocument {
  id: string; name: string; type: "passport" | "id_card" | "selfie" | "address_proof" | "article";
  pages: number; sizeKb: number;
}
```

| Field | Type | Req/Opt | Notes |
|-------|------|---------|-------|
| `KycReview.id` | string | required | Review UUID |
| `KycReview.merchantName` | string | required | |
| `KycReview.merchantId` | string | required | |
| `KycReview.country` | string | required | |
| `KycReview.submittedAt` | string | required | ISO |
| `KycReview.documents` | `KycDocument[]` | required | Mapped in `admin-kyc.tsx:322` |
| `KycReview.status` | enum | required | |
| `KycReview.riskFlags` | `string[]` | required | Mapped in `admin-kyc.tsx:300` — unguarded (see §6) |
| `KycDocument.id` | string | required | |
| `KycDocument.name` | string | required | |
| `KycDocument.type` | enum | required | |
| `KycDocument.pages` | number | required | Used in `admin-kyc.tsx:337,386` as `${d.pages}p` |
| `KycDocument.sizeKb` | number | required | Converted via `(d.sizeKb / 1024).toFixed(2)` to MB |

### 2.15 Other commerce types (used by admin pages and merchant pages not in the primary 9)

`Product`, `Store`, `PaymentLink`, `Invoice`, `Subscription`, `ApiKey`, `Webhook` — full definitions in `types/index.ts:248-328`. All have the same shape convention: `id, name/label, currency, amount/price, status, createdAt`. `ApiKey.fullKey?` and `Webhook.secret` are server-only fields.

### 2.16 `Paginated<T>` (`types/index.ts:384`)

```typescript
interface Paginated<T> {
  data: T[]; meta: { page: number; limit: number; total: number; pages: number };
  total?: number; page?: number; pageSize?: number; // legacy
}
```

The v3.1 path uses `meta.total` / `meta.page`; legacy callers may read the top-level `total` / `page`. `payments.tsx:94-96` reads **both** for resilience:
```ts
const total = data?.meta?.total ?? data?.total ?? 0;
const page  = filters.page ?? data?.meta?.page ?? 1;
const pageSize = filters.limit ?? filters.pageSize ?? data?.meta?.limit ?? PAGE_SIZE;
```

### 2.17 `ApiResponse<T>` envelope (`types/index.ts:76`)

```typescript
interface ApiResponse<T> {
  success: boolean; data: T; meta?: Record<string, unknown>;
  error?: { code: string; message: string }; message?: string; // legacy
}
```

---

## 3. Field Usage Analysis

For each high-traffic API response field, where it is consumed and how it is formatted.

### 3.1 `AnalyticsOverview.wallet.*`

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `wallet.totalBalance` | `dashboard.tsx:44` → `StatCard` at `:72` | `formatCurrency(n, "EUR", { compact: true })` | `?? 0` at line 44 |
| `wallet.availableBalance` | computed into `totalBalance` flow only | not directly rendered | n/a |
| `wallet.currencies` | not directly rendered in dashboard (the dashboard reads `wallets.length` separately) | — | — |

### 3.2 `AnalyticsOverview.transactions.*`

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `transactions.today` | `dashboard.tsx:46,132` | direct render `{txToday}` | `?? 0` |
| `transactions.month` | `dashboard.tsx:47,136` | direct render | `?? 0` |
| `transactions.total` | `dashboard.tsx:48,140` | direct render | `?? 0` |
| `transactions.successRate` | `dashboard.tsx:49,75,144` | `formatPercent(n)` | `?? 0` |
| `transactions.volumeToday` | `dashboard.tsx:50,73` | `formatCurrency(n, "EUR", { compact: true })` | `?? 0` |
| `transactions.volumeMonth` | `dashboard.tsx:51,74` | `formatCurrency(n, "EUR", { compact: true })` | `?? 0` |

### 3.3 `AnalyticsOverview` legacy fields (consumed by `analytics.tsx`)

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `revenue` | `analytics.tsx:104` | `formatCurrency(n, "EUR", { compact: true })` | none — `a.revenue` direct; if undefined, `StatCard` receives `undefined` and `AnimatedCounter` animates from 0 to NaN |
| `revenueChange` | `analytics.tsx:104,122` | direct render `{a?.revenueChange ?? 0}%` | `?? 0` only at line 122 |
| `volume` | `analytics.tsx:105` | `formatCurrency(n, "EUR", { compact: true })` | none |
| `volumeChange` | `analytics.tsx:161` | direct render | `?? 0` |
| `conversion` | `analytics.tsx:40,106,206` | `formatPercent(n)` | `?? 4.7` (hardcoded fallback) |
| `approvalRate` | `analytics.tsx:41,107` | `formatPercent(n)` | `?? 96.8` (hardcoded fallback) |
| `riskScore` | `analytics.tsx:108` | `Math.round(n).toString()` | none |
| `revenueSeries` | `analytics.tsx:127` | `AreaTrend` with `formatCurrency` formatter | `?? []` |
| `volumeSeries` | `analytics.tsx:166` | `AreaTrend` with `formatCurrency` formatter | `?? []` |
| `paymentMethods` | `analytics.tsx:186` | `BarTrend` with `formatCurrency` formatter; `.method` mapped via `methodLabel` lookup | `?? []` |
| **`currencies`** (NOT in type — see §2.4 mismatch) | `analytics.tsx:144` | `DonutChart` with `formatCurrency` formatter | `?? []` |
| `topCustomers` | `analytics.tsx:69,263` | `formatCurrency(c.ltv, "EUR", { compact: true })` | `?? []` at line 69 |
| `realtime` | not consumed | — | — |

### 3.4 `Wallet` fields

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `balance` | `dashboard.tsx:111`, `wallets.tsx:239,336`, `treasury.tsx:310,313`, `fx.tsx:352` | `formatCurrency(w.balance, w.currency, { compact })` | guarded upstream by `w.length === 0 ? ... : w.slice(0,4).map(...)` |
| `available` | `dashboard.tsx:114`, `wallets.tsx:244,247`, `treasury.tsx:313` | `formatCurrency` | same |
| `reserved` | `dashboard.tsx:115`, `wallets.tsx:247`, `treasury.tsx:313` | `formatCurrency` | same |
| `changePct` | `wallets.tsx:70,234,201`, `treasury.tsx:306` | direct `%` render or arithmetic | **NO GUARD** — `wallets.tsx:70` does `w.changePct * (w.balance * EUR_RATES[w.currency])`; if `changePct` is undefined, the multiplication yields `NaN` and `weightedChange` becomes `NaN` |
| `color` | `wallets.tsx:208,213`, `fx.tsx:348` | inline style `${w.color}22` | **NO GUARD** — produces `"undefined22"` if missing |
| `label` | `wallets.tsx:218`, `treasury.tsx:295`, `fx.tsx:349` | direct render | none — would render `undefined` if missing |
| `cardLast4` | `wallets.tsx:220` | direct render `Card •${w.cardLast4}` | none |

### 3.5 `RiskProfile` fields

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `score` | `dashboard.tsx:76,205`, `risk.tsx:72,101,220` | `Math.round(n).toString()` or `RiskGauge` | `?? 0` (dashboard), `risk ? ... : ...` ternary (risk.tsx) |
| `reservePct` | `dashboard.tsx:210`, `risk.tsx:73,136` | `formatPercent(n)` | `r ? ... : "—"` ternary |
| `chargebackRate` | `dashboard.tsx:215`, `risk.tsx:74,136` | `formatPercent(n, 2)` | `r ? ... : "—"` |
| `trustStatus` | `dashboard.tsx:206`, `risk.tsx:36` | `.replace("_", " ")` | `?.replace(...) ?? "—"` (dashboard); `risk ? trustConfig[risk.trustStatus] : trustConfig.standard` (risk) |
| `alerts` | `dashboard.tsx:220`, `risk.tsx:171,184` | `(r?.alerts ?? []).length` | **safe in dashboard**; but **`risk.tsx:171`** does `risk?.alerts.length ?? 0` — if `risk` exists but `alerts` is undefined, `risk.alerts.length` throws `TypeError: Cannot read properties of undefined (reading 'length')`. The `?? 0` only catches `risk === undefined`. |
| `recommendations` | `risk.tsx:146` | `(risk?.recommendations ?? []).map(...)` | safe |
| `history` | `risk.tsx:225,248` | `AreaTrend` / `LineTrend` with `data={risk.history}` | **NO GUARD** — if `risk` is defined (the `!risk ? Skeleton : ...` branch handles null), `risk.history` is passed directly. If the backend returns a `RiskProfile` with `history: undefined`, `LineTrend`/`AreaTrend` (recharts) silently render empty. |

### 3.6 `Transaction` fields

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `reference` | `dashboard.tsx:175`, `payments.tsx:237,301`, `customers.tsx:325` | direct render | none |
| `customer` | `dashboard.tsx:177`, `payments.tsx:239`, `customers.tsx:96` | direct render | none |
| `country` | `dashboard.tsx:178`, `payments.tsx:240` | direct render | none |
| `amount` | `dashboard.tsx:182`, `payments.tsx:244,315,325`, `customers.tsx:333` | `formatCurrency(t.amount, t.currency)` | none |
| `currency` | `payments.tsx:246` | direct render | none |
| `status` | `dashboard.tsx:184`, `payments.tsx:247,302`, `customers.tsx:326` | `<StatusBadge status={t.status} />` | badge has fallback config |
| `method` | `dashboard.tsx:180`, `payments.tsx:242,359`, `customers.tsx:329` | `<MethodBadge method={t.method} />` | badge has fallback |
| `gateway` | `payments.tsx:249,306,363` | direct render | none |
| `riskScore` | `payments.tsx:248,367` | `<RiskPill score={t.riskScore} />` — `score < 30 ? ... : score < 60 ? ... : ...` | none — if undefined, `undefined < 30` is `false` so it falls through to "high" tier and renders `{score}` as empty string |
| `fee` | `payments.tsx:320` | `formatCurrency(selected.fee, selected.currency)` | none |
| `amountEur` | `payments.tsx:330` | `formatCurrency(selected.amountEur, "EUR")` | none |
| `createdAt` | `dashboard.tsx:185`, `payments.tsx:251,306,371` | `timeAgo(t.createdAt)` or `formatDate(t.createdAt, { withTime: true })` | none — `timeAgo` will throw if `iso` is undefined (`new Date(undefined)` is Invalid Date, `Date.now() - NaN = NaN`, then `Math.floor(NaN / 1000) = NaN`, then `NaN < 60` is false, falls through to `NaNd ago`) |
| `metadata` | `payments.tsx:401` | `<JsonViewer data={selected.metadata ?? {}} />` | `?? {}` |
| `events` | `payments.tsx:381` | `(selected.events ?? []).map(...)` | `?? []` |

### 3.7 `WalletMovement` fields

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `id` | `wallets.tsx:293`, `treasury.tsx:249`, `fx.tsx:393` | React key | none — duplicates would cause React warning, not crash |
| `reference` | `wallets.tsx:294`, `treasury.tsx:257`, `fx.tsx:394` | direct render | none — renders `undefined` |
| `walletId` | `wallets.tsx:290` | `walletById.get(m.walletId)` | none — `Map.get(undefined)` returns `undefined`, falls back to literal `m.walletId` (`undefined`) |
| `type` | `wallets.tsx:305`, `treasury.tsx:21-37,245` | `movementTypeLabel[m.type]` / `movementIcon[m.type]` | **NO GUARD — CRASH RISK**: `movementTypeLabel[undefined]` is `undefined`, renders as empty; but `movementIcon[undefined]` in `treasury.tsx:245` becomes `Icon = undefined`, then `<Icon className="h-3.5 w-3.5" />` throws "Element type is invalid" |
| `amount` | `wallets.tsx:315`, `treasury.tsx:264`, `fx.tsx:402` | `formatCurrency(m.amount, m.currency, { compact })` | none |
| `direction` | `wallets.tsx:291`, `treasury.tsx:246` | `m.direction === "in"` | none — if undefined, `isIn = false` |
| `status` | `wallets.tsx:318`, `fx.tsx:404` | `<StatusBadge status={m.status} />` | badge fallback |
| `createdAt` | `wallets.tsx:319`, `treasury.tsx:266`, `fx.tsx:405` | `timeAgo(m.createdAt)` | none |

### 3.8 `TreasuryOverview` fields

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `totalLiquidity` | `treasury.tsx:82`, `admin-dashboard.tsx:149` | `formatCurrency(n, "EUR", { compact: true })` | `?? 0` |
| `reserve` | `treasury.tsx:90` | `formatCurrency` | none (direct `treasury.reserve`) |
| `pendingPayouts` | `treasury.tsx:97` | `formatCurrency` | none |
| `netFlow` | `treasury.tsx:104` | `formatCurrency` | none |
| `liquidityChange` | `treasury.tsx:84,105` | `change` prop on `StatCard` | none — `StatCard` does `(change ?? 0) >= 0` internally (`shared/index.tsx:93`) |
| `cashFlowSeries` | `treasury.tsx:137` | `BarTrend` stacked with `inflow`/`outflow` keys | `?? []` |
| `settlementSeries` | `treasury.tsx:158` | `AreaTrend` | `?? []` |
| `balances` | `treasury.tsx:50,175,189` | `formatCurrency(b.amount, b.currency)`, `Math.abs(b.changePct).toFixed(1)` | `?? []` at line 50 and 189; `treasury?.balances.length ?? 0` at line 175 |
| `balances[].changePct` | `treasury.tsx:192,211` | `b.changePct >= 0` and `Math.abs(b.changePct).toFixed(1)` | **NO GUARD on the `toFixed` call** — if `changePct` is undefined, `Math.abs(undefined) = NaN`, then `NaN.toFixed(1) = "NaN"` renders as the literal string `"NaN%"` |

### 3.9 `AdminMerchant` fields

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `id` | `admin-merchants.tsx:205,373`, `admin-dashboard.tsx:373` | React key / direct render | none |
| `name` | `admin-merchants.tsx:209,212`, `admin-dashboard.tsx:372` | direct render; `m.name.slice(0,2).toUpperCase()` for avatar | none — `slice` on undefined throws |
| `email` | `admin-merchants.tsx:213` | direct render | none |
| `country` | `admin-merchants.tsx:217`, `admin-dashboard.tsx:375` | direct render | none |
| `status` | `admin-merchants.tsx:218`, `admin-dashboard.tsx:376` | `<StatusBadge>` | badge fallback |
| `riskScore` | `admin-merchants.tsx:220`, `admin-dashboard.tsx:378` | `<RiskCell score={m.riskScore}>` | none — `score < 30` etc. with `undefined` falls through, `style={{ width: ${score}% }}` produces `width: undefined%` |
| `revenue` | `admin-merchants.tsx:222`, `admin-dashboard.tsx:381`, `admin-revenue.tsx:36,187` | `formatCurrency(m.revenue, "EUR", { compact: true })` | none |
| `volume` | `admin-merchants.tsx:225` | `formatCurrency(m.volume, "EUR", { compact: true })` | none |
| `createdAt` | `admin-merchants.tsx:228`, `admin-dashboard.tsx:40,384` | `formatDate(m.createdAt)` or `+new Date(b.createdAt) - +new Date(a.createdAt)` for sort | none — sort comparator with `undefined` yields `NaN` results, sort order becomes undefined |
| `kycStatus` | `admin-merchants.tsx:219` | `<StatusBadge status={m.kycStatus}>` | badge fallback |

### 3.10 `SystemHealth` fields

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `status` | `admin-dashboard.tsx:81-111`, `admin-health.tsx:107-113` | ternary cascade | `?? "operational"` (admin-health:107) |
| `uptime` | `admin-dashboard.tsx:161,164`, `admin-health.tsx:108,155,220` | `n.toFixed(3)` | `?? 0` (admin-health:108); **admin-dashboard:164** does `n.toFixed(3)` inside `StatCard.format` with no upstream guard other than the `health?.uptime ?? 0` at line 161 — safe |
| `services` | `admin-dashboard.tsx:49-52,214`, `admin-health.tsx:148,173` | `.length`, `.map(s => ...)`, `.filter(...).length` | `?? []` only in some spots; `health?.services.length ?? 0` at admin-dashboard:52 is safe; admin-health:148 same pattern |
| `services[].name` | `admin-dashboard.tsx:228`, `admin-health.tsx:180` | direct render | none |
| `services[].status` | `admin-dashboard.tsx:222-226,243`, `admin-health.tsx:177,181,183` | `===` checks; `<StatusBadge>` | none — falls through to "outage" color if undefined |
| `services[].latencyMs` | `admin-dashboard.tsx:234,241`, `admin-health.tsx:174,188` | `> 200` / `> 400` ternary, `${s.latencyMs}ms` | none |
| `queues` | `admin-dashboard.tsx:43` | `.map(q => ({ name: q.name.split(".")[0], throughput: q.throughput, pending: q.pending }))` | `?? []` upstream via `(health?.queues ?? [])` |
| `queues[].name` | `admin-dashboard.tsx:44` | `.split(".")` — throws if `name` is undefined | none |
| `workers` | not consumed | — | — |

### 3.11 `KycReview` fields

| Field | Component (file:line) | Format | Null guard? |
|-------|------------------------|--------|-------------|
| `id` | `admin-kyc.tsx` | React key | none |
| `merchantName` / `merchantId` / `country` / `submittedAt` | `admin-kyc.tsx` | direct render | none |
| `documents` | `admin-kyc.tsx:320,322` | `review.documents.length`, `.map(d => ...)` | **NO GUARD** at line 320 (`Documents (${review.documents.length})`) — if undefined, throws |
| `riskFlags` | `admin-kyc.tsx:298,300` | `review.riskFlags.length > 0 ? ... : ...` then `.map(flag => ...)` | **NO GUARD** at line 298 — if `riskFlags` is undefined, `.length` throws |
| `status` | `admin-kyc.tsx` | `<StatusBadge>` | badge fallback |

---

## 4. `toFixed()` Audit

Every `.toFixed()` call in the codebase, focusing on `src/components/` and `src/lib/`. Mock file (`src/lib/api/mock.ts`) calls excluded — those are deterministic.

| File:line | Expression | Null guard before call? | Risk if value is undefined |
|-----------|-----------|--------------------------|----------------------------|
| `lib/utils.ts:21` | `(value / 1_000_000).toFixed(2)` inside `formatCurrency` | No, but `value` is the function param typed `number` | If caller passes `undefined`, `undefined / 1e6 = NaN`, `NaN.toFixed(2) = "NaN"` |
| `lib/utils.ts:22` | `(value / 1000).toFixed(1)` same | same | same |
| `lib/utils.ts:32` | `(value / 1_000_000).toFixed(2)` inside `formatNumber` | same | same |
| `lib/utils.ts:33` | `(value / 1000).toFixed(1)` same | same | same |
| `lib/utils.ts:39` | `value.toFixed(dp)` inside `formatPercent` | same | "NaN%" |
| `merchant/fx.tsx:75` | `v.toFixed(base < 1 ? 6 : base > 1000 ? 2 : 4)` (in `rateSeries` generator) | local `v` from arithmetic | low risk (synthetic) |
| `merchant/fx.tsx:93` | `v.toFixed(4)` inside `fmtRate` | none — `v` is the function param | if `rate` is undefined → `NaN.toFixed(4) = "NaN"` |
| `merchant/fx.tsx:94` | `v.toFixed(6)` inside `fmtRate` | same | same |
| `merchant/fx.tsx:207` | `p.change.toFixed(2)` on a `Pair.change` from the local `PAIRS` constant | local data, always defined | none |
| `merchant/treasury.tsx:211` | `Math.abs(b.changePct).toFixed(1)` on `treasury.balances[].changePct` | **NO** | If `changePct` is undefined → `"NaN%"` rendered in the table |
| `merchant/treasury.tsx:222` | `share.toFixed(1)` on locally computed `share` | local | low risk |
| `merchant/webhooks.tsx:268` | `webhook.successRate.toFixed(1)` | none — direct `webhook.successRate.toFixed(1)` | if `successRate` is undefined, throws `TypeError` |
| `merchant/risk.tsx:255` | `v.toFixed(2)` inside `LineTrend` formatter | formatter param | low risk (recharts passes numbers) |
| `merchant/wallets.tsx:147` | `swapRate.toFixed(4)` (toast description) | `swapRate` is locally computed `EUR_RATES[swapFrom] / EUR_RATES[swapTo]` | low risk |
| `merchant/wallets.tsx:190` | `n.toFixed(2)` inside `StatCard.format` for "24h change" | `n` is `weightedChange` — derived from `w.changePct` (see §3.4); **if any wallet has `changePct === undefined`, `weightedChange = NaN`, then `NaN.toFixed(2) = "NaN"`** | renders `"NaN%"` |
| `merchant/wallets.tsx:464` | `swapRate.toFixed(swapRate < 1 ? 4 : 2)` | local | low risk |
| `merchant/settings.tsx:583` | `pct.toFixed(0)` | local state | low risk |
| `merchant/analytics.tsx:225` | `convPct.toFixed(1)` | local derived | low risk |
| `merchant/analytics.tsx:241` | `((stage.value / funnel[i - 1].value) * 100).toFixed(1)` | local | low risk |
| `merchant/analytics.tsx:320` | `c.share.toFixed(1)` | local | low risk |
| `shared/index.tsx:136` | `Math.abs(change).toFixed(1)` inside `StatCard` change indicator | `(change ?? 0)` upstream at line 93, but `Math.abs(undefined).toFixed(1) = "NaN"` if upstream guard fails | low risk (StatCard always passes a number) |
| `admin/admin-support.tsx:110` | `n.toFixed(1)` inside `StatCard.format` for "Avg resolution" | hardcoded `4.2` value | none |
| `admin/admin-compliance.tsx:106` | `n.toFixed(1)` for KYC approval rate | local derived | low risk |
| `admin/admin-health.tsx:98` | `v.toFixed(3)` in `buildUptimeSeries` generator | local | low risk |
| `admin/admin-health.tsx:155` | `uptime.toFixed(3)` | `health?.uptime ?? 99.99` upstream at line 108 | safe |
| `admin/admin-health.tsx:220` | `v.toFixed(2)` inside `AreaTrend` formatter | formatter param | low risk |
| `admin/admin-queues.tsx:123` | `Math.min(100, load).toFixed(0)` | local derived | low risk |
| `admin/admin-risk.tsx:186` | `(n * 0.02).toFixed(2)` inside `StatCard.format` | local derived | low risk |
| `admin/admin-gateways.tsx:164` | `g.uptime.toFixed(2)` | local `GATEWAYS` const | low risk |
| `admin/admin-gateways.tsx:214` | `((g.volume / totalVolume) * 100).toFixed(1)` | local derived | low risk |
| `admin/admin-dashboard.tsx:164` | `n.toFixed(3)` inside `StatCard.format` for "System uptime" | `health?.uptime ?? 0` upstream at line 161 | safe |
| `admin/admin-workers.tsx:69,123,208` | `n.toFixed(1)` / `util.toFixed(0)` / `util.toFixed(1)` | local derived | low risk |
| `admin/admin-treasury.tsx:208,220` | `Math.abs(b.changePct).toFixed(1)` / `share.toFixed(1)` | **NO** guard on `b.changePct` — same risk as `treasury.tsx:211` | "NaN%" |
| `admin/admin-kyc.tsx:337,386` | `(d.sizeKb / 1024).toFixed(2)` | local `d.sizeKb` from `KycDocument` | if `sizeKb` is undefined → `"NaN"` |
| `admin/admin-revenue.tsx:128` | `n.toFixed(1)` inside `StatCard.format` for growth | local hardcoded `18.4` | none |
| `landing/landing-page.tsx:751` | `n.toFixed(1)` | local | low risk |

### Highest-risk `toFixed()` calls (would render `"NaN"` or throw on real API data)

1. **`treasury.tsx:211`** and **`admin-treasury.tsx:208`** — `Math.abs(b.changePct).toFixed(1)` on `TreasuryOverview.balances[].changePct`. Backend must always return `changePct: 0` (never `null`/`undefined`).
2. **`wallets.tsx:190`** — `n.toFixed(2)` where `n` is `weightedChange` derived from `w.changePct`. Same root cause: `Wallet.changePct` must always be present.
3. **`webhooks.tsx:268`** — `webhook.successRate.toFixed(1)`. `Webhook.successRate` must always be a number.

---

## 5. `.length` Audit on API Data

Excludes `.length` on static arrays (`PAIRS`, `TICKETS`, `INCIDENTS`, `GATEWAYS`, `TEMPLATES`, `SCREENINGS`, `AUDIT`, `COUNTRY_LIST`, `STATUSES`, `FILTERS`, `PAIRS`, `LANGS`, `NAV_LINKS`, etc.) and `.length` inside utility functions like `hashStr`. Focuses on API-derived arrays.

| File:line | Variable | Guard? | Risk |
|-----------|----------|--------|------|
| `merchant/dashboard.tsx:92` | `w.length` (wallets) | upstream `?? []` at line 32 | safe |
| `merchant/dashboard.tsx:172` | `txs.length` | upstream `?? []` at line 34 | safe |
| `merchant/dashboard.tsx:220` | `(r?.alerts ?? []).length` | `?? []` | safe |
| `merchant/payments.tsx:225` | `rows.length` (paginated tx) | upstream `data?.data ?? []` at line 93 | safe |
| `merchant/risk.tsx:171` | `risk?.alerts.length ?? 0` | **PARTIAL** — guard only catches `risk === undefined`. If `risk.alerts` is undefined, throws. | **HIGH RISK** |
| `merchant/wallets.tsx:268` | `movements.length` | upstream `?? []` at line 64 | safe |
| `merchant/treasury.tsx:175` | `treasury?.balances.length ?? 0` | **PARTIAL** — same pattern as risk.tsx:171 | medium risk |
| `merchant/fx.tsx:368,374` | `swaps.length` | upstream `(movementsRes ?? []).filter(...)` at line 103 | safe |
| `merchant/customers.tsx:74,75,159,195,315` | `customers.length`, `filtered.length`, `customerTx.length` | upstream `?? []` at line 58 | safe |
| `merchant/customers.tsx:74` | `customers.filter((c) => c.segment === "vip").length` | upstream guard | safe |
| `merchant/products.tsx:74,75,304,315` | `products.length`, `filtered.length` | upstream `?? []` | safe |
| `merchant/payment-links.tsx:58,59,234` | `links.length` | upstream `?? []` | safe |
| `merchant/webhooks.tsx:101,210` | `webhooks.length`, `events.length` | upstream `?? []`; `events` is local state | safe |
| `merchant/subscriptions.tsx:58,59,85,110,177,199,210` | `subs.length`, `activeSubs.length`, `donutData.length` | upstream `?? []` | safe |
| `merchant/invoices.tsx:102,264,287,299` | `invoices.length`, `filtered.length` | upstream `?? []` | safe |
| `merchant/stores.tsx:49,50,201` | `stores.length` | upstream `?? []` | safe |
| `merchant/api-keys.tsx:141,149,318` | `keys.length`, `filtered.length`, `scopes.length` | upstream `?? []`; `scopes` is local | safe |
| `admin/admin-dashboard.tsx:36,37` | `merchants?.length ?? 0`, `kyc?.length ?? 0` | `?? 0` | safe |
| `admin/admin-dashboard.tsx:51,52` | `health?.services.filter(...).length`, `health?.services.length ?? 0` | `?? 0` on the second; first does `(health?.services ?? []).filter(...).length` at line 49 — safe | safe |
| `admin/admin-dashboard.tsx:350` | `recentMerchants.length === 0` | upstream `merchants ?? []` at line 38 | safe |
| `admin/admin-merchants.tsx:85,90-93,180,266,270` | `filtered.length`, `all.length`, `all.filter(...).length`, `pageRows.length` | upstream `?? []` at line 88 | safe |
| `admin/admin-health.tsx:148,159` | `health?.services.length ?? 0`, `INCIDENTS.filter(...).length` | `?? 0` on services; INCIDENTS is local | safe |
| `admin/admin-kyc.tsx:89,105,298,320` | `pending.length`, `review.riskFlags.length`, `review.documents.length` | upstream `?? []` for `pending`; **NO GUARD on `review.riskFlags.length` (line 298) and `review.documents.length` (line 320)** | **HIGH RISK** — if backend omits these arrays on a `KycReview`, throws `TypeError` |
| `admin/admin-revenue.tsx:26` | `merchantList.length \|\| 1` | upstream `?? []` at line 22 | safe |
| `admin/admin-compliance.tsx:73-76,108` | `kyc.filter(...).length`, `kyc.length \|\| 1` | local mock data | low risk |
| `admin/admin-analytics.tsx:39,105` | `merchants.length` (after `.filter`) | upstream `?? []` | safe |
| `admin/admin-risk.tsx:109,110,112,113,147,199,287,373` | `list.length`, `list.filter(...).length`, `platformAlerts.filter(...).length` | upstream `?? []` | safe |
| `admin/admin-flags.tsx:83-85,102,137` | `flags.filter(...).length`, `flags.length`, `filtered.length` | local mock | low risk |
| `admin/admin-logs.tsx:126-129,211,245` | `allLogs.length`, `allLogs.filter(...).length`, `filtered.length` | local mock | low risk |
| `admin/admin-queues.tsx:75` | `queues.filter(...).length` and `queues.length` | local mock | low risk |
| `admin/admin-treasury.tsx:304` | `pendingPayoutsFeed.length` | local mock | low risk |

### Highest-risk `.length` calls

1. **`risk.tsx:171`** — `risk?.alerts.length ?? 0`. Should be `(risk?.alerts ?? []).length`.
2. **`admin-kyc.tsx:298`** — `review.riskFlags.length`. Should be `(review.riskFlags ?? []).length`.
3. **`admin-kyc.tsx:320`** — `review.documents.length`. Should be `(review.documents ?? []).length`.
4. **`treasury.tsx:175`** — `treasury?.balances.length ?? 0`. Same anti-pattern.

---

## 6. `.map()` Audit on API Data

Excludes `.map()` on static arrays (`CURRENCIES`, `PAYMENT_METHODS`, `STATUSES`, `COUNTRY_LIST`, `PAIRS`, `TABS`, `NAV_LINKS`, `breadcrumbs`, `payload` in chart tooltips, etc.). Excludes `Array.from({ length: N }).map(...)` for skeletons. Focuses on API-derived arrays.

| File:line | Variable | Guard? | Risk |
|-----------|----------|--------|------|
| `merchant/dashboard.tsx:95` | `w.slice(0, 4).map(...)` | upstream `?? []` at line 32 | safe |
| `merchant/dashboard.tsx:173` | `txs.map(...)` | upstream `?? []` at line 34 | safe |
| `merchant/analytics.tsx:144` | `(a?.currencies ?? []).map(...)` | `?? []` | safe (note field-name mismatch with type — see §2.4) |
| `merchant/analytics.tsx:186` | `(a?.paymentMethods ?? []).map(...)` | `?? []` | safe |
| `merchant/analytics.tsx:263` | `topByLtv.map(...)` | upstream `a?.topCustomers ?? []` at line 69 | safe |
| `merchant/analytics.tsx:303` | `countries.map(...)` | locally derived from `COUNTRY_LIST` | low risk |
| `merchant/analytics.tsx:210,241` | `funnel.map(...)`, nested calc | local derived | low risk |
| `merchant/fx.tsx:345` | `wallets.map(...)` | upstream `?? []` at line 102 | safe |
| `merchant/fx.tsx:392` | `swaps.slice(0, 10).map(...)` | upstream `?? []` at line 103 | safe |
| `merchant/wallets.tsx:101` | `wallets.map(...)` (allocationData memo) | upstream `?? []` at line 63 | safe |
| `merchant/wallets.tsx:199` | `wallets.map(...)` | safe upstream | safe |
| `merchant/wallets.tsx:289` | `movements.slice(0, 12).map(...)` | upstream `?? []` at line 64 | safe |
| `merchant/treasury.tsx:189` | `(treasury?.balances ?? []).map(...)` | `?? []` | safe |
| `merchant/treasury.tsx:244` | `(movements ?? []).slice(0, 8).map(...)` | `?? []` | safe |
| `merchant/treasury.tsx:283` | `(wallets ?? []).slice(0, 6).map(...)` | `?? []` | safe |
| `merchant/risk.tsx:146` | `(risk?.recommendations ?? []).map(...)` | `?? []` | safe |
| `merchant/risk.tsx:184` | `(risk?.alerts ?? []).map(...)` | `?? []` | safe |
| `merchant/customers.tsx:201` | `filtered.slice(0, 25).map(...)` | upstream `?? []` at line 58 | safe |
| `merchant/customers.tsx:321` | `customerTx.slice(0, 8).map(...)` | upstream `?? []` at line 95 | safe |
| `merchant/payments.tsx:231` | `rows.map(...)` | upstream `?? []` at line 93 | safe |
| `merchant/payments.tsx:381` | `(selected.events ?? []).map(...)` | `?? []` | safe |
| `merchant/api-keys.tsx:171` | `filtered.map(...)` | upstream `?? []` | safe |
| `merchant/api-keys.tsx:194` | `(k?.scopes ?? []).map(...)` | `?? []` | safe |
| `admin/admin-dashboard.tsx:43` | `(health?.queues ?? []).map(...)` | `?? []` | safe |
| `admin/admin-dashboard.tsx:214` | `(health?.services ?? []).map(...)` | `?? []` | safe |
| `admin/admin-dashboard.tsx:366` | `recentMerchants.map(...)` | upstream `merchants ?? []` at line 38 | safe |
| `admin/admin-health.tsx:173` | `(health?.services ?? []).map(...)` | `?? []` | safe |
| `admin/admin-merchants.tsx:204` | `pageRows.map(...)` | upstream `?? []` at line 88 | safe |
| `admin/admin-revenue.tsx:73` | `(revenue?.series ?? []).slice(-6).map(...)` | `?? []` | safe |
| `admin/admin-revenue.tsx:178` | `topMerchants.map(...)` | upstream `?? []` at line 22 | safe |
| `admin/admin-revenue.tsx:258` | `byCountry.map(...)` | derived | safe |
| `admin/admin-analytics.tsx:60` | `(analytics?.currencies ?? []).map(...)` | `?? []` | safe |
| `admin/admin-analytics.tsx:165` | `(analytics?.paymentMethods ?? []).map(...)` | `?? []` | safe |
| `admin/admin-kyc.tsx:113` | `pending.map(...)` | upstream `?? []` | safe |
| `admin/admin-kyc.tsx:300` | `review.riskFlags.map(...)` | **NO GUARD** | **HIGH RISK** — throws if `riskFlags` is undefined |
| `admin/admin-kyc.tsx:322` | `review.documents.map(...)` | **NO GUARD** | **HIGH RISK** — throws if `documents` is undefined |
| `admin/admin-treasury.tsx:182` | `(t?.balances ?? []).map(...)` | `?? []` | safe |

### Highest-risk `.map()` calls

1. **`admin-kyc.tsx:300`** — `review.riskFlags.map(flag => ...)`. Should be `(review.riskFlags ?? []).map(...)`.
2. **`admin-kyc.tsx:322`** — `review.documents.map(d => ...)`. Should be `(review.documents ?? []).map(...)`.

All other `.map()` calls in components iterate arrays that are either (a) wrapped with `?? []` in the hook's `select` function, (b) guarded inline with `?? []`, or (c) locally derived from `COUNTRY_LIST` / constants.

---

## 7. Formatting Patterns

### 7.1 `formatCurrency(value, currency, opts?)` — `lib/utils.ts:17`

Behavior: looks up symbol from local `currencySymbols` map (`EUR→€, USD→$, BRL→R$, GBP→£, USDT→₮, BTC→₿`). If `opts.compact` and `|value| >= 1000`: returns `${symbol}${(value/1e6).toFixed(2)}M` or `${symbol}${(value/1000).toFixed(1)}k`. Otherwise `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.

**Weakness:** If `value` is `undefined | null`, `Math.abs(undefined) = NaN`, `undefined / 1e6 = NaN`, `NaN.toLocaleString(...) = "NaN"`. Output is `"€NaN"`.

Callsites (representative — full list in tool-results grep):

| File:line | Value passed | Currency | Compact? | Could be undefined? |
|-----------|--------------|----------|----------|---------------------|
| `merchant/dashboard.tsx:72,111,114,115,182` | `totalBalance`, `volumeToday`, `volumeMonth`, `wallet.balance`, `wallet.available`, `wallet.reserved`, `t.amount` | various | mixed | `totalBalance` etc. guarded with `?? 0`; `t.amount` direct — yes |
| `merchant/analytics.tsx:104,105,132,146,147,172,191,272,309` | `a.revenue`, `a.volume`, `a.topCustomers[].ltv`, etc. | EUR | compact | `a.revenue` direct — yes (no `?? 0`) |
| `merchant/wallets.tsx:122,134,147,187,188,189,239,244,247,315,336` | `wallet.balance`, `m.amount`, `totalEur`, etc. | various | mixed | `m.amount` direct — yes |
| `merchant/payments.tsx:182,244,315,320,325,330` | `t.amount`, `selected.amount`, `selected.fee`, `selected.amountEur` | various | no | direct — yes |
| `merchant/treasury.tsx:86,93,100,108,144,161,204,264,310,313` | `treasury.totalLiquidity`, `treasury.reserve`, `treasury.pendingPayouts`, `treasury.netFlow`, `b.amount`, `m.amount`, `w.balance` | various | mixed | direct on `treasury.*` — yes |
| `merchant/fx.tsx:133,134,282,289,352,402` | `numericAmount`, `result`, `fee`, `w.balance`, `s.amount` | various | mixed | `s.amount` direct — yes |
| `merchant/customers.tsx:114,115,116,228,229,262,270,273,333` | `stats.totalLtv`, `stats.avgOrder`, `c.avgOrder`, `c.ltv`, `selected.ltv`, `selected.avgOrder`, `t.amount` | EUR | compact | guarded via `stats` memo — yes |
| `admin/admin-dashboard.tsx:141,153,187,381` | `revenue?.total`, `treasury?.totalLiquidity`, `revenue.series`, `m.revenue` | EUR | compact | `?? 0` on stat cards; `revenue.series` chart data unguarded |
| `admin/admin-merchants.tsx:222,225` | `m.revenue`, `m.volume` | EUR | compact | direct — yes |
| `admin/admin-revenue.tsx:107,114,121,152,187,234,273,295` | `totalRevenue`, `mrr`, `avgPerMerchant`, `revenue.series`, `m.revenue`, `c.value`, `totalRevenue * share` | EUR | compact | `revenue.series` chart data unguarded; rest derived from `?? 0` |
| `admin/admin-treasury.tsx` | various `treasury.*` fields | EUR | compact | direct |

### 7.2 `formatNumber(value, opts?)` — `lib/utils.ts:30`

Compact mode returns `M`/`k` suffixes. Non-compact returns `value.toLocaleString("en-US")`. Same `NaN` risk if `value` is undefined.

### 7.3 `formatPercent(value, dp = 1)` — `lib/utils.ts:38`

Returns `${value.toFixed(dp)}%`. **Throws `TypeError: Cannot read properties of undefined (reading 'toFixed')` if `value` is undefined.**

Callsites that pass unguarded API data:

| File:line | Expression | Guard? |
|-----------|-----------|--------|
| `merchant/dashboard.tsx:75,144` | `formatPercent(successRate)` | upstream `?? 0` |
| `merchant/dashboard.tsx:210` | `formatPercent(r.reservePct)` | `r ? ... : "—"` |
| `merchant/dashboard.tsx:215` | `formatPercent(r.chargebackRate, 2)` | same |
| `merchant/analytics.tsx:106,107,206` | `formatPercent(a.conversion)`, `formatPercent(a.approvalRate)` | upstream `?? 4.7` / `?? 96.8` hardcoded fallbacks |
| `merchant/risk.tsx:73,74,136` | `formatPercent(risk.reservePct)`, `formatPercent(risk.chargebackRate, 2)` | inside `!risk ? ... : ...` branch |

### 7.4 `timeAgo(iso)` — `lib/utils.ts:59`

Returns `Ns ago`, `Nm ago`, `Nh ago`, or `Nd ago`. **Throws if `iso` is undefined**: `new Date(undefined)` is Invalid Date, `getTime()` returns `NaN`, `Date.now() - NaN = NaN`, all subsequent `Math.floor(NaN / ...)` return `NaN`, all comparisons return `false`, falls through to final `${NaN}d ago`.

Callsites that pass unguarded timestamps: `dashboard.tsx:185` (`t.createdAt`), `payments.tsx:251,371` (`t.createdAt`, `ev.createdAt`), `wallets.tsx:319` (`m.createdAt`), `treasury.tsx:266` (`m.createdAt`), `fx.tsx:405` (`s.createdAt`), `customers.tsx:231,331` (`c.lastSeen`, `t.createdAt`), `risk.tsx:204` (`a.createdAt`), `admin-dashboard.tsx:384` (`m.createdAt`), `admin-health.tsx:148` (`new Date().toISOString()` — safe), `admin-merchants.tsx:228` (`formatDate(m.createdAt)` — same `new Date(undefined)` issue in `formatDate`).

### 7.5 `formatDate(iso, opts?)` — `lib/utils.ts:42`

Returns localized date or datetime. **If `iso` is undefined, `new Date(undefined)` is Invalid Date and `toLocaleString(...)` returns `"Invalid Date"`.** Same risk as `timeAgo`.

### 7.6 Opportunity: Centralize a `formatMoney(value, currency)` that handles null

The current `formatCurrency(value, currency, opts)` does NOT guard against `undefined`/`null`. Every callsite either:
1. Pre-guards with `?? 0` (most stat cards), which converts `undefined` to `0` → renders `€0.00` (silent fallback that hides data issues).
2. Passes the raw value (table cells, detail sheets), which renders `€NaN` when the field is missing.

**Recommendation:** Add a top-of-function guard to `formatCurrency`:

```typescript
export function formatCurrency(value: number | null | undefined, currency = "EUR", opts?: { compact?: boolean }) {
  if (value == null || Number.isNaN(value)) return "—";
  // ...existing implementation
}
```

Same treatment for `formatNumber`, `formatPercent`, `formatDate`, `timeAgo` (return `"—"` or `""` for null input). This eliminates the entire class of `€NaN` / `"NaN%"` / `"NaNd ago"` rendering bugs at one stroke.

---

## 8. Gap Analysis (Backend Missing)

Per `BACKEND.md` §5.4, the following endpoints are referenced by the frontend but have no backend controller. Priority is mapped to the dashboard impact: **P1** = blocks the primary merchant dashboard, **P2** = blocks a major feature, **P3** = admin-only or non-critical.

| # | Endpoint | Expected response shape | Pages affected when missing | Priority |
|---|----------|------------------------|-----------------------------|----------|
| 1 | `POST auth/register` | `AuthSession` (same as login) | `auth-screen.tsx` register tab falls back to mock or returns 404 | P2 |
| 2 | `POST auth/logout` | `{ ok: true }` | Logout works client-side but the refresh token is not revoked server-side (security gap) | P3 |
| 3 | `GET transactions/stats` | `{ total, approved, failed, pending, successRate, volume }` | **None currently** — `useTransactionStats()` is an orphan hook | P3 (remove the hook or implement) |
| 4 | `POST checkout/session` | `{ sessionId, checkoutUrl }` | Hosted checkout flow unavailable | P2 |
| 5 | `GET checkout/session/:id` | `{ sessionId, storeName, amount, currency, reference }` | Checkout iframe cannot load | P2 |
| 6 | `GET kyc/status` (merchant) | `{ status, submittedAt?, documents?, riskFlags? }` | Merchant-side KYC submission not surfaced (admin queue only) | P3 |
| 7 | `GET admin/gateways` | `Gateway[]` | `admin-gateways.tsx` uses local `GATEWAYS` constant | P3 |
| 8 | `GET admin/feature-flags` + `PATCH /admin/feature-flags/:key` | `Flag[]` | `admin-flags.tsx` uses local state | P3 |
| 9 | `GET admin/audit-logs` (paginated) | `Paginated<LogEntry>` | `admin-logs.tsx` generates mock entries | P3 |
| 10 | `GET admin/support/tickets` + `PATCH /admin/support/tickets/:id` | `Ticket[]` | `admin-support.tsx` uses local `TICKETS` | P3 |
| 11 | `GET /support/tickets` + `POST /support/tickets` | `Ticket[]` / `Ticket` | `merchant/support.tsx` uses local `RECENT_TICKETS` | P3 |
| 12 | `GET admin/workers` | `Worker[]` | `admin-workers.tsx` uses local mock | P3 |
| 13 | `GET admin/queues` | `Queue[]` | `admin-queues.tsx` uses local mock | P3 |
| 14 | `GET admin/analytics/overview` | Platform-wide `AnalyticsOverview` | `admin-analytics.tsx` reuses the merchant `useAnalyticsOverview()` — gets the wrong (merchant-scoped) numbers | P2 (admin sees wrong data) |
| 15 | `GET admin/risk/overview` | Platform-wide `RiskProfile` + per-merchant risk | `admin-risk.tsx` uses local `platformAlerts` mock | P3 |
| 16 | `GET admin/compliance/overview` | KYC + screening aggregates | `admin-compliance.tsx` uses local `SCREENINGS`/`AUDIT` mocks | P3 |

### 8.1 Pages that crash or show empty when specific endpoints are missing

| Endpoint missing | Visible failure |
|------------------|-----------------|
| `analytics/overview` | Merchant Dashboard (`dashboard.tsx`) shows `ErrorState` ("Failed to load analytics data. The backend may be unreachable.") and Analytics page (`analytics.tsx`) shows the same. The 5 stat cards, latest transactions table, risk strip, and all charts are blocked. |
| `wallets` | Wallets page (`wallets.tsx`), Treasury page (`treasury.tsx`), FX page (`fx.tsx`), Dashboard wallet grid (`dashboard.tsx`) all show skeletons or `ErrorState`. |
| `wallets/movements` | Wallets page Movements table shows skeletons forever (no `ErrorState` for movements — silent). Treasury "Recent movements" section shows skeletons forever. FX "Recent swaps" shows skeletons. |
| `risk/profile` | Risk Center page (`risk.tsx`) shows `ErrorState`. Dashboard risk strip shows `—` placeholders. |
| `treasury/overview` | Treasury page (`treasury.tsx`) shows `ErrorState`. |
| `transactions` | Payments page (`payments.tsx`) shows `ErrorState`. Dashboard latest-transactions table falls back to `a?.recentTransactions ?? []`. Customers page purchase-history sheet shows "No captured payments linked to this customer." |
| `customers` | Customers page (`customers.tsx`) stat cards show skeletons, table shows empty state. |
| `admin/merchants` | Admin Overview (`admin-dashboard.tsx`) shows skeletons for stat cards and recent-merchants table. Admin Merchants page (`admin-merchants.tsx`) shows empty state. Admin Revenue (`admin-revenue.tsx`) shows skeletons for top-merchants. Admin Analytics (`admin-analytics.tsx`) shows skeletons. |
| `admin/revenue` | Admin Overview revenue chart shows skeleton. Admin Revenue page top-line cards and main chart show skeletons. |
| `admin/health` | Admin Overview health badge + service list shows skeletons. Admin Health page banner + services grid shows skeletons. |
| `admin/kyc` | Admin Overview KYC queue count is `0`. Admin KYC page shows empty state. |
| `admin/treasury/overview` | Admin Overview treasury liquidity stat card shows skeleton. Admin Treasury page shows `ErrorState`. |

---

## 9. Refactoring Opportunities

### 9.1 Fields that should be added to existing API responses (to eliminate hardcoded data)

| Hardcoded value | File:line | Should come from |
|-----------------|-----------|------------------|
| `184200` (visits) used to derive the conversion funnel | `merchant/analytics.tsx:42` | `AnalyticsOverview.funnel` array — add `{ visits, initiated, authenticated, captured }[]` or top-level fields |
| `4.7` and `96.8` (conversion/approval fallbacks) | `merchant/analytics.tsx:40-41` | Already exist as `a.conversion`/`a.approvalRate` — make these required, not optional, on the type |
| `EUR_RATES` table (`{ EUR: 1, USD: 0.92, BRL: 0.18, GBP: 1.17, USDT: 0.99, BTC: 42000 }`) | `merchant/wallets.tsx:36` | New endpoint `GET /fx/rates` returning `{ base: "EUR", rates: Record<CurrencyCode, number>, fetchedAt: string }`. Same data is duplicated in `fx.tsx:32` (`BASE_RATE`) with **different values** (BTC=61861 vs 42000) — this inconsistency will show different totals on the wallets page vs the FX page |
| `BASE_RATE` table in FX page | `merchant/fx.tsx:32` | Same `/fx/rates` endpoint |
| `PAIRS` array (6 currency pairs with hardcoded `change` values) | `merchant/fx.tsx:48` | `/fx/pairs` endpoint returning `{ pair, from, to, rate, change, changePct }[]` |
| `feeRate = 0.005` (0.5% spread) | `merchant/fx.tsx:112` | `Merchant.feeRate` or `/fx/quote` response per conversion request |
| `18.4` (YoY growth %) | `admin/admin-revenue.tsx:29,88,128,143` and `admin/admin-dashboard.tsx:139,180` | `admin/revenue` response should include `growthPct` |
| `4h 12m` (KYC avg review time) | `admin/admin-dashboard.tsx:276` | `admin/kyc` response should include `avgReviewTimeMin` |
| `8h` (KYC SLA target) | `admin/admin-dashboard.tsx:280` | Same — or move to a config endpoint |
| `14` and `3` (KYC approvals/rejections in 24h) | `admin/admin-dashboard.tsx:284-288` | `admin/kyc` response should include `approvals24h` and `rejections24h` |
| `99.99` (fallback uptime) | `admin/admin-health.tsx:108` | `SystemHealth.uptime` should always be present |
| `"99.99"`, `"98.82"`, `"97.40"` per-service uptime | `admin/admin-health.tsx:193` | `SystemHealth.services[].uptime` should be added to the type (currently only `latencyMs`) |
| `INCIDENTS` array | `admin/admin-health.tsx:47-85` | New endpoint `GET /admin/incidents` returning `Incident[]` |
| `buildUptimeSeries()` 90-day generator | `admin/admin-health.tsx:87-101` | `SystemHealth.uptimeSeries` field (currently only the scalar `uptime`) |
| `growth = 18.4` in admin-revenue | `admin/admin-revenue.tsx:29` | `admin/revenue` response should include `growthPct` |
| `shares` array (currency distribution hardcoded `{EUR:0.41, USD:0.28, BRL:0.19, GBP:0.08, USDT:0.04}`) | `admin/admin-revenue.tsx:58-65` | `admin/revenue` response should include `byCurrency: { currency, value }[]` |
| `comparison` derived as `s.value * (0.78 + i * 0.02)` | `admin/admin-revenue.tsx:76` | `admin/revenue` should include `series: { date, thisPeriod, lastPeriod }[]` directly |
| `mrr = totalRevenue / 12` (crude MRR approximation) | `admin/admin-revenue.tsx:27` | `admin/revenue` should include `mrr` field computed server-side from subscription records |

### 9.2 Formatting that should be centralized

1. **Null-guard the format helpers.** Add `if (value == null || Number.isNaN(value)) return "—";` at the top of `formatCurrency`, `formatNumber`, `formatPercent`. Add `if (!iso) return "—";` at the top of `timeAgo` and `formatDate`. This single change eliminates the entire class of `€NaN` / `"NaN%"` / `"NaNd ago"` bugs identified in §4 and §7.

2. **Introduce `formatMoney(value, currency, opts)` for financial values.** Distinguish from `formatCurrency` (which is generic). `formatMoney` should:
   - Accept `number | string | null | undefined` (Prisma `Decimal` arrives as string).
   - Coerce string→number with `Number(value)` and validate.
   - Always show at least 2 decimal places for non-compact renders.
   - Support `precision` override for BTC (8 decimals) and USDT (6 decimals).

3. **Centralize currency metadata.** `CURRENCIES` in `config/index.ts:140` has `code/symbol/flag` but no `precision`, `decimals`, or `color`. Add `precision` (BTC=8, USDT=6, others=2) and a `color` per currency so wallets/treasury/fx don't each re-declare color tables.

4. **Move method labels into `PAYMENT_METHODS` config.** `badges.tsx:68` has a local `labels` record; `analytics.tsx:23` has another `methodLabel` record. Both duplicate the same mapping. Consolidate into `PAYMENT_METHODS` (add `label` field — already present) and read from there.

5. **Standardize the safe-array access pattern.** Hooks already do `select: (d) => d ?? []` for most list endpoints. Components should NOT re-guard — instead trust the hook's selected output. The risk.tsx:171 / treasury.tsx:175 / admin-kyc.tsx:298,320 anti-patterns (`x?.y.length ?? 0` instead of `(x?.y ?? []).length`) come from inconsistency. A shared ESLint rule or a `useSafeArray` hook could enforce.

### 9.3 Unsafe access patterns that need `??` guards

| Pattern | Location | Fix |
|---------|----------|-----|
| `risk?.alerts.length ?? 0` | `risk.tsx:171` | `(risk?.alerts ?? []).length` |
| `treasury?.balances.length ?? 0` | `treasury.tsx:175` | `(treasury?.balances ?? []).length` |
| `review.riskFlags.length` / `.map` | `admin-kyc.tsx:298,300` | `(review.riskFlags ?? [])` |
| `review.documents.length` / `.map` | `admin-kyc.tsx:320,322` | `(review.documents ?? [])` |
| `w.changePct * (...)` arithmetic | `wallets.tsx:70` | `(w.changePct ?? 0) * (...)` |
| `${w.color}22` style | `wallets.tsx:208,213` | `w.color ?? "#3b82f6"` (default) |
| `movementIcon[m.type]` lookup → render | `treasury.tsx:245` | `const Icon = movementIcon[m.type] ?? ArrowLeftRight;` |
| `movementTypeLabel[m.type]` lookup | `wallets.tsx:305` | `movementTypeLabel[m.type] ?? m.type` |
| `Math.abs(b.changePct).toFixed(1)` | `treasury.tsx:211`, `admin-treasury.tsx:208` | `Math.abs(b.changePct ?? 0).toFixed(1)` |
| `webhook.successRate.toFixed(1)` | `webhooks.tsx:268` | `(webhook.successRate ?? 0).toFixed(1)` |
| `q.name.split(".")[0]` | `admin-dashboard.tsx:44` | `(q.name ?? "").split(".")[0]` |
| `m.name.slice(0, 2).toUpperCase()` | `admin-merchants.tsx:209` | `(m.name ?? "").slice(0, 2).toUpperCase()` |
| `+new Date(b.createdAt) - +new Date(a.createdAt)` (sort) | `admin-dashboard.tsx:40` | guard with `(x.createdAt ? +new Date(x.createdAt) : 0)` |
| `new Date(selected.firstSeen).toLocaleDateString(...)` | `customers.tsx:294` | guard or use `formatDate(selected.firstSeen)` |
| `a?.currencies` (field-name mismatch) | `analytics.tsx:144` and `admin-analytics.tsx:60` | Either rename the type field from `currencies_dist` to `currencies` to match the backend (`BACKEND.md` §5.3.3 confirms backend returns `currencies`) and the consumer, or rename the consumer. Currently the type is wrong. |

### 9.4 Type vs consumer mismatches

| Field in type | Consumer reads | Resolution |
|---------------|----------------|------------|
| `AnalyticsOverview.currencies_dist` (`types/index.ts:208`) | `a?.currencies` (`analytics.tsx:144`, `admin-analytics.tsx:60`) | Rename type field to `currencies` to match backend (`BACKEND.md` line 1284) and consumer |
| `AnalyticsOverview.realtime` (defined, never consumed) | — | Either remove from type or wire into a real-time activity widget |
| `Transaction.events` (optional `TxEvent[]`) | Only populated when backend returns from `transactions/:id` | The list endpoint does not populate events; the payments.tsx detail sheet falls back to `?? []` — fine |
| `WalletsResponse.summary` (`WalletSummary`) | Defined but `useWalletsSummary()` hook exists and is **not called by any component** | Either remove the hook or wire it into a summary stat strip |
| `useTransactionStats()` (`queries.ts:73`) | Hook exists but **not called by any component** | Remove the hook or wire it into the dashboard; otherwise delete the orphaned `transactions.stats` endpoint from `xpApi.ts:123` |
| `useAdminTreasury()` returns `TreasuryOverview` but `admin-treasury.tsx` reads `t.balances` and `t.cashFlowSeries` — same shape as merchant side | — | OK |
| `KycReview.documents` (required array) | `admin-kyc.tsx:320` reads `.length` without guard | Type says required but backend may omit — either enforce server-side or add `?? []` |
| `KycReview.riskFlags` (required array) | `admin-kyc.tsx:298` reads `.length` without guard | Same |

### 9.5 Auth envelope inconsistency

`xpApi.ts:48-70` (`mapEnvelopeToSession`) reads `envelope.data = { token, merchant: { id, name, email } }` and synthesizes an `AuthSession` with `expiresAt = Date.now() + 8h` and `refreshToken = token` (comment: "v3.1 doesn't issue a separate refresh token yet").

However, `BACKEND.md` §5.3.1 #1 specifies the login response is a **bare `AuthSession`** (not an envelope): `{ accessToken, refreshToken, expiresAt, user: { ... } }`. And §5.3.1 #5 specifies the refresh response is asymmetric (no `expiresAt`).

The current frontend code cannot consume the bare-`AuthSession` backend shape — it expects `{ success, data: { token, merchant } }`. This is a **critical contract mismatch**: either the backend must return the envelope shape the frontend expects, or `mapEnvelopeToSession` must be rewritten to consume a bare `AuthSession`. The `BACKEND.md` and the frontend code disagree. **Recommend resolving before any backend implementation begins.**

### 9.6 Pagination param mismatch

`DataTableFilters` (`types/index.ts:405`) declares both `limit` and `pageSize`. `xpApi.transactions.list` (`xpApi.ts:113-114`) prefers `limit` over `pageSize` and sends `limit` to the backend. `BACKEND.md` §5.3.5 #13 documents the query param as `pageSize`. The merchant customers page (`customers.tsx:56`) still passes `pageSize: 200`. **Resolution:** standardize on `limit` (v3.1) everywhere; remove `pageSize` from `DataTableFilters` and the legacy `Paginated.total/page/pageSize` fields.

### 9.7 `requestData` returns `null` for missing `data`

`client.ts:218` returns `envelope.data as T` which is `null` when the backend returns `{ success: true, data: null }`. All list hooks compensate with `select: (d) => d ?? []`. But hooks without a `select` (`useAnalyticsOverview`, `useRiskProfile`, `useTreasury`, `useTransactions`, `useAdminTreasury`, `useAdminHealth`, `useAdminRevenue`) return the raw `null` to the component. Components compensate with `a ?? null`, `r ?? null`, etc. This is fragile — a single missed guard causes `undefined.toLocaleString()` crashes. **Recommend:** either always provide a `select` that defaults nulls, or change `requestData` to throw on null data for non-nullable types.

---

## Appendix A — Endpoint quick reference (by domain)

| Domain | Endpoints | Auth |
|--------|-----------|------|
| Auth | login, register, forgot, reset, me, logout, refresh | None / Bearer |
| Analytics | overview | Bearer |
| Transactions | list, stats, detail | Bearer |
| Wallets | list, movements, swap, deposit, payout | Bearer |
| Risk | profile | Bearer |
| Customers | list | Bearer |
| Products | list, create, remove | Bearer |
| Stores | list | Bearer |
| Payment Links | list | Bearer |
| Invoices | list | Bearer |
| Subscriptions | list | Bearer |
| API Keys | list, create, revoke | Bearer |
| Webhooks | list, create, remove | Bearer |
| Treasury | overview | Bearer |
| Checkout | createSession, loadSession | API Key / Public |
| KYC | status | Bearer |
| Admin | treasury, merchants, setMerchantStatus, kycQueue, kycDecision, health, revenue | Bearer (admin) |

## Appendix B — Hook → endpoint → component matrix

| Hook | Endpoint | Consumed by |
|------|----------|-------------|
| `useAnalyticsOverview` (`queries.ts:8`) | `analytics/overview` | `merchant/dashboard.tsx`, `merchant/analytics.tsx`, `admin/admin-analytics.tsx` |
| `useRiskProfile` (`queries.ts:13`) | `risk/profile` | `merchant/dashboard.tsx`, `merchant/risk.tsx` |
| `useTreasury` (`queries.ts:18`) | `treasury/overview` | `merchant/treasury.tsx` |
| `useWallets` (`queries.ts:23`) | `wallets` | `merchant/dashboard.tsx`, `merchant/wallets.tsx`, `merchant/treasury.tsx`, `merchant/fx.tsx`, `admin/admin-treasury.tsx` |
| `useWalletsSummary` (`queries.ts:30`) | `wallets` | **none — orphan** |
| `useWalletMovements` (`queries.ts:37`) | `wallets/movements` | `merchant/wallets.tsx`, `merchant/treasury.tsx`, `merchant/fx.tsx` |
| `useWalletSwap` (`queries.ts:44`) | `wallets/swap` | `merchant/wallets.tsx`, `merchant/fx.tsx` |
| `useWalletDeposit` (`queries.ts:52`) | `wallets/deposit` | `merchant/wallets.tsx` |
| `useWalletPayout` (`queries.ts:60`) | `wallets/payout` | `merchant/wallets.tsx` |
| `useTransactions` (`queries.ts:70`) | `transactions` | `merchant/payments.tsx`, `merchant/dashboard.tsx`, `merchant/customers.tsx` |
| `useTransactionStats` (`queries.ts:73`) | `transactions/stats` | **none — orphan** |
| `useCustomers` (`queries.ts:78`) | `customers` | `merchant/customers.tsx` |
| `useProducts` (`queries.ts:83`) | `products` | `merchant/products.tsx` |
| `useStores` (`queries.ts:86`) | `stores` | `merchant/stores.tsx` |
| `usePaymentLinks` (`queries.ts:89`) | `payment-links` | `merchant/payment-links.tsx` |
| `useInvoices` (`queries.ts:92`) | `invoices` | `merchant/invoices.tsx` |
| `useSubscriptions` (`queries.ts:95`) | `subscriptions` | `merchant/subscriptions.tsx` |
| `useApiKeys` (`queries.ts:100`) | `api-keys` | `merchant/api-keys.tsx` |
| `useWebhooks` (`queries.ts:103`) | `webhooks` | `merchant/webhooks.tsx` |
| `useAdminMerchants` (`queries.ts:108`) | `admin/merchants` | `admin/admin-dashboard.tsx`, `admin/admin-merchants.tsx`, `admin/admin-revenue.tsx`, `admin/admin-analytics.tsx`, `admin/admin-risk.tsx` |
| `useAdminKyc` (`queries.ts:111`) | `admin/kyc` | `admin/admin-dashboard.tsx`, `admin/admin-kyc.tsx`, `admin/admin-compliance.tsx` |
| `useAdminTreasury` (`queries.ts:114`) | `admin/treasury/overview` | `admin/admin-dashboard.tsx`, `admin/admin-treasury.tsx` |
| `useAdminHealth` (`queries.ts:117`) | `admin/health` | `admin/admin-dashboard.tsx`, `admin/admin-health.tsx` |
| `useAdminRevenue` (`queries.ts:120`) | `admin/revenue` | `admin/admin-dashboard.tsx`, `admin/admin-revenue.tsx` |

---

**End of document.**
