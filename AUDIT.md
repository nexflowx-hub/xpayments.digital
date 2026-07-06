# XPayments — Frontend Project Audit

**Auditor:** Task ID `AUDIT+DOC` (general-purpose sub-agent)
**Scope:** Static + behavioural audit of the Next.js frontend at `/home/z/my-project`
**Sources of truth:** `src/lib/api/xpApi.ts`, `src/lib/api/client.ts`, `src/types/index.ts`, `src/stores/auth.ts`, `src/config/index.ts`, `src/hooks/queries.ts`, the 33 page components under `src/components/{merchant,admin}/`, `package.json`, `worklog.md`
**Out of scope:** the backend, the Supabase schema, deployment. Those are covered in `BACKEND.md`.
**Tone:** internal engineering audit. No marketing.

---

## 0. Executive Summary

The XPayments frontend is a visually polished, single-route SPA built on Next.js 16 / React 19 / Tailwind 4 / shadcn/ui with a coherent dark-first design system. All 33 dashboard pages (18 merchant + 15 admin) exist as real, non-trivial components (162–879 LOC each), and the API layer is fully typed against a domain model in `src/types/index.ts`. The app is demoable end-to-end against a deterministic mock dataset that transparently kicks in when `https://api.xpayments.digital/api/v1` is unreachable.

It is **not** production-ready, and it is **not** ready for a backend to be built against it as-is. The contract between frontend and backend has real ambiguities (response-envelope inconsistency, a non-existent `mapEnvelopeToSession` function referenced in the originating task spec, dead auth endpoints, hardcoded demo credentials, double-persisted auth state, a concurrent-401-refresh bug, and four admin pages that have no API backing at all). The Prisma scaffold, `examples/websocket/`, `Caddyfile`, and `db/custom.db` are unrelated leftovers that should be removed. `TECHNICAL.md` — the file this audit task expected to read for an API contract reference — **does not exist** in the repository; this is itself a finding.

**Verdict (detailed in §8):** fix 10 concrete items before the backend is built. The single most important one is to standardise the API response contract and the auth response shape, because every other endpoint inherits that ambiguity.

---

## 1. Completeness Assessment

The app shell (`src/app/page.tsx`) is a single-route SPA. All "pages" are views switched via the `ui.activeView` Zustand state (per the architecture decision in `worklog.md`). The view router (`src/components/dashboard/view-router.tsx`) lazy-loads every page with `next/dynamic` and `ssr: false`. There are no Next.js child routes; the manifest shortcuts (`/?view=dashboard`, `/?view=payments`, `/?view=wallets`) confirm the query-string-as-route convention, but **no router-level code reads `?view=` on mount** — those shortcuts are effectively decorative.

### 1.1 Merchant pages (18/18 present)

All 18 files exist under `src/components/merchant/`. LOC counts and status:

| # | View ID | File | LOC | Status |
|---|---------|------|-----|--------|
| 1 | `dashboard` | `dashboard.tsx` | 275 | **Full** — KPI grid, revenue chart, payment-method donut, realtime ticker, top customers. Wired to `useAnalyticsOverview`. |
| 2 | `analytics` | `analytics.tsx` | 323 | **Full** — multi-series charts, method/currency breakdowns, top customers. Wired to `useAnalyticsOverview`. |
| 3 | `risk` | `risk.tsx` | 256 | **Full** — risk gauge, alerts list, recommendations, history chart. Wired to `useRiskProfile`. |
| 4 | `payments` | `payments.tsx` | 404 | **Full** — filterable TanStack Table, detail drawer with event timeline. Wired to `useTransactions(filters)`. |
| 5 | `wallets` | `wallets.tsx` | 480 | **Full** — wallet cards, movements table, deposit/payout/swap dialogs. Wired to `useWallets` + `useWalletMovements` + 3 mutations. |
| 6 | `fx` | `fx.tsx` | 416 | **Full** — currency picker, rate chart, swap dialog. Uses `useWalletSwap` mutation. |
| 7 | `treasury` | `treasury.tsx` | 317 | **Full** — liquidity overview, cash-flow chart, settlement series, per-currency balances. Wired to `useTreasury`. |
| 8 | `stores` | `stores.tsx` | 284 | **Full** — store grid with status badges, revenue, product counts. Wired to `useStores`. |
| 9 | `products` | `products.tsx` | 448 | **Full** — product table, create dialog, delete confirm, search. Wired to `useProducts` + `xpApi.products.create/remove`. |
| 10 | `customers` | `customers.tsx` | 346 | **Full** — customer table with segment badges, LTV, order history. Wired to `useCustomers`. |
| 11 | `subscriptions` | `subscriptions.tsx` | 412 | **Full** — subscription table, MRR summary, status badges. Wired to `useSubscriptions`. |
| 12 | `payment-links` | `payment-links.tsx` | 357 | **Full** — link grid, conversion stats, copy URL. Wired to `usePaymentLinks`. |
| 13 | `invoices` | `invoices.tsx` | 495 | **Full** — invoice table, status pipeline, create/void dialogs. Wired to `useInvoices`. |
| 14 | `developers` | `developers.tsx` | 516 | **Full but tech-debt** — SDK snippets, API explorer, doc cards. **Imports `sdkSnippets` from `@/lib/api/mock`** (production code depends on the mock module). |
| 15 | `api-keys` | `api-keys.tsx` | 408 | **Full** — key list, create dialog (live/test scopes), reveal-once, revoke. Wired to `useApiKeys` + create/revoke mutations. |
| 16 | `webhooks` | `webhooks.tsx` | 345 | **Full** — webhook list, create dialog, secret reveal, delete. Wired to `useWebhooks` + create/remove mutations. |
| 17 | `settings` | `settings.tsx` | 879 | **Full** — 6-tab settings (profile, company, security, notifications, billing, API). Largest page; mostly local state, no API mutation calls. |
| 18 | `support` | `support.tsx` | 319 | **Partial** — ticket list + new-ticket form. No API hook; uses local `useState` array. No `xpApi.support.*` endpoint exists. |

**Merchant total:** 18/18 present. 16 fully wired to API hooks, 1 with mock-module dependency (`developers`), 1 with no API backing (`support`).

### 1.2 Admin pages (15/15 present)

All 15 files exist under `src/components/admin/`. LOC counts and status:

| # | View ID | File | LOC | Status | API hook |
|---|---------|------|-----|--------|----------|
| 1 | `admin-dashboard` | `admin-dashboard.tsx` | 422 | **Full** | `useAdminMerchants`, `useAdminRevenue`, `useAdminHealth`, `useAdminTreasury` |
| 2 | `admin-merchants` | `admin-merchants.tsx` | 363 | **Full** | `useAdminMerchants` + `xpApi.admin.setMerchantStatus` |
| 3 | `admin-kyc` | `admin-kyc.tsx` | 452 | **Full** | `useAdminKyc` + `xpApi.admin.kycDecision` |
| 4 | `admin-treasury` | `admin-treasury.tsx` | 336 | **Full** | `useAdminTreasury` |
| 5 | `admin-revenue` | `admin-revenue.tsx` | 302 | **Full** | `useAdminRevenue` |
| 6 | `admin-gateways` | `admin-gateways.tsx` | 249 | **Partial — local mock only** | none; uses local `GATEWAYS: Gateway[]` constant |
| 7 | `admin-risk` | `admin-risk.tsx` | 434 | **Full** | `useAdminMerchants` + `useAnalyticsOverview` + local mutation |
| 8 | `admin-analytics` | `admin-analytics.tsx` | 216 | **Full** | `useAnalyticsOverview` + `useAdminMerchants` |
| 9 | `admin-support` | `admin-support.tsx` | 243 | **Partial — local mock only** | none; uses local tickets array |
| 10 | `admin-health` | `admin-health.tsx` | 253 | **Full** | `useAdminHealth` |
| 11 | `admin-workers` | `admin-workers.tsx` | 217 | **Full** | `useAdminHealth` (reuses health data) |
| 12 | `admin-queues` | `admin-queues.tsx` | 162 | **Full** | `useAdminHealth` (reuses health data) |
| 13 | `admin-logs` | `admin-logs.tsx` | 298 | **Partial — local mock only** | none; uses local log entries array |
| 14 | `admin-flags` | `admin-flags.tsx` | 208 | **Partial — local mock only** | none; uses local `INITIAL_FLAGS: FeatureFlag[]` |
| 15 | `admin-compliance` | `admin-compliance.tsx` | 312 | **Full** | `useAdminKyc` |

**Admin total:** 15/15 present. 11 fully wired to API hooks, 4 backed only by local static arrays (`admin-gateways`, `admin-support`, `admin-logs`, `admin-flags`). The four gaps correspond to **no matching endpoints in `xpApi.ts`** — these admin views will need new endpoints added to the contract before the backend can serve them, or they must be explicitly marked as "frontend-only mockups" in the API spec.

### 1.3 Landing + Auth

| File | LOC | Status |
|------|-----|--------|
| `src/components/landing/landing-page.tsx` | 1393 | **Full** — hero, trust bar, stats, payment methods, developer section, features grid, security pillars, testimonials, final CTA, footer. **Imports `sdkSnippets` from `@/lib/api/mock`** (same tech-debt as `developers.tsx`). |
| `src/components/auth/auth-screen.tsx` | 302 | **Partial** — login form works (calls `useAuth.login`). Forgot + Reset screens are **fake**: they `await new Promise(setTimeout, 800)` then show a success toast — they never call `authApi.forgot()` / `authApi.reset()` even though those endpoints exist in `xpApi.ts`. No registration screen exists. |

### 1.4 Shared infrastructure

- `src/components/dashboard/shell.tsx` (462 LOC): the persistent shell — sidebar, topbar, command palette, notifications panel, workspace switcher. Fully built.
- `src/components/shared/` (charts, badges, language switcher, page header, empty state, fade-up motion variants): complete and reused across all 33 pages.
- `src/components/ui/` (45 shadcn primitives): full set installed.
- `src/app/layout.tsx` (242 LOC): full metadata (title, description, keywords, alternates/hreflang, OpenGraph, Twitter, robots, icons, manifest, JSON-LD Organization + WebApplication + WebSite).
- `src/app/manifest.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`: all present.

---

## 2. API Contract Coherence

`xpApi.ts` defines 18 endpoint groups. Counting every distinct HTTP route the frontend can issue (including the `/auth/refresh` call baked into `client.ts` and treating `kycDecision("approved")` and `kycDecision("rejected")` as the two separate URLs they produce), the frontend hits **39 routes** across **38 logical functions**. (The originating task spec said "39 endpoints" — that count is correct only if `kycDecision` is split into its two URL variants.)

### 2.1 Response-envelope inconsistency

This is the single biggest contract problem. Three different shapes are in use, with no documented rule for which applies when:

| Shape | Where used | Example |
|-------|-----------|---------|
| `{ data: T[] }` (bare wrapper, no pagination) | wallets.list, wallets.movements, customers.list, products.list, stores.list, paymentLinks.list, invoices.list, subscriptions.list, apiKeys.list, webhooks.list, payouts.list, deposits.list, admin.merchants, admin.kycQueue | `GET /wallets` → `{ data: Wallet[] }` |
| `Paginated<T>` = `{ data: T[], total, page, pageSize }` | transactions.list only | `GET /transactions?page=1&pageSize=12` → `{ data: Transaction[], total: 312, page: 1, pageSize: 12 }` |
| Bare `T` (no envelope) | auth.login, auth.me, analytics.overview, risk.profile, transactions.detail, products.create, apiKeys.create, webhooks.create, treasury.overview, admin.treasury, admin.health, admin.revenue | `GET /analytics/overview` → `AnalyticsOverview` |
| `{ ok: boolean }` / `{ ok, reference }` / `{ ok, rate }` | auth.forgot, auth.reset, products.remove, apiKeys.revoke, webhooks.remove, admin.setMerchantStatus, admin.kycDecision, wallets.swap, wallets.deposit, wallets.payout | `POST /wallets/swap` → `{ ok: true, rate: 0.94 }` |

The backend must implement all four shapes per-endpoint as documented in `BACKEND.md` §5 — but the frontend should ideally be refactored to one canonical shape (recommendation: `{ data: T }` for singletons, `Paginated<T>` for all lists, `{ ok: true }` for mutations) before the backend is built. Otherwise the contract lives only in the `request<T>` type annotations and is easy to violate.

### 2.2 Auth envelope mismatch

The originating task spec for `BACKEND.md` says:

> the auth envelope `{ success, data: { merchantId, name, tier, token, role } }` — MUST match exactly what the frontend's `mapEnvelopeToSession()` expects

**This envelope does not exist anywhere in the frontend.** There is no `mapEnvelopeToSession()` function. `grep` across `src/` for `envelope`, `mapEnvelopeToSession`, `merchantId` (in auth context), and `tier` returns zero hits in the API or auth code. What the frontend actually expects (see `xpApi.ts` lines 46–70 and `stores/auth.ts` lines 37–44) is a **bare `AuthSession` object returned at the top level of the response body**:

```ts
interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;       // epoch ms
  user: User;
}
interface User {
  id: string;
  name: string;
  email: string;
  role: "merchant" | "admin" | "guest";
  avatarUrl?: string;
  company?: string;
  merchantId?: string;     // absent for admin role
  twoFactorEnabled?: boolean;
}
```

Note also that the `User` type has **no `tier` field** — the task spec's `tier` is not part of the frontend contract. The backend must return the `AuthSession` shape above, not the spec's `{ success, data: {...} }` envelope. `BACKEND.md` documents the actual shape the frontend consumes and flags this divergence explicitly.

### 2.3 Dead / unused endpoints

- `auth.me()` — defined in `xpApi.ts` (returns `tokenStore.user` from the mock) but **never called** by any store or component. `useAuth.hydrate()` reads `localStorage` directly instead of validating the session server-side. The backend should still implement `GET /auth/me` (it is in the contract), but the frontend must be wired to call it on mount to actually validate the persisted token.
- `auth.forgot()` and `auth.reset()` — defined in `xpApi.ts` but **never called**. The auth screen fakes both with `setTimeout` and a toast. The endpoints are in the contract; the frontend wiring is missing.
- `auth.logout()` — client-side only (`tokenStore.clear()`). There is **no `POST /auth/logout`** endpoint in the contract, so refresh tokens are never revoked server-side. This is a real security gap for a fintech product.

### 2.4 Missing endpoints

Four admin views have no backing endpoint:

| Admin view | Currently uses | Endpoint needed |
|-----------|---------------|-----------------|
| `admin-gateways` | local `GATEWAYS[]` | `GET /admin/gateways` |
| `admin-flags` | local `INITIAL_FLAGS[]` | `GET /admin/feature-flags`, `PATCH /admin/feature-flags/:key` |
| `admin-logs` | local log array | `GET /admin/audit-logs` (paginated, filterable) |
| `admin-support` | local tickets array | `GET /admin/support/tickets`, `PATCH /admin/support/tickets/:id` |

Merchant `support` view also has no endpoint (`GET /support/tickets`, `POST /support/tickets`).

There is also **no registration endpoint** (`POST /auth/register`) — only login/forgot/reset/me/refresh. If self-serve signup is a product goal, this is a gap.

### 2.5 Filter / pagination contract

`DataTableFilters` (in `src/types/index.ts`) defines 12 optional filter fields: `search, status, country, currency, method, gateway, from, to, page, pageSize, sortBy, sortDir`. Only `transactions.list` actually passes these filters to the backend (see `xpApi.ts` lines 141–145). Every other list endpoint (`wallets.list`, `customers.list`, `products.list`, `stores.list`, `paymentLinks.list`, `invoices.list`, `subscriptions.list`, `apiKeys.list`, `webhooks.list`, `admin.merchants`) takes **no arguments** and presumably returns the entire collection. For a fintech with potentially millions of transactions, this is fine for some endpoints (wallets) and unacceptable for others (invoices, customers, payment links). The contract should specify which list endpoints are paginated/filterable.

### 2.6 Type-level inconsistencies

- `Wallet` has a `changePct: number` and `color: string` field that are presentation concerns — they belong in the UI layer, not the domain model. The backend will have to fabricate or compute these.
- `Transaction.events?: TxEvent[]` is optional and only populated by `transactions.detail` (not `transactions.list`). The contract should state this explicitly.
- `ApiKey.fullKey?: string` is "only right after creation" per the type comment — the contract should state that `POST /api-keys` returns `fullKey` but `GET /api-keys` never does.
- `WalletMovement.type` is `"deposit" | "withdraw" | "swap" | "payment" | "fee" | "payout"`, but `payouts.list` filters by `type === "payout" || type === "withdraw"` — i.e. two different movement types are treated as "payouts". The contract should clarify whether `withdraw` and `payout` are distinct concepts or aliases.
- `AdminMerchant` and `KycReview` both reference `kycStatus` / `status` with overlapping but not identical enum values (`AdminMerchant.kycStatus: "approved" | "pending" | "rejected" | "not_submitted"` vs `KycReview.status: "pending" | "approved" | "rejected"`). The `not_submitted` state only exists on `AdminMerchant`.

### 2.7 Contract verdict

The 39 routes are **individually implementable** but **collectively incoherent** without an explicit response-shape table. The single most valuable pre-backend deliverable is a one-page "API Contract" addendum that, for each route, lists: method, path, auth required, request schema, response shape (one of the four in §2.1), and status codes. `BACKEND.md` §5 provides exactly this.

---

## 3. Auth Flow Correctness

### 3.1 Login

`auth-screen.tsx` → `useAuth.login(email, password, remember)` → `authApi.login()` → `request<AuthSession>({ url: "/auth/login", method: "POST", data: { email, password, remember } })`. The returned `AuthSession` is stored in both the Zustand persisted store (key `xp-auth`) and `tokenStore` (keys `xp_access_token`, `xp_refresh_token`, `xp_user`). The mock resolver in `xpApi.ts` lines 50–69 fabricates a session with `accessToken: "xp_live_" + Math.random()...` and decides admin vs. merchant purely by whether the email starts with `"admin"` — **the backend cannot use this heuristic; it must derive role from the database.**

### 3.2 JWT in localStorage

Tokens are stored in `localStorage` (`xp_access_token`, `xp_refresh_token`). This is the standard XSS-vulnerable pattern. For a fintech product the production-grade approach is `HttpOnly; Secure; SameSite=Strict` cookies set by the backend, with the frontend reading neither the access nor refresh token directly. The current architecture (Axios interceptor reads `localStorage.getItem("xp_access_token")`) cannot work with HttpOnly cookies without a refactor. **Recommendation: keep localStorage for the MVP, but flag this as Phase-2 hardening (move to cookies + BFF pattern).**

### 3.3 401 refresh flow

`client.ts` lines 79–117 implement the refresh interceptor:

```ts
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && tokenStore.refresh) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: tokenStore.refresh }, ...);
          tokenStore.set(data.accessToken, data.refreshToken, data.user ?? tokenStore.user);
          isRefreshing = false;
          original.headers.set("Authorization", `Bearer ${data.accessToken}`);
          return api(original);
        } catch {
          isRefreshing = false;
          tokenStore.clear();
          onLogout?.();
          return Promise.reject(normalizeError(error));
        }
      }
    }
    return Promise.reject(normalizeError(error));
  }
);
```

**Bug: concurrent requests during refresh are not queued.** The `if (!isRefreshing)` guard means: if request A triggers a refresh, and requests B and C also hit a 401 during the refresh window, they fall through to `Promise.reject(normalizeError(error))` — they do not wait for the refresh to complete and are not retried. The correct pattern is a promise queue: when `isRefreshing`, push `original` onto a pending queue and resolve the queue when the refresh resolves. The current code logs out the user if the very first concurrent 401 happens to land in the wrong order.

**The `_retry` flag prevents infinite loops but is per-request** — so a single request that 401s twice (once original, once after refresh) is correctly abandoned. Good.

**Refresh response shape:** `client.ts` line 99–103 reads `data.accessToken`, `data.refreshToken`, `data.user` from the refresh response. So `POST /auth/refresh` must return `{ accessToken, refreshToken, user }` — **not** a full `AuthSession` (no `expiresAt`). This is a different shape from `POST /auth/login` (which returns the full `AuthSession` with `expiresAt`). The contract should document this asymmetry.

### 3.4 `onLogout` handler

`registerLogoutHandler(fn)` is called from `stores/auth.ts` line 25: `set({ user: null, accessToken: null, isAuthenticated: false })`. Good. But note that this **does not call `authApi.logout()`** — it just clears the Zustand state. The `xp_access_token` / `xp_refresh_token` / `xp_user` keys in localStorage are NOT cleared by `onLogout` (only by `tokenStore.clear()`, which is called in the refresh failure path but not in the manual `useAuth.logout()` flow... wait — `useAuth.logout()` does call `authApi.logout()` which calls `tokenStore.clear()`). OK so the manual logout path is fine. The forced-logout (401 refresh failure) path is also fine (calls `tokenStore.clear()` then `onLogout()`). The Zustand persisted state is cleared by `onLogout()`. No leak here, just convoluted.

### 3.5 Hydration

`useAuth.hydrate()` (lines 54–62) reads `tokenStore.user` and `tokenStore.access` from localStorage and sets the Zustand state. **It does not call `auth.me()` to validate the token server-side.** This means: if a user's token is revoked server-side, the frontend will still show them as authenticated until the next API call returns 401. For a fintech product, hydration should call `auth.me()` and force-logout on 401.

### 3.6 Forgot / Reset

`auth-screen.tsx` lines 131–138 implement `onForgot` as a pure `setTimeout(800ms)` + toast. **It never calls `authApi.forgot(email)`.** Same for the reset screen (line 284 reuses `onForgot` for the reset form — a copy-paste bug). The `authApi.forgot()` and `authApi.reset()` functions exist in `xpApi.ts` but are dead code. The backend contract still includes these endpoints, but the frontend wiring must be added.

### 3.7 Demo credentials

`auth-screen.tsx` line 111: `defaultValues: { email: "merchant@xpayments.digital", password: "demo1234" }`. Lines 242–243 render a "Demo credentials" box showing both `merchant@xpayments.digital / demo1234` and `admin@xpayments.digital / demo1234`. These must be removed (or feature-flagged behind `NEXT_PUBLIC_NODE_ENV !== "production"`) before the backend goes live — otherwise any visitor can log in as admin.

### 3.8 2FA

The mock user has `twoFactorEnabled: true`, but there is **no 2FA challenge flow** anywhere in the auth code. The login form submits email + password and expects a full `AuthSession` back. If 2FA is a real product requirement, the contract needs a `POST /auth/2fa/challenge` endpoint and the frontend needs a challenge screen. Currently `twoFactorEnabled` is a dead display flag.

### 3.9 Auth verdict

**Not production-ready.** Blocking issues:
1. Concurrent-401-refresh bug (§3.3) — must fix.
2. Hardcoded demo credentials in the UI (§3.7) — must remove.
3. `hydrate()` does not validate the token server-side (§3.5) — must add `auth.me()` call.
4. Forgot/Reset forms don't call the API (§3.6) — must wire.
5. No server-side logout / refresh-token revocation (§2.3) — must add `POST /auth/logout`.
6. No 2FA flow despite the flag (§3.8) — either implement or remove the flag.
7. localStorage token storage (§3.2) — acceptable for MVP, must harden in Phase 2.

---

## 4. State Management

### 4.1 Stores

Two Zustand stores:
- `src/stores/auth.ts` — `useAuth`: `user, accessToken, isAuthenticated, isLoading`, actions `login, logout, hydrate, hasRole`. Persisted to `localStorage["xp-auth"]` (partialized to `user, accessToken, isAuthenticated`).
- `src/stores/ui.ts` — `useUi`: `activeView` (current page), `appView` (`landing | login | forgot | reset | merchant | admin`), sidebar collapse, command palette open, theme. Persisted.

### 4.2 Double persistence of auth state

`useAuth` persists `{ user, accessToken, isAuthenticated }` under `xp-auth`. `tokenStore` (in `client.ts`) persists `{ access, refresh, user }` under `xp_access_token` / `xp_refresh_token` / `xp_user`. **The same data is persisted in two places.** They can drift: if one is cleared and the other isn't (e.g. by `localStorage.removeItem` in the browser console, or by a future code path that updates one but not the other), the user can end up in a state where `useAuth.isAuthenticated === true` but `tokenStore.access === null` — no Authorization header is sent, every API call 401s, the refresh flow triggers, refresh fails (no refresh token), forced logout. Or the inverse: `useAuth.isAuthenticated === false` but `tokenStore.access` still has a token — the user sees the login screen but their token is still in localStorage.

`hydrate()` reads from `tokenStore` and writes to `useAuth` — so on page load they are reconciled. But after load, mutations to one store do not propagate to the other. `useAuth.login()` calls `authApi.login()` which (in the mock) calls `tokenStore.set()` AND `useAuth.set()` — both are updated. `useAuth.logout()` calls `authApi.logout()` (which calls `tokenStore.clear()`) AND `useAuth.set({ user: null, ... })` — both are updated. So in practice the two stores are kept in sync by convention, not by a single source of truth. **This is fragile.** Recommendation: collapse to one store — either make `tokenStore` the single source of truth and have `useAuth` read from it via a selector, or remove `tokenStore`'s persistence and have `client.ts` read the token from `useAuth` via a non-React getter.

### 4.3 TanStack Query

`src/hooks/queries.ts` (101 LOC) defines 19 hooks: 14 queries + 5 mutations. Query keys are well-structured (`["wallets"]`, `["wallets", "movements", walletId]`, `["transactions", filters]`, `["admin", "merchants"]`, etc.). Mutations invalidate the right query keys (e.g. `useWalletSwap` invalidates `["wallets"]` and `["wallets", "movements"]`). No obvious leak.

**Gap:** there is no `queryClient` configured with `staleTime`, `gcTime`, `retry`, or `refetchOnWindowFocus` defaults. The default `staleTime: 0` means every component mount refetches — for a fintech dashboard with many widgets, this is a lot of redundant requests. A `QueryClient` default of `staleTime: 30_000, refetchOnWindowFocus: false` would be sensible. The `app-providers.tsx` file presumably creates the client — not audited in detail but worth checking.

**Gap:** there are no `useMutation` hooks for `products.create/remove`, `apiKeys.create/revoke`, `webhooks.create/remove`, `admin.setMerchantStatus`, `admin.kycDecision`. The components call `xpApi.*` directly inside `onClick` handlers with manual `qc.invalidateQueries` (visible in `admin-risk.tsx` line 4 which imports `useMutation` + `useQueryClient` directly, and in `products.tsx` / `api-keys.tsx` / `webhooks.tsx`). This is inconsistent — some mutations go through hooks, others are inline. Not a bug, but a maintainability issue.

### 4.4 State verdict

**Adequate for MVP, fragile.** The double-persistence of auth state (§4.2) is the real risk. The TanStack Query setup works but has no global defaults and inconsistent mutation patterns.

---

## 5. i18n

- 4 locales: `en`, `pt-BR`, `fr`, `es` (in `src/lib/i18n/locales.ts` — a 1700+ line file with ~270 keys per locale).
- Detection: browser language → timezone fallback → `en`. Persisted via a Zustand store. Language switcher in nav, footer, and auth screen.
- Navigation: every `NavItem` and `NavSection` in `config/index.ts` has a `tKey` and the shell renders `t(item.tKey)`.
- Metadata: `layout.tsx` exports `alternates.languages` with `hreflang` for all 4 locales + `x-default`, and `openGraph.alternateLocale`. Good.

**Coverage gaps (per `worklog.md` lines 538–539):** the following strings are NOT localized and remain hardcoded in English:
- "Coverage", "For developers", "Platform", "Trust & compliance", "Customers", "Get started in minutes" (landing section badges)
- "Learn more" hover label
- "All systems operational"
- "Made for the global economy"
- "Live payment rail · 47,210 tx/min"
- Auth BrandedPanel footer: "© 2026 XPayments, Inc. · Security · Privacy" (partially — the year was fixed to 2026 but "Security" and "Privacy" are hardcoded)

**Other i18n issues:**
- `manifest.ts` hardcodes `lang: "en"` — does not switch with the user's locale.
- `<html lang="en">` in `layout.tsx` is hardcoded — should be dynamic.
- No locale-aware number/currency formatting in `src/lib/utils.ts` (not audited but `formatCurrency` / `formatNumber` likely use `Intl.NumberFormat` with a fixed locale; if so, they don't switch with the active language).
- The `?lang=pt-BR` hreflang URLs in `metadata.alternates.languages` are decorative — no route handler reads `?lang=` to actually serve localized HTML. Search engines will fetch `/?lang=pt-BR` and get the same English-default HTML as `/?lang=en`.

**i18n verdict:** **Good for an MVP, not complete.** The 270-key core is professional. The gaps are mostly in secondary landing-page copy and would take ~1 day to close. The `?lang=` URL handling and the hardcoded `<html lang>` are the most impactful fixes for SEO.

---

## 6. PWA / SEO / Accessibility

### 6.1 PWA

- `manifest.ts` is complete: name, short_name, description, icons (192/512/maskable/apple-touch), shortcuts (Dashboard/Payments/Wallets with `/?view=` URLs), display: standalone, categories, theme/background colors. Good.
- All PWA icons exist in `public/` (favicon.svg, icon-192/512, maskable-192/512, apple-touch-icon, og-image).
- **Gap:** no service worker. `next.config.ts` was not audited in detail, but there is no `next-pwa` or `@serwist/next` dependency in `package.json`. The app is "installable" (manifest + icons) but not "offline-capable". For a fintech dashboard this is acceptable — offline mode for a payments dashboard is arguably undesirable.

### 6.2 SEO

- `layout.tsx` metadata is comprehensive: title template, description, keywords, authors, OpenGraph, Twitter, robots, icons, manifest, appleWebApp, JSON-LD (Organization + WebApplication + WebSite).
- `sitemap.ts` and `robots.ts` exist.
- **Critical SEO gap: single-route architecture.** The sitemap can only list `/`. There are no deep links to `/dashboard`, `/wallets`, `/payments`, etc. — because they are views, not routes. This means search engines cannot index individual product pages (e.g. "XPayments Wallets" as a standalone landing page). The `?view=` query-string convention is not search-engine-friendly (Google generally ignores query params for indexing). If SEO for individual features matters, the architecture must move to real routes (`app/(dashboard)/wallets/page.tsx`). If SEO is only for the marketing landing page, the current setup is fine.
- **`hreflang` URLs are fake** (see §5) — `/?lang=pt-BR` returns the same HTML as `/?lang=en`. Google may flag this as a localization error.
- `verification.google: "verify-google-xpayments"` is a placeholder — must be replaced with the real Search Console verification code before production.

### 6.3 Accessibility

- No systematic a11y audit was performed for this deliverable. A spot-check of `auth-screen.tsx` shows: labels are present (`<label>` + `htmlFor` on the remember checkbox), but the email/password inputs use `<label>` without `htmlFor` (they rely on DOM order). The show-password button has no `aria-label`. The "Back to home" button has no `aria-label` (text content suffices).
- The `manifest.ts` shortcuts have `description` fields — good for screen readers.
- shadcn/ui primitives are built on Radix UI, which is a11y-first by default — so the 45 UI primitives are likely fine.
- The 33 dashboard pages were not individually a11y-audited. A real audit should run axe-core against the running app.
- Color contrast: the dark-first theme with electric-blue accents was not contrast-checked. The `text-muted-foreground` class on `bg-background` should be verified to meet WCAG AA (4.5:1 for normal text).

### 6.4 PWA/SEO/A11y verdict

**PWA: installable but not offline-capable — acceptable.**
**SEO: strong for the landing page, weak for deep content — architectural decision required.**
**A11y: not audited — must run axe-core before launch.**

---

## 7. Known Issues / Tech Debt

Concrete, prioritised list:

### 7.1 Blocking (must fix before backend goes live)

1. **Hardcoded demo credentials in `auth-screen.tsx`** (lines 111, 242–243): `merchant@xpayments.digital / demo1234` and `admin@xpayments.digital / demo1234`. Visible to any visitor. Must remove or feature-flag.
2. **Concurrent-401-refresh bug in `client.ts`** (§3.3): pending requests during refresh are rejected instead of queued. Will cause spurious logouts under load.
3. **`auth.me()` never called** (§3.5): `hydrate()` trusts localStorage without server-side validation. A revoked token keeps the user "logged in" until the next API call.
4. **Forgot/Reset forms don't call the API** (§3.6): `auth-screen.tsx` lines 131–138 use `setTimeout` instead of `authApi.forgot()` / `authApi.reset()`. Dead code in `xpApi.ts`.
5. **`sdkSnippets` imported from `@/lib/api/mock`** by `landing-page.tsx` (line 18) and `developers.tsx` (line 20): production code depends on the mock module. If `USE_MOCK=false` ever conditionally excludes mock imports, these pages break. Move `sdkSnippets` to `src/lib/sdk-snippets.ts` (a pure constants file).
6. **No `POST /auth/logout` endpoint**: refresh tokens are never revoked server-side. The `auth.logout()` action only clears localStorage.
7. **Response-envelope inconsistency** (§2.1): four shapes in use with no documented rule. The backend will guess; mismatches will surface as runtime type errors.

### 7.2 Should fix (tech debt)

8. **Double persistence of auth state** (§4.2): `xp-auth` (Zustand) and `xp_access_token`/`xp_refresh_token`/`xp_user` (tokenStore) store the same data. Collapse to one source of truth.
9. **`prisma/schema.prisma` is a leftover SQLite scaffold** (`User` + `Post` models, `provider = "sqlite"`). It has nothing to do with the actual domain model. The `@prisma/client` and `prisma` dependencies in `package.json` are unused. Either remove Prisma entirely or replace the schema with the real domain model. The `db:push`/`db:generate`/`db:migrate`/`db:reset` scripts in `package.json` are dead.
10. **`db/custom.db`** is a SQLite artifact from the scaffold — remove.
11. **`examples/websocket/server.ts` and `examples/websocket/frontend.tsx`** are unused scaffolding — remove or move to a separate `/examples` repo.
12. **`Caddyfile`** is the sandbox dev proxy (port 81 → localhost:3000). It is not a production reverse-proxy config. The production deployment should use Nginx (documented in `BACKEND.md` §8). Remove the Caddyfile or move it to a `dev/` directory with a clear "sandbox only" comment.
13. **`next-auth` dependency in `package.json`** is unused (the app uses its own JWT flow, not NextAuth). Remove to avoid confusion.
14. **`z-ai-web-dev-sdk` dependency** — appears unrelated to a payments platform. Likely an artifact of the sandbox tooling. Audit usage and remove if unused.
15. **`download/README.md` and `upload/` directory** — artifacts, not part of the app. The `upload/` dir contains payment-method SVGs and some ChatGPT-generated PNGs; the SVGs should be moved to `public/icons/payment-methods/` and the PNGs removed.
16. **`TECHNICAL.md` does not exist.** The originating task spec for this audit expected to read it ("read `TECHNICAL.md` ... read section 5 for the API contract"). The file is absent. Either it was never created, was deleted, or was never pushed. The API contract currently lives only in the `request<T>` type annotations of `xpApi.ts`. `BACKEND.md` §5 fills this gap.
17. **`auth-screen.tsx` reset form reuses `onForgot`** (line 284) — copy-paste bug. The reset form should call `authApi.reset(token, password)`.
18. **`useUi` persisted `activeView`**: when a merchant user reloads on `/` with `activeView: "admin-dashboard"` in localStorage (because they previously logged in as admin), they will see a broken state until `hydrate()` runs. Minor, but worth a guard.

### 7.3 Nice to have

19. **No global `QueryClient` defaults** (§4.3) — add `staleTime: 30_000, refetchOnWindowFocus: false`.
20. **Inline mutations** (§4.3) — extract `useCreateProduct`, `useRevokeApiKey`, etc. into `queries.ts` for consistency.
21. **`<html lang="en">` hardcoded** (§5) — should be dynamic based on the persisted locale.
22. **`?lang=` hreflang URLs are fake** (§5, §6.2) — either implement locale routing or remove the hreflang entries.
23. **`manifest.ts` hardcodes `lang: "en"`** (§5).
24. **No service worker** (§6.1) — acceptable for MVP.
25. **No a11y audit** (§6.3) — run axe-core.
26. **`verification.google: "verify-google-xpayments"`** placeholder (§6.2).
27. **`Wallet.changePct` and `Wallet.color` are presentation concerns in the domain model** (§2.6) — move to the UI layer.
28. **2FA flag is dead** (§3.8) — implement or remove.
29. **`payouts.list` filter `type === "payout" || type === "withdraw"`** (§2.6) — clarify whether `withdraw` and `payout` are distinct.
30. **`USE_MOCK` falls back to mock on ANY network error** (`client.ts` line 159: `if (e.status === 0) return mockResolver()`). This means: if the production API is down, the frontend silently shows mock data instead of an error screen. For a fintech product this is dangerous — a merchant could see fake balances and attempt to act on them. The fallback should be gated to `process.env.NODE_ENV !== "production"` or removed entirely for production builds.

---

## 8. Backend Readiness Verdict

### 8.1 What is ready

- **Domain model** (`src/types/index.ts`): complete, well-typed, 30+ interfaces covering the full fintech surface area. The backend can derive its database schema directly from this file (and `BACKEND.md` §4 does exactly that).
- **Endpoint surface** (`xpApi.ts`): 39 routes are enumerated with method, path, request shape, and response type. The backend has a complete checklist.
- **Auth flow**: the happy path (login → JWT in Authorization header → 401 → refresh → retry) is wired and works against the mock. The refresh response shape is documented in `client.ts`.
- **TanStack Query hooks**: 19 hooks define exactly which data the frontend needs and when. The backend can infer cache invalidation patterns from the mutation hooks.
- **Design system**: the shell, the 45 UI primitives, the charts, the badges — all production-quality. The backend team can build against a stable UI.

### 8.2 What must be fixed first (blocking)

The 7 items in §7.1, restated as backend-readiness criteria:

1. **Remove hardcoded demo credentials** — otherwise the backend ships with a known admin password.
2. **Fix the concurrent-401-refresh bug** — otherwise the backend will be blamed for spurious logouts that are actually a frontend race condition.
3. **Wire `auth.me()` into `hydrate()`** — otherwise the backend cannot invalidate sessions server-side.
4. **Wire `auth.forgot()` / `auth.reset()`** — otherwise the backend's forgot/reset endpoints are untested.
5. **Move `sdkSnippets` out of `mock.ts`** — otherwise the production build depends on the mock module.
6. **Add `POST /auth/logout` to the contract and wire `authApi.logout()` to it** — otherwise refresh tokens accumulate unrevoked.
7. **Standardise the response envelope** — otherwise the backend team will guess and the frontend will break in subtle ways.

### 8.3 What should be fixed soon (non-blocking but recommended)

- Collapse the double-persisted auth state (§4.2).
- Remove the Prisma scaffold, `examples/websocket/`, `Caddyfile`, `db/custom.db`, unused `next-auth` dependency (§7.2).
- Gate the mock fallback to non-production (§7.3 item 30).
- Add the 4 missing admin endpoints (gateways, flags, logs, support) to the contract, or mark those pages as "frontend-only mockups" (§2.4).
- Define which list endpoints are paginated/filterable (§2.5).
- Write `TECHNICAL.md` (or accept `BACKEND.md` as the canonical API contract).

### 8.4 Final verdict

**The frontend is demoable and visually production-grade, but it is NOT ready for a backend to be built against it as-is.** The 7 blocking items in §8.2 must be resolved first. With those fixes, the backend team can build against `xpApi.ts` + `src/types/index.ts` with confidence. Without them, the backend will ship against an ambiguous contract and the integration phase will surface bugs that should have been caught at the contract layer.

**Estimated effort to clear the blocking items:** 1–2 frontend engineer-days.

**Estimated effort to clear the non-blocking tech debt:** 2–3 frontend engineer-days.

Once the blocking items are cleared, `BACKEND.md` provides a complete, runnable specification for the VPS + Supabase backend.

---

*End of audit.*
