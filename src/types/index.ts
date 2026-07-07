// ============================================================
// XPayments — Domain Types
// ============================================================

export type UserRole = "merchant" | "admin" | "guest";
export type AppView =
  | "landing"
  | "login"
  | "forgot"
  | "reset"
  | "merchant"
  | "admin";

// ---- Auth ----
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  company?: string;
  merchantId?: string;
  tier?: string;
  twoFactorEnabled?: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

/**
 * Raw envelope returned by the Master Backend on POST auth/login and
 * auth/register. The client maps this into `AuthSession` (see xpApi.auth).
 */
export interface AuthEnvelope {
  success: boolean;
  data: {
    merchantId: string;
    name: string;
    tier: string;
    token: string;
    role: string;
  };
  error?: string;
}

/** Shape returned by auth/login and auth/register (after envelope mapping) */
export type AuthResponse = AuthSession;

/**
 * Standard API response envelope used by ALL non-auth endpoints.
 * The backend MUST return this shape for every request:
 *   { success: true,  data: T, message?: string }
 *   { success: false, data: null, message: "error description" }
 * The client (`requestData<T>()`) unwraps `.data` automatically.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ---- Wallets ----
export type CurrencyCode = "EUR" | "USD" | "BRL" | "USDT" | "GBP" | "BTC";

export interface Wallet {
  id: string;
  currency: CurrencyCode;
  label: string;
  balance: number;
  available: number;
  reserved: number;
  type: "fiat" | "crypto" | "card";
  cardLast4?: string;
  changePct: number;
  color: string;
}

export interface WalletMovement {
  id: string;
  walletId: string;
  currency: CurrencyCode;
  type: "deposit" | "withdraw" | "swap" | "payment" | "fee" | "payout";
  direction: "in" | "out";
  amount: number;
  status: "completed" | "pending" | "failed";
  createdAt: string;
  reference: string;
}

// ---- Transactions / Payments ----
export type TxStatus =
  | "succeeded"
  | "pending"
  | "failed"
  | "refunded"
  | "disputed"
  | "authorized";

export type PaymentMethod =
  | "visa"
  | "mastercard"
  | "amex"
  | "pix"
  | "mbway"
  | "apple_pay"
  | "google_pay"
  | "crypto"
  | "sepa"
  | "wise";

export interface Transaction {
  id: string;
  reference: string;
  customer: string;
  customerEmail: string;
  amount: number;
  currency: CurrencyCode;
  amountEur: number;
  status: TxStatus;
  method: PaymentMethod;
  country: string;
  gateway: string;
  createdAt: string;
  riskScore: number;
  fee: number;
  metadata?: Record<string, string>;
  events?: TxEvent[];
}

export interface TxEvent {
  id: string;
  type: string;
  label: string;
  createdAt: string;
  detail?: string;
}

// ---- Analytics ----
export interface AnalyticsOverview {
  revenue: number;
  revenueChange: number;
  volume: number;
  volumeChange: number;
  conversion: number;
  conversionChange: number;
  approvalRate: number;
  approvalChange: number;
  riskScore: number;
  riskChange: number;
  revenueSeries: { date: string; value: number }[];
  volumeSeries: { date: string; value: number }[];
  paymentMethods: { method: PaymentMethod; share: number; volume: number }[];
  currencies: { currency: CurrencyCode; share: number; volume: number }[];
  topCustomers: { name: string; ltv: number; orders: number }[];
  realtime: { id: string; label: string; amount: number; currency: CurrencyCode; ago: string }[];
}

// ---- Risk ----
export interface RiskProfile {
  score: number; // 0-100, lower is better
  reservePct: number;
  chargebackRate: number;
  trustStatus: "trusted" | "standard" | "elevated" | "high_risk";
  alerts: RiskAlert[];
  recommendations: string[];
  history: { date: string; score: number; chargebacks: number }[];
}

export interface RiskAlert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  createdAt: string;
}

// ---- Customers ----
export interface Customer {
  id: string;
  name: string;
  email: string;
  country: string;
  ltv: number;
  avgOrder: number;
  orders: number;
  segment: "vip" | "regular" | "new" | "at_risk";
  firstSeen: string;
  lastSeen: string;
  status: "active" | "inactive" | "blocked";
}

// ---- Commerce ----
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  image?: string;
  active: boolean;
  sales: number;
  stock?: number;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  domain: string;
  status: "active" | "paused" | "draft";
  products: number;
  revenue: number;
  currency: CurrencyCode;
  createdAt: string;
}

export interface PaymentLink {
  id: string;
  name: string;
  url: string;
  amount: number;
  currency: CurrencyCode;
  status: "active" | "inactive";
  visits: number;
  conversions: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  currency: CurrencyCode;
  status: "paid" | "open" | "overdue" | "draft" | "void";
  dueDate: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  customer: string;
  plan: string;
  amount: number;
  currency: CurrencyCode;
  status: "active" | "trialing" | "past_due" | "canceled";
  interval: "month" | "year";
  currentPeriodEnd: string;
}

// ---- Developers ----
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastFour: string;
  fullKey?: string; // only right after creation
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  environment: "live" | "test";
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: "active" | "disabled";
  secret: string;
  lastDeliveryAt?: string;
  successRate: number;
  createdAt: string;
}

// ---- Treasury ----
export interface TreasuryOverview {
  totalLiquidity: number;
  reserve: number;
  pendingPayouts: number;
  netFlow: number;
  liquidityChange: number;
  cashFlowSeries: { date: string; inflow: number; outflow: number }[];
  settlementSeries: { date: string; value: number }[];
  balances: { currency: CurrencyCode; amount: number; changePct: number }[];
}

// ---- Admin ----
export interface AdminMerchant {
  id: string;
  name: string;
  email: string;
  country: string;
  status: "active" | "frozen" | "suspended" | "pending";
  riskScore: number;
  revenue: number;
  volume: number;
  createdAt: string;
  kycStatus: "approved" | "pending" | "rejected" | "not_submitted";
}

export interface KycReview {
  id: string;
  merchantName: string;
  merchantId: string;
  country: string;
  submittedAt: string;
  documents: KycDocument[];
  status: "pending" | "approved" | "rejected";
  riskFlags: string[];
}

export interface KycDocument {
  id: string;
  name: string;
  type: "passport" | "id_card" | "selfie" | "address_proof" | "article";
  pages: number;
  sizeKb: number;
}

export interface SystemHealth {
  status: "operational" | "degraded" | "outage";
  uptime: number;
  services: { name: string; status: "operational" | "degraded" | "outage"; latencyMs: number }[];
  queues: { name: string; pending: number; processing: number; throughput: number }[];
  workers: { name: string; active: number; idle: number; region: string }[];
}

// ---- Generic API ----
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface DataTableFilters {
  search?: string;
  status?: string;
  country?: string;
  currency?: string;
  method?: string;
  gateway?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
