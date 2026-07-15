# XPayments — Documento Técnico de Alinhamento Frontend ⇄ Backend v3.1

> **Referência oficial.** Este documento mapeia 100% do frontend, identifica todos os dados mock restantes, lista todos os endpoints esperados com request/response exatos, e propõe o roadmap de implementação para o backend estar 100% funcional sem erros nem mocks.

---

## Índice

1. [Estado Atual do Frontend](#1-estado-atual-do-frontend)
2. [Contrato de Envelopes (v3.1)](#2-contrato-de-envelopes-v31)
3. [Endpoints Ativos (wired à API)](#3-endpoints-ativos-wired-à-api)
4. [Endpoints em Falta (necessários)](#4-endpoints-em-falta-necessários)
5. [Dados Mock Restantes (a eliminar)](#5-dados-mock-restantes-a-eliminar)
6. [Mapa Completo: Página → Endpoint → Estado](#6-mapa-completo-página--endpoint--estado)
7. [Tipos TypeScript (contrato exato)](#7-tipos-typescript-contrato-exato)
8. [Fluxo de Autenticação](#8-fluxo-de-autenticação)
9. [Fluxo de Pagamento (Checkout)](#9-fluxo-de-pagamento-checkout)
10. [Roadmap de Implementação Backend](#10-roadmap-de-implementação-backend)
11. [Proposta de Ambiente de DEV](#11-proposta-de-ambiente-de-dev)
12. [Checklist Final 100% Funcional](#12-checklist-final-100-funcional)

---

## 1. Estado Atual do Frontend

| Métrica | Valor |
|---------|-------|
| Framework | Next.js 16.1.1 (App Router, SPA single-route `/`) |
| Linguagem | TypeScript 5 (strict) |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui (45+ componentes) |
| Estado | Zustand (auth, ui, i18n) + TanStack Query (24 hooks) |
| HTTP | Axios (interceptor JWT, 401 refresh queue, `requestData<T>()`) |
| i18n | 4 locales (EN, PT-BR, FR, ES), 212 keys |
| Páginas Merchant | 18 |
| Páginas Admin | 15 |
| Endpoints wired | 37 |
| Endpoints em falta | 12 |
| Ficheiros mock | 0 (mock.ts deletado) |
| Hardcoded data arrays | 8 (em admin pages + wallets/analytics) |

### Ficheiros mock eliminados
- ✅ `src/lib/api/mock.ts` — **deletado**
- ✅ `src/lib/sdk-snippets.ts` — mantido (exemplos de código estáticos, não dados de API)

### Ficheiros que ainda contêm dados hardcoded
Ver secção [5. Dados Mock Restantes](#5-dados-mock-restantes-a-eliminar).

---

## 2. Contrato de Envelopes (v3.1)

### Auth Envelope (login, register)

**Request:**
```json
POST /api/v1/auth/login
{ "email": "merchant@email.com", "password": "123456" }
```

**Response success:**
```json
{
  "success": true,
  "data": {
    "token": "JWT",
    "merchant": {
      "id": "uuid",
      "name": "BW Lda.",
      "email": "merchant@email.com"
    }
  }
}
```

**Response error:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido."
  }
}
```

### Standard Envelope (todos os outros endpoints)

**Success:**
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro."
  }
}
```

### Paginação (v3.1)

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 200,
    "pages": 10
  }
}
```

### Como o frontend processa
- `requestData<T>()` recebe o HTTP body, verifica `"success" in body`
- Se `success === true`: retorna `body.data` (desfaz o envelope)
- Se `success === false`: lança `ApiError` com `error.code` + `error.message`
- Se não tem envelope: retorna o body cru (backwards compatible)

---

## 3. Endpoints Ativos (wired à API)

Estes endpoints já estão ligados ao backend real. O frontend consome-os via `requestData<T>()`.

### Auth (7 endpoints)

| # | Método | Endpoint | Auth | Request Body | Response `data` |
|---|--------|----------|------|-------------|-----------------|
| 1 | POST | `auth/login` | ❌ | `{ email, password, remember }` | `{ token, merchant: { id, name, email } }` |
| 2 | POST | `auth/register` | ❌ | `{ name, email, password, companyName }` | `{ token, merchant: { id, name, email } }` |
| 3 | POST | `auth/forgot` | ❌ | `{ email }` | `{ success, message }` |
| 4 | POST | `auth/reset` | ❌ | `{ token, password }` | `{ success, message }` |
| 5 | GET | `auth/me` | ✅ | — | `User` |
| 6 | POST | `auth/logout` | ✅ | — | `{ success }` |
| 7 | POST | `auth/refresh` | ❌ | `{ refreshToken }` | `{ token }` |

### Analytics (1 endpoint)

| # | Método | Endpoint | Auth | Response `data` |
|---|--------|----------|------|-----------------|
| 8 | GET | `analytics/overview` | ✅ | `{ wallet: { totalBalance, availableBalance, currencies }, transactions: { today, month, total, successRate, volumeToday, volumeMonth }, recentTransactions: Transaction[] }` |

### Transactions (3 endpoints)

| # | Método | Endpoint | Auth | Query Params | Response `data` |
|---|--------|----------|------|-------------|-----------------|
| 9 | GET | `transactions` | ✅ | `?page&limit&status&gateway&currency&reference` | `Paginated<Transaction>` (data + meta) |
| 10 | GET | `transactions/stats` | ✅ | — | `{ total, approved, failed, pending, successRate, volume }` |
| 11 | GET | `transactions/:id` | ✅ | — | `Transaction` |

### Wallets (5 endpoints)

| # | Método | Endpoint | Auth | Request | Response `data` |
|---|--------|----------|------|---------|-----------------|
| 12 | GET | `wallets` | ✅ | — | `{ wallets: Wallet[], summary: { totalBalance, totalAvailable, totalReserved, currencies } }` |
| 13 | GET | `wallets/movements` | ✅ | `?walletId` | `WalletMovement[]` |
| 14 | POST | `wallets/swap` | ✅ | `{ from, to, amount }` | `{ ok, rate }` |
| 15 | POST | `wallets/deposit` | ✅ | `{ currency, amount, method }` | `{ ok, reference }` |
| 16 | POST | `wallets/payout` | ✅ | `{ currency, amount, beneficiary }` | `{ ok, reference }` |

### Commerce (13 endpoints)

| # | Método | Endpoint | Auth | Response `data` |
|---|--------|----------|------|-----------------|
| 17 | GET | `customers` | ✅ | `Customer[]` |
| 18 | GET | `products` | ✅ | `Product[]` |
| 19 | POST | `products` | ✅ | `Product` |
| 20 | DELETE | `products/:id` | ✅ | `{ ok }` |
| 21 | GET | `stores` | ✅ | `Store[]` |
| 22 | GET | `payment-links` | ✅ | `PaymentLink[]` |
| 23 | GET | `invoices` | ✅ | `Invoice[]` |
| 24 | GET | `subscriptions` | ✅ | `Subscription[]` |
| 25 | GET | `api-keys` | ✅ | `ApiKey[]` |
| 26 | POST | `api-keys` | ✅ | `ApiKey` (inclui `fullKey`) |
| 27 | DELETE | `api-keys/:id` | ✅ | `{ ok }` |
| 28 | GET | `webhooks` | ✅ | `Webhook[]` |
| 29 | POST | `webhooks` | ✅ | `Webhook` |
| 30 | DELETE | `webhooks/:id` | ✅ | `{ ok }` |

### Checkout (2 endpoints)

| # | Método | Endpoint | Auth | Request | Response `data` |
|---|--------|----------|------|---------|-----------------|
| 31 | POST | `checkout/session` | API Key | `{ amount, currency, reference, customerEmail, metadata }` | `{ sessionId, checkoutUrl }` |
| 32 | GET | `checkout/session/:id` | ❌ | — | `{ sessionId, storeName, amount, currency, reference }` |

### Risk, Treasury, KYC (3 endpoints)

| # | Método | Endpoint | Auth | Response `data` |
|---|--------|----------|------|-----------------|
| 33 | GET | `risk/profile` | ✅ | `RiskProfile` |
| 34 | GET | `treasury/overview` | ✅ | `TreasuryOverview` |
| 35 | GET | `kyc/status` | ✅ | `{ status, submittedAt, documents, riskFlags }` |

### Admin (8 endpoints)

| # | Método | Endpoint | Auth | Response `data` |
|---|--------|----------|------|-----------------|
| 36 | GET | `admin/merchants` | Admin | `AdminMerchant[]` |
| 37 | POST | `admin/merchants/:id/status` | Admin | `{ ok }` |
| 38 | GET | `admin/kyc` | Admin | `KycReview[]` |
| 39 | POST | `admin/kyc/:id/approved` | Admin | `{ ok }` |
| 40 | POST | `admin/kyc/:id/rejected` | Admin | `{ ok }` |
| 41 | GET | `admin/health` | Admin | `SystemHealth` |
| 42 | GET | `admin/revenue` | Admin | `{ total, series[] }` |
| 43 | GET | `admin/treasury/overview` | Admin | `TreasuryOverview` |

**Total: 43 endpoints ativos**

---

## 4. Endpoints em Falta (necessários)

Estes endpoints **não existem** no `xpApi.ts` mas são necessários para eliminar os últimos dados hardcoded.

### Prioridade Alta (elimina mocks em páginas core)

| # | Método | Endpoint | Páginas afetadas | Response `data` esperado |
|---|--------|----------|-----------------|--------------------------|
| 44 | GET | `fx/rates` | FX, Wallets (swap preview) | `[{ pair: "EUR/USD", rate: 0.92, change: 0.001, history: number[] }]` |
| 45 | GET | `wallets/:id/history` | Wallets (sparklines) | `[{ date, balance }]` |
| 46 | GET | `notifications` | Shell (topbar bell) | `[{ id, title, desc, time, type, read }]` |
| 47 | POST | `notifications/:id/read` | Shell | `{ ok }` |

### Prioridade Média (elimina mocks em páginas admin)

| # | Método | Endpoint | Páginas afetadas | Response `data` esperado |
|---|--------|----------|-----------------|--------------------------|
| 48 | GET | `admin/gateways` | Admin Gateways | `[{ id, name, status, uptime, volume, latency, region }]` |
| 49 | GET | `admin/logs` | Admin Logs | `Paginated<{ id, timestamp, level, service, message, requestId }>` |
| 50 | GET | `admin/flags` | Admin Feature Flags | `[{ id, key, description, enabled, rollout, environment }]` |
| 51 | PATCH | `admin/flags/:key` | Admin Feature Flags | `{ ok }` |
| 52 | GET | `admin/support/tickets` | Admin Support | `[{ id, merchant, subject, priority, status, assigned, created }]` |
| 53 | GET | `admin/compliance/screenings` | Admin Compliance | `[{ id, name, list, status, timestamp }]` |

### Prioridade Baixa (forms não wired)

| # | Método | Endpoint | Páginas afetadas | Response `data` esperado |
|---|--------|----------|-----------------|--------------------------|
| 54 | PUT | `merchants/profile` | Settings (Company tab) | `User` |
| 55 | PUT | `merchants/security` | Settings (Security tab) | `{ ok }` |
| 56 | POST | `support/tickets` | Support (merchant) | `{ ok, ticketId }` |

---

## 5. Dados Mock Restantes (a eliminar)

### Hardcoded em componentes merchant

| Ficheiro | Linha | O que é | API esperada |
|----------|-------|---------|-------------|
| `wallets.tsx` | 37-38 | `EUR_RATES` — taxas de câmbio hardcoded para calcular total EUR | `GET fx/rates` |
| `wallets.tsx` | 40-48 | `genSpark()` — sparkline data decorativa | `GET wallets/:id/history` |
| `analytics.tsx` | 41-48 | `funnel` — visits=184200, conversion=4.7, approval=96.8 hardcoded | Backend deve incluir `funnel` no `analytics/overview` |
| `analytics.tsx` | 57-66 | `countries` — derivado de `COUNTRY_LIST` com `Math.sin` | Backend deve incluir `countries[]` no `analytics/overview` |
| `fx.tsx` | ~30 | `RATES[]` — tabela de taxas hardcoded | `GET fx/rates` |

### Hardcoded em componentes admin

| Ficheiro | O que é | API esperada |
|----------|---------|-------------|
| `admin-gateways.tsx` | `GATEWAYS[]` — 6 gateways com status/uptime/volume | `GET admin/gateways` |
| `admin-logs.tsx` | `logs[]` — 40 entradas de log geradas | `GET admin/logs` (paginado) |
| `admin-flags.tsx` | `flags[]` — 12 feature flags | `GET admin/flags` + `PATCH admin/flags/:key` |
| `admin-support.tsx` | `tickets[]` — 12 tickets | `GET admin/support/tickets` |
| `admin-compliance.tsx` | `SCREENINGS[]` — sanctions screenings | `GET admin/compliance/screenings` |
| `admin-health.tsx` | `INCIDENTS[]` + `buildUptimeSeries()` | Backend deve incluir `incidents[]` + `uptimeSeries[]` no `admin/health` |
| `admin-treasury.tsx` | `pendingPayoutsFeed[]` | Backend deve incluir no `admin/treasury/overview` |
| `admin-revenue.tsx` | `mrr = total/12`, `growth = 18.4` | Backend deve incluir `mrr` + `growth` no `admin/revenue` |

### Hardcoded em shell

| Ficheiro | O que é | API esperada |
|----------|---------|-------------|
| `shell.tsx` | `notifications[]` — 5 notificações | `GET notifications` + `POST notifications/:id/read` |
| `shell.tsx` | `WorkspaceSwitcher` — local state only | `POST auth/switch-workspace` (futuro) |

---

## 6. Mapa Completo: Página → Endpoint → Estado

### Merchant Dashboard

| Página | Endpoint(s) | Estado | Mock restante |
|--------|-------------|--------|---------------|
| Dashboard | `GET analytics/overview`, `GET risk/profile`, `GET wallets`, `GET transactions` | ✅ Integrado | — |
| Analytics | `GET analytics/overview` | ⚠️ Parcial | funnel + countries hardcoded |
| Risk | `GET risk/profile` | ✅ Integrado | — |
| Payments | `GET transactions` (paginado), `GET transactions/:id` | ✅ Integrado | — |
| Wallets | `GET wallets`, `GET wallets/movements`, `POST wallets/swap\|deposit\|payout` | ⚠️ Parcial | EUR_RATES hardcoded |
| FX | `GET wallets`, `GET wallets/movements`, `POST wallets/swap` | ⚠️ Parcial | RATES[] hardcoded |
| Treasury | `GET treasury/overview`, `GET wallets`, `GET wallets/movements` | ✅ Integrado | — |
| Stores | `GET stores` | ✅ Integrado | — |
| Products | `GET/POST/DELETE products` | ✅ Integrado | — |
| Customers | `GET customers`, `GET transactions` | ✅ Integrado | — |
| Subscriptions | `GET subscriptions` | ✅ Integrado | — |
| Payment Links | `GET payment-links` | ✅ Integrado | — |
| Invoices | `GET invoices` | ✅ Integrado | — |
| Developers | Estático (sdk-snippets) | ✅ N/A | — |
| API Keys | `GET/POST/DELETE api-keys` | ✅ Integrado | — |
| Webhooks | `GET/POST/DELETE webhooks` | ✅ Integrado | — |
| Settings | Forms não wired | ⚠️ Pendente | `PUT merchants/profile` etc. |
| Support | Forms não wired | ⚠️ Pendente | `POST support/tickets` |

### Admin Dashboard

| Página | Endpoint(s) | Estado | Mock restante |
|--------|-------------|--------|---------------|
| Overview | `GET admin/merchants`, `admin/revenue`, `admin/treasury`, `admin/health`, `admin/kyc` | ✅ Integrado | — |
| Merchants | `GET admin/merchants`, `POST admin/merchants/:id/status` | ✅ Integrado | — |
| KYC Queue | `GET admin/kyc`, `POST admin/kyc/:id/:decision` | ✅ Integrado | auditHistory mock |
| Treasury | `GET admin/treasury/overview` | ⚠️ Parcial | pendingPayoutsFeed mock |
| Revenue | `GET admin/revenue`, `GET admin/merchants` | ⚠️ Parcial | mrr + growth hardcoded |
| Gateways | — | ⚠️ Mock total | `GET admin/gateways` |
| Risk | `GET admin/merchants` | ✅ Integrado | platformAlerts mock |
| Analytics | `GET analytics/overview`, `GET admin/merchants` | ⚠️ Parcial | gatewayComparison mock |
| Support | — | ⚠️ Mock total | `GET admin/support/tickets` |
| Health | `GET admin/health` | ⚠️ Parcial | INCIDENTS + uptimeSeries mock |
| Workers | `GET admin/health` (.workers) | ✅ Integrado | — |
| Queues | `GET admin/health` (.queues) | ✅ Integrado | — |
| Logs | — | ⚠️ Mock total | `GET admin/logs` |
| Flags | — | ⚠️ Mock total | `GET/PATCH admin/flags` |
| Compliance | `GET admin/kyc` | ⚠️ Parcial | SCREENINGS mock |

---

## 7. Tipos TypeScript (contrato exato)

### Auth

```typescript
interface AuthEnvelope {
  success: boolean;
  data: {
    token: string;
    merchant: { id: string; name: string; email: string };
  };
  error?: { code: string; message: string };
}

interface User {
  id: string; name: string; email: string;
  role: "merchant" | "admin" | "guest";
  merchantId?: string; tier?: string; company?: string;
}
```

### Analytics (v3.1)

```typescript
interface AnalyticsOverview {
  wallet: {
    totalBalance: number;
    availableBalance: number;
    currencies: number;
  };
  transactions: {
    today: number; month: number; total: number;
    successRate: number; volumeToday: number; volumeMonth: number;
  };
  recentTransactions: Transaction[];
  // Legacy (optional)
  revenue?: number; volume?: number; conversion?: number;
  revenueSeries?: { date: string; value: number }[];
  // Campos em falta (necessários para eliminar mocks)
  funnel?: { key: string; label: string; value: number }[];
  countries?: { country: string; volume: number; share: number }[];
}
```

### Wallets (v3.1)

```typescript
interface Wallet {
  currency: CurrencyCode;
  balance: number; available: number; reserved: number;
  type: "fiat" | "crypto" | "card";
}

interface WalletsResponse {
  wallets: Wallet[];
  summary: {
    totalBalance: number; totalAvailable: number;
    totalReserved: number; currencies: number;
  };
}

interface WalletMovement {
  id: string; currency: CurrencyCode;
  amount: number; direction: "in" | "out";
  status: string; createdAt: string;
}
```

### Transactions (v3.1)

```typescript
interface Transaction {
  id: string; reference: string;
  customer: string; customerEmail: string;
  amount: number; currency: CurrencyCode;
  status: "succeeded" | "pending" | "failed" | "refunded" | "disputed" | "authorized";
  method: PaymentMethod; country: string; gateway: string;
  createdAt: string; riskScore: number; fee: number;
  metadata?: Record<string, string>;
  events?: TxEvent[];
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}
```

### Checkout (v3.1)

```typescript
// POST checkout/session
interface CheckoutSessionRequest {
  amount: number; currency: string;
  reference: string; customerEmail: string;
  metadata?: Record<string, string>;
}
interface CheckoutSessionResponse {
  sessionId: string; checkoutUrl: string;
}
```

---

## 8. Fluxo de Autenticação

```
1. Utilador submete email + password
   ↓
2. POST /api/v1/auth/login
   Body: { email, password }
   ↓
3. Backend valida credenciais
   ↓ Sucesso:
   { success: true, data: { token: "JWT", merchant: { id, name, email } } }
   ↓
4. mapEnvelopeToSession():
   token → accessToken (localStorage: xp_access_token)
   merchant.id → user.id
   merchant.name → user.name
   merchant.email → user.email
   ↓
5. Zustand set({ isAuthenticated: true })
   ↓
6. DashboardShell renderiza
   ↓
7. Todos os pedidos subsequentes:
   Authorization: Bearer <token>
   ↓
8. Se 401 (token expirado):
   - Interceptor faz POST auth/refresh
   - Se sucesso: novo token, retry do pedido original
   - Se falha: forceLogout() → landing page
   ↓
9. Logout:
   POST auth/logout (revoga token server-side)
   Limpa localStorage → landing page
```

---

## 9. Fluxo de Pagamento (Checkout)

```
1. Merchant cria sessão de checkout (via API ou dashboard)
   POST /api/v1/checkout/session
   Headers: Authorization: Bearer <API_KEY>
   Body: { amount: 1000, currency: "EUR", reference: "ORDER-001", customerEmail: "customer@mail.com", metadata: { orderId: "123" } }
   ↓
2. Backend cria sessão
   Response: { success: true, data: { sessionId: "sess_xxx", checkoutUrl: "https://checkout.xpayments.digital/pay/sess_xxx" } }
   ↓
3. Cliente é redirecionado para checkoutUrl
   ↓
4. Checkout page carrega sessão:
   GET /api/v1/checkout/session/sess_xxx
   Response: { success: true, data: { sessionId, storeName, amount, currency, reference } }
   ↓
5. Cliente paga (card/Pix/MBWay/etc.)
   POST /api/v1/payments/charge
   Headers: x-api-key
   Body: { amount, currency, payment_method_types: ["card"], metadata }
   ↓
6. Backend processa pagamento (Stripe PaymentIntent)
   ↓
7. Webhook enviado ao merchant:
   POST merchant_webhook_url
   Body: { event: "payment.succeeded", data: { ... } }
   Headers: XPayments-Signature: <HMAC>
```

---

## 10. Roadmap de Implementação Backend

### Fase 1 — MVP (1-2 semanas)

Endpoints necessários para o dashboard funcionar 100%:

| Prioridade | Endpoint | Método | Páginas |
|------------|----------|--------|---------|
| P1 | `auth/login` | POST | Login |
| P1 | `auth/me` | GET | hydrate() |
| P1 | `auth/logout` | POST | Logout |
| P1 | `auth/refresh` | POST | Interceptor 401 |
| P1 | `analytics/overview` | GET | Dashboard |
| P1 | `wallets` | GET | Dashboard, Wallets, Treasury |
| P1 | `transactions` | GET | Dashboard, Payments |
| P1 | `transactions/:id` | GET | Payments (drawer) |

### Fase 2 — Core Merchant (1 semana)

| Prioridade | Endpoint | Método | Páginas |
|------------|----------|--------|---------|
| P2 | `risk/profile` | GET | Dashboard, Risk |
| P2 | `wallets/movements` | GET | Wallets, Treasury |
| P2 | `wallets/swap` | POST | Wallets, FX |
| P2 | `wallets/deposit` | POST | Wallets |
| P2 | `wallets/payout` | POST | Wallets |
| P2 | `treasury/overview` | GET | Treasury |
| P2 | `transactions/stats` | GET | Analytics |
| P2 | `customers` | GET | Customers |
| P2 | `fx/rates` | GET | FX, Wallets (elimina EUR_RATES) |

### Fase 3 — Commerce (1 semana)

| Prioridade | Endpoint | Método | Páginas |
|------------|----------|--------|---------|
| P3 | `products` | GET/POST/DELETE | Products |
| P3 | `stores` | GET | Stores |
| P3 | `payment-links` | GET | Payment Links |
| P3 | `invoices` | GET | Invoices |
| P3 | `subscriptions` | GET | Subscriptions |
| P3 | `api-keys` | GET/POST/DELETE | API Keys |
| P3 | `webhooks` | GET/POST/DELETE | Webhooks |
| P3 | `checkout/session` | POST | Checkout |
| P3 | `checkout/session/:id` | GET | Checkout |

### Fase 4 — Admin (1-2 semanas)

| Prioridade | Endpoint | Método | Páginas |
|------------|----------|--------|---------|
| P4 | `admin/merchants` | GET | Admin Dashboard, Merchants |
| P4 | `admin/merchants/:id/status` | POST | Admin Merchants |
| P4 | `admin/kyc` | GET | Admin KYC |
| P4 | `admin/kyc/:id/:decision` | POST | Admin KYC |
| P4 | `admin/health` | GET | Admin Health, Workers, Queues |
| P4 | `admin/revenue` | GET | Admin Revenue |
| P4 | `admin/treasury/overview` | GET | Admin Treasury |
| P4 | `admin/gateways` | GET | Admin Gateways |
| P4 | `admin/logs` | GET | Admin Logs |
| P4 | `admin/flags` | GET/PATCH | Admin Flags |
| P4 | `admin/support/tickets` | GET | Admin Support |
| P4 | `admin/compliance/screenings` | GET | Admin Compliance |

### Fase 5 — Extras (1 semana)

| Prioridade | Endpoint | Método | Páginas |
|------------|----------|--------|---------|
| P5 | `notifications` | GET | Shell (topbar) |
| P5 | `notifications/:id/read` | POST | Shell |
| P5 | `merchants/profile` | PUT | Settings |
| P5 | `merchants/security` | PUT | Settings |
| P5 | `support/tickets` | POST | Support |
| P5 | `auth/register` | POST | Register |
| P5 | `auth/forgot` | POST | Forgot |
| P5 | `auth/reset` | POST | Reset |
| P5 | `kyc/status` | GET | Settings |
| P5 | `wallets/:id/history` | GET | Wallets (sparklines) |

### Fase 6 — Eliminar Mocks Restantes (contínuo)

| Mock | Solução |
|------|---------|
| `EUR_RATES` em wallets.tsx | `GET fx/rates` retorna taxas reais |
| `genSpark()` em wallets.tsx | `GET wallets/:id/history` retorna histórico |
| `funnel` em analytics.tsx | Incluir `funnel[]` no `analytics/overview` |
| `countries` em analytics.tsx | Incluir `countries[]` no `analytics/overview` |
| `RATES[]` em fx.tsx | `GET fx/rates` |
| `INCIDENTS[]` em admin-health.tsx | Incluir `incidents[]` no `admin/health` |
| `pendingPayoutsFeed[]` em admin-treasury.tsx | Incluir no `admin/treasury/overview` |
| `mrr/growth` em admin-revenue.tsx | Incluir `mrr` + `growth` no `admin/revenue` |
| `notifications[]` em shell.tsx | `GET notifications` |
| `auditHistory[]` em admin-kyc.tsx | Incluir `auditHistory[]` no `admin/kyc` |
| `platformAlerts[]` em admin-risk.tsx | Incluir `alerts[]` no `admin/merchants` ou endpoint próprio |
| `gatewayComparison[]` em admin-analytics.tsx | Incluir no `admin/analytics/overview` |

---

## 11. Proposta de Ambiente de DEV

### Variáveis de Ambiente

```env
# .env (frontend)
NEXT_PUBLIC_API_URL=https://api.xpayments.digital/api/v1
NEXT_PUBLIC_APP_NAME=XPayments
NEXT_PUBLIC_ENV=production

# .env (backend VPS)
DATABASE_URL=postgresql://postgres.xxxx@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=sua-chave-secreta-super-forte
PORT=3001
CORS_ORIGINS=https://xpayments.digital
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxx
REDIS_URL=redis://localhost:6379
```

### Arquitetura

```
                    ┌─────────────────────┐
                    │   xpayments.digital │
                    │   (Vercel / Frontend)│
                    └──────────┬──────────┘
                               │ HTTPS
                    ┌──────────▼──────────┐
                    │      Nginx (TLS)    │
                    │  api.xpayments.digital│
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Node.js + Express  │
                    │    (Port 3001)      │
                    │  PM2 (2 instances)  │
                    └────┬─────────┬──────┘
                         │         │
              ┌──────────▼──┐  ┌──▼──────────┐
              │  Supabase   │  │   Redis     │
              │ PostgreSQL  │  │ (cache/queue)│
              └─────────────┘  └─────────────┘
```

### VPS Ubuntu 24.04

```bash
# Hardening
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
apt install -y fail2ban nginx certbot python3-certbot-nginx

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# App
mkdir -p /var/www/xpayments-api
cd /var/www/xpayments-api
git clone <repo> .
npm install
pm2 start ecosystem.config.js
pm2 startup && pm2 save
```

### Nginx

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

### CORS

O backend deve permitir:
```
Access-Control-Allow-Origin: https://xpayments.digital
Access-Control-Allow-Headers: Authorization, Content-Type, x-api-key
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

O frontend **não** envia `Content-Type` globalmente (evita preflight desnecessário). O Content-Type é setado per-request pelo Axios apenas quando há body.

---

## 12. Checklist Final 100% Funcional

### Para o frontend estar 100% funcional sem erros nem mocks:

- [ ] **Fase 1**: Implementar 8 endpoints (auth + analytics + wallets + transactions)
- [ ] **Fase 2**: Implementar 9 endpoints (risk + movements + swap + treasury + customers + fx/rates)
- [ ] **Fase 3**: Implementar 9 endpoints (commerce + checkout)
- [ ] **Fase 4**: Implementar 12 endpoints (admin)
- [ ] **Fase 5**: Implementar 10 endpoints (notifications + settings + support + register + forgot + reset)
- [ ] **Fase 6**: Adicionar campos em falta em respostas existentes:
  - [ ] `analytics/overview` deve incluir `funnel[]` + `countries[]`
  - [ ] `admin/health` deve incluir `incidents[]` + `uptimeSeries[]`
  - [ ] `admin/treasury/overview` deve incluir `pendingPayoutsFeed[]`
  - [ ] `admin/revenue` deve incluir `mrr` + `growth`
  - [ ] `admin/kyc` deve incluir `auditHistory[]`
  - [ ] `admin/merchants` deve incluir `alerts[]` (ou endpoint `admin/risk/alerts`)
- [ ] Eliminar `EUR_RATES` de `wallets.tsx` (usar `GET fx/rates`)
- [ ] Eliminar `RATES[]` de `fx.tsx` (usar `GET fx/rates`)
- [ ] Eliminar `genSpark()` de `wallets.tsx` (usar `GET wallets/:id/history`)
- [ ] Eliminar `notifications[]` hardcoded de `shell.tsx` (usar `GET notifications`)
- [ ] Wire forms de `settings.tsx` a `PUT merchants/profile` etc.
- [ ] Wire form de `support.tsx` a `POST support/tickets`

### Verificação final

Quando todos os checkpoints estiverem verdes:
1. `rg -rn "hardcoded\|mock\|MOCK\|dummy\|faker" src/components/` → 0 resultados
2. Abrir dashboard → sem erros de consola
3. Navegar em todas as 33 páginas → sem crash, sem skeletons infinitos
4. Login com credenciais reais → dashboard carrega dados reais
5. Logout → landing page
6. Admin login → admin dashboard com dados reais

---

*Documento gerado como referência oficial do projeto XPayments Digital v3.1.*
*© 2026 XPayments, Inc.*
