# XPayments — Project Specification

> **Single source of truth** for the XPayments frontend, backend API contract, and database schema. This document consolidates the former AUDIT.md, BACKEND.md, TECHNICAL.md, and README.md into one engineering reference.

---

## Table of Contents

**Part I: Frontend Architecture**
1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Available Features](#4-available-features)
5. [State Management](#5-state-management)
6. [Internationalization](#6-internationalization)
7. [PWA & Branding](#7-pwa--branding)
8. [Known Issues & Tech Debt](#8-known-issues--tech-debt)

**Part II: Backend API Contract**
9. [Base Configuration](#9-base-configuration)
10. [Response Envelopes](#10-response-envelopes)
11. [Authentication Flow](#11-authentication-flow)
12. [Complete Endpoint Reference](#12-complete-endpoint-reference)
13. [Error Handling](#13-error-handling)
14. [Security](#14-security)

**Part III: Backend & Database Specification**
15. [Architecture Overview](#15-architecture-overview)
16. [VPS Provisioning](#16-vps-provisioning)
17. [Supabase Database Setup](#17-supabase-database-setup)
18. [Database Schema (DDL)](#18-database-schema-ddl)
19. [Backend Implementation Guide](#19-backend-implementation-guide)
20. [Deployment](#20-deployment)
21. [Roadmap](#21-roadmap)

**Part IV: Getting Started**
22. [Prerequisites & Installation](#22-prerequisites--installation)
23. [Environment Variables](#23-environment-variables)
24. [Development Commands](#24-development-commands)
25. [Deployment](#25-deployment)

---

## Part I: Frontend Architecture

### 1. Overview

XPayments is an enterprise fintech SPA built on Next.js 16 (App Router, single `/` route). The app shell routes between Landing → Auth → Merchant Dashboard → Admin Dashboard via Zustand state. All views are lazy-loaded via `next/dynamic` for code-splitting. The design is dark-first electric-blue, targeting Stripe/Linear/Ramp-level quality.

**Competitor benchmark:** Stripe, Adyen, Checkout.com, Mercury, Wise, Airwallex, Ramp, Brex, Vercel, Linear.

### 2. Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js | 16.1.1 | App Router, single-route SPA |
| Language | TypeScript | 5.x | Strict typing throughout |
| UI | React | 19.x | |
| Styling | Tailwind CSS | 4.x | Dark-first electric-blue theme |
| Components | shadcn/ui (New York) | — | 45+ Radix primitives |
| Icons | lucide-react | 0.525.x | |
| Animation | Framer Motion | 12.23.2 | Page transitions, micro-interactions |
| Charts | Recharts | 2.15.4 | Area/Bar/Line/Donut |
| Tables | TanStack Table | 8.21.3 | |
| Server State | TanStack Query | 5.82.0 | 22 hooks, `select` guards |
| Client State | Zustand | 5.0.6 | 3 stores (auth, ui, i18n) |
| HTTP | Axios | 1.18.1 | JWT interceptor, 401 refresh queue |
| Forms | React Hook Form | 7.60.0 | Login + register forms |
| Validation | Zod | 4.0.2 | Schema validation |
| Theme | next-themes | 0.4.6 | Dark default |
| Toasts | Sonner | 2.0.6 | |
| i18n | Custom (Zustand) | — | 4 locales (EN/PT-BR/FR/ES) |
| Markdown | react-markdown | 10.1.0 | |
| Syntax | react-syntax-highlighter | 15.6.1 | |
| Package Manager | Bun | — | |

### 3. Architecture

#### 3.1 High-Level Architecture

```
Browser → SPA (/) → page.tsx
  ├─ LandingPage (dynamic import, ssr: false)
  ├─ AuthScreen (login / register / forgot / reset)
  └─ DashboardShell (merchant | admin)
       ├─ Sidebar (nav from config, i18n via tKey)
       ├─ TopBar (search, language, notifications, profile)
       ├─ ViewRouter (lazy-loaded views)
       │    └─ 18 merchant pages | 15 admin pages
       ├─ CommandPalette (⌘K)
       └─ NotificationsPanel
```

#### 3.2 Request Lifecycle

```
Component → useXxx() [TanStack Query]
  → xpApi.endpoint() [typed REST]
    → requestData<T>() [unwraps { success, data, message? } envelope]
      → api(config) [Axios instance]
        → Request interceptor: inject Authorization: Bearer <JWT>
        → HTTP request to https://api.xpayments.digital/api/v1/<route>
        → Response interceptor:
            401 on auth route → propagate (bad credentials)
            401 on protected → refresh queue → retry or forceLogout
        → requestData unwraps envelope.data → returns T
  → select: (d) => d ?? [] [guarantees array, never null]
  → Component renders data or EmptyState
```

#### 3.3 Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (metadata, JSON-LD, PWA, providers)
│   ├── page.tsx            # SPA router (landing/auth/merchant/admin)
│   ├── manifest.ts         # PWA manifest
│   ├── robots.ts           # robots.txt generator
│   ├── sitemap.ts          # sitemap.xml generator
│   ├── error.tsx           # Error boundary
│   └── not-found.tsx       # 404 page
├── components/
│   ├── ui/                 # 45+ shadcn/ui primitives
│   ├── shared/             # Design system (StatCard, charts, badges, logos)
│   ├── landing/            # Landing page (1 file, 1389 lines)
│   ├── auth/               # Auth screen (login/register toggle)
│   ├── dashboard/          # Shell + view router
│   ├── merchant/           # 18 merchant pages
│   └── admin/              # 15 admin pages
├── hooks/                  # 22 TanStack Query hooks + use-mobile + use-toast
├── stores/                 # Zustand: auth, ui, i18n
├── lib/
│   ├── api/                # client.ts (Axios) + xpApi.ts (39 endpoints)
│   ├── i18n/               # locales.ts (4 dicts × 212 keys) + index.ts
│   ├── sdk-snippets.ts     # Code examples (moved out of mock.ts)
│   └── utils.ts            # cn, formatCurrency, formatNumber, etc.
├── types/                  # Full domain model (60+ interfaces)
├── config/                 # Nav trees, payment methods, currencies
└── providers/              # AppProviders (ThemeProvider + QueryClient)
```

### 4. Available Features

#### 4.1 Authentication & Onboarding (4 flows)

| Flow | Endpoint | Status |
|------|----------|--------|
| Login | POST auth/login | ✅ Functional |
| Register | POST auth/register | ✅ Functional |
| Forgot Password | POST auth/forgot | ✅ Wired to API |
| Reset Password | POST auth/reset | ✅ Wired to API |
| Session Validation | GET auth/me | ✅ Called in hydrate() |
| Logout | POST auth/logout | ✅ Revokes token |

Features: toggle login/register with Framer Motion animation, RHF+Zod validation, autoComplete attributes, language switcher, JWT persisted in localStorage, 401 auto-refresh with request queue, forceLogout on failure.

#### 4.2 Merchant Dashboard (18 views)

| View ID | File | Description | API Endpoints |
|---------|------|-------------|---------------|
| dashboard | dashboard.tsx | Revenue, volume, approval rate, risk, wallets, charts, latest transactions, top customers, realtime activity | GET analytics/overview, GET wallets, GET risk/profile, GET transactions |
| analytics | analytics.tsx | Revenue trend, volume, payment methods, currency distribution, conversion funnel, countries | GET analytics/overview |
| risk | risk.tsx | Risk gauge, reserve %, chargeback rate, alerts, recommendations, history | GET risk/profile |
| payments | payments.tsx | DataTable with filters, search, export, details drawer (timeline, metadata) | GET transactions (paginated) |
| wallets | wallets.tsx | Multi-currency balances, deposit/withdraw/swap modals, movements history | GET wallets, GET wallets/movements, POST wallets/swap\|deposit\|payout |
| fx | fx.tsx | Exchange rates table, conversion calculator, rate trend, recent swaps | GET wallets, GET wallets/movements |
| treasury | treasury.tsx | Liquidity, reserve, cashflow chart, settlement, balances, movements | GET treasury/overview, GET wallets, GET wallets/movements |
| stores | stores.tsx | Store cards, create store, status, revenue | GET stores |
| products | products.tsx | Product cards, create/edit/delete, active toggle, sales | GET/POST products, DELETE products/:id |
| customers | customers.tsx | CRM: LTV, avg order, segments, timeline, purchase history | GET customers, GET transactions |
| subscriptions | subscriptions.tsx | Active/MRR/churned, status donut, MRR trend, cancel | GET subscriptions |
| payment-links | payment-links.tsx | Create, copy URL, visits/conversions, status | GET payment-links |
| invoices | invoices.tsx | Filter tabs, create, view/download/send, status | GET invoices |
| developers | developers.tsx | SDK tabs, API Explorer, docs, logs | Static (sdk-snippets) |
| api-keys | api-keys.tsx | Create with one-time reveal, revoke, live/test filter | GET/POST api-keys, DELETE api-keys/:id |
| webhooks | webhooks.tsx | Add endpoint, events, signing secret, success rate, delete | GET/POST webhooks, DELETE webhooks/:id |
| settings | settings.tsx | 9 tabs: Company, Brand, Security, API, Notifications, Billing, Compliance, Users, Roles | Static (forms) |
| support | support.tsx | Contact form, KB articles, tickets, SLA | Static (forms) |

#### 4.3 Admin Platform (15 views)

| View ID | File | Description | API Endpoints | Data Source |
|---------|------|-------------|---------------|-------------|
| admin-dashboard | admin-dashboard.tsx | Platform overview: merchants, revenue, treasury, health, KYC | GET admin/merchants, admin/revenue, admin/treasury, admin/health, admin/kyc | ✅ API |
| admin-merchants | admin-merchants.tsx | Merchant table: freeze/approve/suspend | GET admin/merchants, POST admin/merchants/:id/status | ✅ API |
| admin-kyc | admin-kyc.tsx | KYC approval queue: document preview, approve/reject | GET admin/kyc, POST admin/kyc/:id/:decision | ✅ API |
| admin-treasury | admin-treasury.tsx | Platform liquidity, reserve, cashflow | GET admin/treasury/overview | ✅ API + ⚠️ mock feed |
| admin-revenue | admin-revenue.tsx | Revenue trend, top merchants, by country/currency | GET admin/revenue, GET admin/merchants | ✅ API + ⚠️ mock MRR |
| admin-gateways | admin-gateways.tsx | Gateway cards, status, traffic | — | ⚠️ Static mock |
| admin-risk | admin-risk.tsx | Platform risk, top risky merchants | GET admin/merchants | ✅ API |
| admin-analytics | admin-analytics.tsx | Merchant growth, volume by country/currency | GET analytics/overview, GET admin/merchants | ✅ API (uses merchant endpoint) |
| admin-support | admin-support.tsx | Ticket table, assign, resolve | — | ⚠️ Static mock |
| admin-health | admin-health.tsx | Service status, uptime, incidents | GET admin/health | ✅ API + ⚠️ mock incidents |
| admin-workers | admin-workers.tsx | Worker pools, utilization, scale | GET admin/health (.workers) | ✅ API |
| admin-queues | admin-queues.tsx | Queue depth, throughput | GET admin/health (.queues) | ✅ API |
| admin-logs | admin-logs.tsx | Log stream, filters, detail dialog | — | ⚠️ Static mock |
| admin-flags | admin-flags.tsx | Feature flag toggle, rollout % | — | ⚠️ Static mock |
| admin-compliance | admin-compliance.tsx | KYC stats, sanctions, audit log | GET admin/kyc | ✅ API + ⚠️ mock screenings |

**Legend:** ✅ API = wired to real endpoint; ⚠️ Static mock = hardcoded data, no API

#### 4.4 Internationalization

- **4 locales:** English (en), Português Brasil (pt-BR), Français (fr), Español (es)
- **212 keys** per locale, verified consistent across all 4
- **Detection:** browser language → timezone fallback → default en. Respects persisted user choice (won't override explicit selection).
- **Switcher** in: landing nav, landing footer, auth screen, dashboard topbar
- **hreflang** metadata + OG alternateLocale for SEO

#### 4.5 PWA & Branding

- **Manifest:** standalone, theme #0B1220, icons (192/512/maskable/apple-touch), shortcuts
- **Official logo:** circular white emblem with X formed by 4 triangle arms (blue #0080FF + cyan #00C8FF) + central diamond (#0066CC)
- **9 payment logos:** Visa (#3B82F6), Mastercard (native), Pix (#00B89C), Apple Pay (white), Google Pay (multicolor), MBWay (red/white), Bizum (teal), Crypto (orange), SEPA
- **Favicon:** SVG + PNG (32px)
- **OG image:** 1200×630 with logo + tagline

### 5. State Management

#### TanStack Query (22 hooks)
- All list hooks use `select: (d) => d ?? []` to guarantee arrays
- `useTransactions` returns `Paginated<Transaction>` (has its own `.data` field — correct)
- Query keys: `["endpoint", ...params]`
- `staleTime: 30s`, `retry: 1`, `refetchOnWindowFocus: false`

#### Zustand Stores

| Store | Key | Persisted | Purpose |
|-------|-----|-----------|---------|
| `useAuth` | `xp-auth` | user, accessToken (NOT isAuthenticated) | login, register, logout, hydrate (calls auth/me), hasRole |
| `useUi` | — | No | appView, activeMerchantView, activeAdminView, sidebar, command, notifications |
| `useI18n` | `xp-locale` | locale | 4 locales, detect(), setLocale() |

**tokenStore** (localStorage, source of truth for interceptor):
- `xp_access_token`, `xp_refresh_token`, `xp_user` (JSON)
- Defensive reads: `try/catch JSON.parse` — handles corrupt "undefined" string

### 6. Internationalization

See §4.4. Implementation in `src/lib/i18n/`:
- `locales.ts`: 4 dictionaries, `resolveBrowserLocale()`, `localeFromTimezone()`
- `index.ts`: `useI18n` store (persisted), `useT()` hook, `detect()` (respects persisted choice)

### 7. PWA & Branding

See §4.5. Files:
- `src/app/manifest.ts` — PWA manifest
- `src/components/shared/x-symbol.tsx` — official logo component
- `src/components/shared/payment-logos.tsx` — 9 payment SVG logos

### 8. Known Issues & Tech Debt

| Severity | Issue | File(s) |
|----------|-------|---------|
| HIGH | Admin pages with static mock data (gateways, logs, flags, support, compliance screenings) | admin-gateways, admin-logs, admin-flags, admin-support, admin-compliance |
| HIGH | No error states (isError) on most query consumers — skeleton shows forever on API failure | Most merchant pages |
| MEDIUM | Hardcoded English strings in PageHeader titles (33 pages) and landing sections | All page components |
| MEDIUM | WorkspaceSwitcher and NotificationsPanel are local-only (no API) | shell.tsx |
| MEDIUM | "Live mode" pill is decorative (no real toggle) | shell.tsx |
| MEDIUM | Profile menu items (Settings, Billing, Security) have no onClick | shell.tsx |
| MEDIUM | EUR_RATES hardcoded in wallets.tsx for swap preview | wallets.tsx |
| MEDIUM | No i18n interpolation support (t("key") only, no {param}) | lib/i18n/index.ts |
| MEDIUM | html lang="en" hardcoded despite 4 locales | layout.tsx |
| LOW | settings.tsx (880 lines) and landing-page.tsx (1389 lines) too large | Consider splitting |
| LOW | Dead imports in shell.tsx, dashboard.tsx | Cleanup needed |

---

## Part II: Backend API Contract

### 9. Base Configuration

| Setting | Value |
|---------|-------|
| Base URL | `https://api.xpayments.digital/api/v1` (NEXT_PUBLIC_API_URL) |
| Content-Type | Per-request (NOT global — avoids CORS preflight) |
| Auth | `Authorization: Bearer <JWT>` (injected by interceptor) |
| Routes | RELATIVE (no leading slash): `auth/login`, `wallets`, `transactions` |
| Timeout | 15 seconds |
| CORS | Backend must allow `https://xpayments.digital` origin |

### 10. Response Envelopes

**Auth envelope** (login, register):
```json
{
  "success": true,
  "data": { "merchantId": "uuid", "name": "BW Lda.", "tier": "TIER_A_PREMIUM", "token": "eyJ...", "role": "merchant" },
  "error": null
}
```

**Standard envelope** (all other endpoints):
```json
{ "success": true, "data": <T>, "message": null }
{ "success": false, "data": null, "message": "Error description" }
```

**Pagination** (transactions):
```json
{ "data": [...], "total": 128, "page": 1, "pageSize": 10 }
```

The client's `requestData<T>()` unwraps the standard envelope and returns `.data` directly. If `success === false`, it throws an `ApiError`.

### 11. Authentication Flow

1. User submits email + password → `POST auth/login`
2. Backend returns `{ success: true, data: { merchantId, name, tier, token, role } }`
3. `mapEnvelopeToSession()` maps: `token → accessToken`, `merchantId → user.id`, `name → user.name`, `role → user.role`, `tier → user.tier`
4. `tokenStore.set(accessToken, refreshToken, user)` persists to localStorage
5. Zustand `set({ isAuthenticated: true })` → `setAppView("merchant")` → dashboard renders
6. All subsequent requests carry `Authorization: Bearer <token>`
7. On 401 (protected route): interceptor queues request → refreshes token → retries. If refresh fails → `forceLogout()`
8. On 401 (auth route): propagates error (bad credentials)
9. `hydrate()` on page load: reads tokenStore → calls `GET auth/me` to validate → if invalid, interceptor forceLogouts

### 12. Complete Endpoint Reference

#### Auth (7 endpoints)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `auth/login` | No | `{ email, password, remember }` | `{ success, data: { merchantId, name, tier, token, role } }` |
| POST | `auth/register` | No | `{ name, email, password, companyName }` | Same as login |
| POST | `auth/forgot` | No | `{ email }` | `{ success, message }` |
| POST | `auth/reset` | No | `{ token, password }` | `{ success, message }` |
| GET | `auth/me` | Yes | — | `{ success, data: User }` |
| POST | `auth/logout` | Yes | — | `{ success }` |
| POST | `auth/refresh` | No | `{ refreshToken }` | `{ success, data: { token } }` |

#### Wallets (5)

| Method | Path | Auth | Request | Response (data) |
|--------|------|------|---------|----------------|
| GET | `wallets` | Yes | — | `Wallet[]` |
| GET | `wallets/movements` | Yes | `?walletId=` | `WalletMovement[]` |
| POST | `wallets/swap` | Yes | `{ from, to, amount }` | `{ ok, rate }` |
| POST | `wallets/deposit` | Yes | `{ currency, amount, method }` | `{ ok, reference }` |
| POST | `wallets/payout` | Yes | `{ currency, amount, beneficiary }` | `{ ok, reference }` |

#### Analytics, Risk, Transactions, Customers (5)

| Method | Path | Auth | Response (data) |
|--------|------|------|----------------|
| GET | `analytics/overview` | Yes | `AnalyticsOverview` |
| GET | `risk/profile` | Yes | `RiskProfile` |
| GET | `transactions` | Yes | `Paginated<Transaction>` (supports filters: search, status, currency, method, country, gateway, from, to, page, pageSize, sortBy, sortDir) |
| GET | `transactions/:id` | Yes | `Transaction` |
| GET | `customers` | Yes | `Customer[]` |

#### Commerce (10)

| Method | Path | Auth | Response (data) |
|--------|------|------|----------------|
| GET | `products` | Yes | `Product[]` |
| POST | `products` | Yes | `Product` |
| DELETE | `products/:id` | Yes | `{ ok }` |
| GET | `stores` | Yes | `Store[]` |
| GET | `payment-links` | Yes | `PaymentLink[]` |
| GET | `invoices` | Yes | `Invoice[]` |
| GET | `subscriptions` | Yes | `Subscription[]` |
| GET/POST | `api-keys` | Yes | `ApiKey[]` / `ApiKey` |
| DELETE | `api-keys/:id` | Yes | `{ ok }` |
| GET/POST | `webhooks` | Yes | `Webhook[]` / `Webhook` |
| DELETE | `webhooks/:id` | Yes | `{ ok }` |

#### Treasury, KYC, Payouts, Deposits (5)

| Method | Path | Auth | Response (data) |
|--------|------|------|----------------|
| GET | `treasury/overview` | Yes | `TreasuryOverview` |
| GET | `kyc/status` | Yes | `{ status, submittedAt, documents, riskFlags }` |
| GET | `payouts` | Yes | `WalletMovement[]` |
| GET | `deposits` | Yes | `WalletMovement[]` |

#### Admin (7+)

| Method | Path | Auth | Response (data) |
|--------|------|------|----------------|
| GET | `admin/treasury/overview` | Admin | `TreasuryOverview` |
| GET | `admin/merchants` | Admin | `AdminMerchant[]` |
| POST | `admin/merchants/:id/status` | Admin | `{ ok }` |
| GET | `admin/kyc` | Admin | `KycReview[]` |
| POST | `admin/kyc/:id/approved` | Admin | `{ ok }` |
| POST | `admin/kyc/:id/rejected` | Admin | `{ ok }` |
| GET | `admin/health` | Admin | `SystemHealth` |
| GET | `admin/revenue` | Admin | `{ total, series }` |

**Total: 39+ endpoints** (7 auth + 5 wallets + 5 analytics/risk/tx + 10 commerce + 5 treasury/kyc + 7 admin + internal refresh)

### 13. Error Handling

| Status | Auth Route | Protected Route |
|--------|-----------|----------------|
| 401 | Propagate as `ApiError` (bad credentials) | Refresh queue → retry or `forceLogout()` |
| 403 | Propagate | Propagate |
| 404 | Propagate | Propagate |
| 500 | Propagate | Propagate |
| Network | `ApiError { message: "Network error", status: 0 }` | Same |

### 14. Security

- JWT in localStorage (xp_access_token, xp_refresh_token, xp_user)
- Request interceptor injects `Authorization: Bearer <token>`
- 401 refresh with request queue (concurrent requests queued, not dropped)
- `forceLogout()`: clears tokenStore + calls onLogout (no hard redirect)
- Defensive `tokenStore.user` reads (try/catch JSON.parse)
- `isAuthenticated` NOT persisted in Zustand (re-validated from tokenStore on load)
- `hydrate()` calls `GET auth/me` to validate token server-side
- No global Content-Type header (avoids CORS preflight on every request)
- `POST auth/logout` revokes refresh token server-side

---

## Part III: Backend & Database Specification

### 15. Architecture Overview

```
Client (xpayments.digital)
  ↓ HTTPS
Nginx (reverse proxy, TLS, security headers)
  ↓ localhost:3001
Node.js 20 + Hono API
  ├── Supabase PostgreSQL (managed DB)
  ├── Redis (optional: sessions, cache, queues)
  └── Supabase Storage (KYC documents, product images)
```

### 16. VPS Provisioning (Ubuntu 24.04)

```bash
# SSH hardening
sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw --force enable

# fail2ban
apt install -y fail2ban && systemctl enable fail2ban

# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx

# PM2
npm install -g pm2

# App directory
mkdir -p /var/www/xpayments-api
```

**Environment variables (.env):**
```
DATABASE_URL=postgresql://postgres.xxxx@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-key
PORT=3001
CORS_ORIGINS=https://xpayments.digital
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxx
REDIS_URL=redis://localhost:6379
```

**Nginx config:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.xpayments.digital;
    ssl_certificate /etc/letsencrypt/live/api.xpayments.digital/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.xpayments.digital/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 17. Supabase Database Setup

1. Create Supabase project at supabase.com
2. Get connection strings: Direct (port 5432) + Pooler (port 6543)
3. Enable RLS on all tables
4. Create storage buckets: `kyc-documents` (private), `product-images` (public)

### 18. Database Schema (DDL)

```sql
-- Merchants (the core entity)
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  tier TEXT DEFAULT 'TIER_C_STANDARD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('active','frozen','suspended','pending')),
  kyc_status TEXT DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted','pending','approved','rejected')),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wallets (multi-currency)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  label TEXT,
  balance DECIMAL(18,2) DEFAULT 0,
  available DECIMAL(18,2) DEFAULT 0,
  reserved DECIMAL(18,2) DEFAULT 0,
  type TEXT DEFAULT 'fiat' CHECK (type IN ('fiat','crypto','card')),
  card_last4 TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(merchant_id, currency)
);

-- Wallet movements
CREATE TABLE wallet_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit','withdraw','swap','payment','fee','payout')),
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  amount DECIMAL(18,2) NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed','pending','failed')),
  reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  reference TEXT UNIQUE NOT NULL,
  customer TEXT,
  customer_email TEXT,
  amount DECIMAL(18,2) NOT NULL,
  currency TEXT NOT NULL,
  amount_eur DECIMAL(18,2),
  status TEXT NOT NULL CHECK (status IN ('succeeded','pending','failed','refunded','disputed','authorized')),
  method TEXT NOT NULL,
  country TEXT,
  gateway TEXT,
  risk_score INTEGER DEFAULT 0,
  fee DECIMAL(18,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- Transaction events
CREATE TABLE transaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  country TEXT,
  ltv DECIMAL(18,2) DEFAULT 0,
  avg_order DECIMAL(18,2) DEFAULT 0,
  orders INTEGER DEFAULT 0,
  segment TEXT DEFAULT 'new',
  status TEXT DEFAULT 'active',
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(18,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  active BOOLEAN DEFAULT true,
  sales INTEGER DEFAULT 0,
  stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('active','paused','draft')),
  revenue DECIMAL(18,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment links, invoices, subscriptions (same pattern)
CREATE TABLE payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT, url TEXT, amount DECIMAL(18,2), currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'active', visits INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  number TEXT UNIQUE, customer TEXT, amount DECIMAL(18,2), currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'draft', due_date DATE, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  customer TEXT, plan TEXT, amount DECIMAL(18,2), currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'active', interval TEXT DEFAULT 'month',
  current_period_end DATE, created_at TIMESTAMPTZ DEFAULT now()
);

-- API keys (cross-cutting, top-level)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, prefix TEXT, last_four TEXT, hash TEXT NOT NULL,
  scopes TEXT[], environment TEXT DEFAULT 'test',
  last_used_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  url TEXT NOT NULL, events TEXT[], status TEXT DEFAULT 'active',
  secret TEXT, success_rate DECIMAL(5,2) DEFAULT 100,
  last_delivery_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);

-- Risk profiles
CREATE TABLE risk_profiles (
  merchant_id UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0, reserve_pct DECIMAL(5,2) DEFAULT 10,
  chargeback_rate DECIMAL(5,2) DEFAULT 0,
  trust_status TEXT DEFAULT 'standard',
  alerts JSONB DEFAULT '[]', recommendations JSONB DEFAULT '[]',
  history JSONB DEFAULT '[]', updated_at TIMESTAMPTZ DEFAULT now()
);

-- KYC
CREATE TABLE kyc_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  documents JSONB DEFAULT '[]', risk_flags JSONB DEFAULT '[]'
);

-- Feature flags, audit logs, support tickets, system health
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, description TEXT,
  enabled BOOLEAN DEFAULT false, rollout INTEGER DEFAULT 0,
  environment TEXT DEFAULT 'production', created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT, action TEXT, resource TEXT, metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  subject TEXT, priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open', assigned TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: merchants can only see their own data
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
-- (repeat for all merchant-scoped tables)

-- RLS policy example (app-level auth):
-- CREATE POLICY "merchant_isolation" ON wallets
--   FOR ALL USING (merchant_id = current_setting('app.merchant_id')::uuid);
```

### 19. Backend Implementation Guide

**Recommended stack:** Hono (Node 20) for performance + Zod validation + Supabase JS client.

**Auth:**
- `POST auth/login`: verify password (bcrypt), issue JWT (8h access), return `{ success, data: { merchantId, name, tier, token, role } }`
- `POST auth/register`: create merchant + wallet (EUR default), issue JWT, same envelope
- `GET auth/me`: return merchant from JWT
- `POST auth/logout`: revoke refresh token
- `POST auth/refresh`: verify refresh token, issue new access token

**Business logic:**
- All merchant-scoped endpoints extract `merchantId` from JWT (not URL)
- `GET transactions`: support query params (search, status, currency, method, country, gateway, page, pageSize, sortBy, sortDir)
- `POST wallets/swap`: validate balance, apply rate, create movements
- Admin endpoints require `role: "admin"` in JWT

### 20. Deployment

**PM2:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'xpayments-api',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3001 }
  }]
};
```

**GitHub Actions CI/CD:** lint → test → SSH deploy → PM2 reload

### 21. Roadmap

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 | Auth + Merchants + Wallets (MVP) | 1-2 weeks |
| 2 | Transactions + Analytics | 1 week |
| 3 | Commerce (Products/Stores/Links/Invoices/Subs) | 1 week |
| 4 | Risk + KYC + Admin | 1-2 weeks |
| 5 | Real-time + Webhooks + Payouts | 1 week |
| 6 | Hardening (2FA, rate limiting, monitoring) | Ongoing |

---

## Part IV: Getting Started

### 22. Prerequisites & Installation

```bash
git clone https://github.com/nexflowx-hub/xpayments.digital.git
cd xpayments.digital
bun install
```

### 23. Environment Variables

| Variable | Example | Purpose |
|----------|---------|---------|
| NEXT_PUBLIC_API_URL | `https://api.xpayments.digital/api/v1` | Backend base URL |
| NEXT_PUBLIC_APP_NAME | `XPayments` | App name in metadata/manifest |
| NEXT_PUBLIC_ENV | `production` | Environment |
| DATABASE_URL | `file:./db/custom.db` | Local SQLite (dev only) |

### 24. Development Commands

```bash
bun run dev      # Start dev server (port 3000)
bun run lint     # ESLint
bun run db:push  # Push Prisma schema
bun run build    # Production build
```

### 25. Deployment (Vercel)

1. Import repo at vercel.com
2. Set environment variables
3. Deploy — standalone output configured in next.config.ts

**Demo credentials:** None (removed for security). Register a new account via the Sign Up flow.

---

*© 2026 XPayments, Inc. — Proprietary.*
