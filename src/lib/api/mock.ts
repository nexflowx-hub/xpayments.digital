import type {
  AdminMerchant,
  AnalyticsOverview,
  ApiKey,
  Customer,
  Invoice,
  KycReview,
  PaymentLink,
  Product,
  RiskProfile,
  Store,
  Subscription,
  SystemHealth,
  Transaction,
  TreasuryOverview,
  TxEvent,
  Wallet,
  WalletMovement,
  Webhook,
  CurrencyCode,
  PaymentMethod,
  TxStatus,
} from "@/types";

// Deterministic pseudo-random for stable demo data
let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function int(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function float(min: number, max: number, dp = 2) {
  return Number((rand() * (max - min) + min).toFixed(dp));
}
function id(prefix: string, n: number) {
  return `${prefix}_${String(n).padStart(6, "0")}`;
}
function iso(daysAgo: number, hourOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hourOffset);
  return d.toISOString();
}

const firstNames = [
  "Lucas", "Sofia", "Mateo", "Emma", "Noah", "Olivia", "Liam", "Ava",
  "João", "Maria", "Pierre", "Camille", "Hans", "Greta", "Ravi", "Anya",
  "Chen", "Yuki", "Diego", "Elena", "Marco", "Lena", "Tom", "Nina",
];
const lastNames = [
  "Silva", "Santos", "Müller", "Dubois", "Rossi", "Costa", "Novak",
  "Yamamoto", "Kowalski", "Andersson", "Ferreira", "Bianchi", "Costa",
  "Petrov", "Olsen", "Mendes",
];
const companies = [
  "Nimbus Labs", "Quanta Pay", "Helix Retail", "Vertex Commerce",
  "Lumen Studio", "Orbital Goods", "Northwind", "Cobalt Digital",
  "Atlas Supply", "Meridian", "Cirrus", "Foundry",
];
const countries = [
  "Portugal", "Brazil", "United States", "United Kingdom", "Germany",
  "France", "Spain", "Netherlands", "Ireland", "Singapore",
];
const methods: PaymentMethod[] = [
  "visa", "mastercard", "pix", "mbway", "apple_pay", "google_pay",
  "crypto", "sepa",
];
const gateways = ["xpayments", "stripe-rail", "adyen", "checkout", "wise"];
const currencies: CurrencyCode[] = ["EUR", "USD", "BRL", "GBP", "USDT"];
const statuses: TxStatus[] = [
  "succeeded", "succeeded", "succeeded", "succeeded", "pending",
  "failed", "refunded", "disputed", "authorized",
];

function fullName() {
  return `${pick(firstNames)} ${pick(lastNames)}`;
}
function emailFor(name: string) {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${pick([
    "gmail.com", "outlook.com", "proton.me", "company.io", "merchant.co",
  ])}`;
}

// ---- Wallets ----
export const mockWallets: Wallet[] = [
  {
    id: "wlt_eur", currency: "EUR", label: "Euro Operating", balance: 842310.55,
    available: 821940.12, reserved: 20370.43, type: "fiat", changePct: 4.2,
    color: "#3b82f6",
  },
  {
    id: "wlt_brl", currency: "BRL", label: "Brazil Real", balance: 1298400.0,
    available: 1298400.0, reserved: 0, type: "fiat", changePct: 8.7,
    color: "#22c55e",
  },
  {
    id: "wlt_usd", currency: "USD", label: "US Dollar", balance: 412980.22,
    available: 398000.0, reserved: 14980.22, type: "fiat", changePct: -1.3,
    color: "#10b981",
  },
  {
    id: "wlt_usdt", currency: "USDT", label: "Tether USDT", balance: 96450.75,
    available: 96450.75, reserved: 0, type: "crypto", changePct: 12.4,
    color: "#26a17b",
  },
  {
    id: "wlt_gbp", currency: "GBP", label: "British Pound", balance: 58210.9,
    available: 56010.9, reserved: 2200.0, type: "fiat", changePct: 2.1,
    color: "#8b5cf6",
  },
  {
    id: "wlt_card", currency: "EUR", label: "XPayments Card •4821", balance: 18420.0,
    available: 18420.0, reserved: 0, type: "card", cardLast4: "4821",
    changePct: 6.8, color: "#f59e0b",
  },
];

// ---- Wallet movements ----
export const mockMovements: WalletMovement[] = Array.from({ length: 60 }).map(
  (_, i) => {
    const w = pick(mockWallets);
    const type = pick(["deposit", "withdraw", "swap", "payment", "fee", "payout"] as const);
    const direction =
      type === "deposit" || type === "payment" ? "in" : "out";
    return {
      id: id("mv", i),
      walletId: w.id,
      currency: w.currency,
      type,
      direction: direction as "in" | "out",
      amount: float(20, 9500),
      status: pick(["completed", "completed", "pending", "failed"] as const),
      createdAt: iso(int(0, 30), int(0, 23)),
      reference: `REF${int(100000, 999999)}`,
    };
  }
);

// ---- Transactions ----
function buildEvents(status: TxStatus): TxEvent[] {
  const base: TxEvent[] = [
    { id: "e1", type: "created", label: "Payment created", createdAt: iso(0, 2) },
    { id: "e2", type: "auth", label: "Authorization requested", createdAt: iso(0, 2) },
  ];
  if (status === "succeeded" || status === "authorized")
    base.push({ id: "e3", type: "captured", label: "Payment captured", createdAt: iso(0, 1) });
  if (status === "failed")
    base.push({ id: "e3", type: "declined", label: "Declined by issuer", createdAt: iso(0, 2), detail: "Insufficient funds" });
  if (status === "refunded")
    base.push({ id: "e3", type: "refund", label: "Refunded to customer", createdAt: iso(0, 0) });
  if (status === "disputed")
    base.push({ id: "e3", type: "dispute", label: "Chargeback opened", createdAt: iso(0, 0), detail: "Reason: Service not provided" });
  return base;
}

export const mockTransactions: Transaction[] = Array.from({ length: 128 }).map(
  (_, i) => {
    const cur = pick(currencies);
    const status = pick(statuses);
    const amount = float(5, 4800);
    const eurRate: Record<CurrencyCode, number> = {
      EUR: 1, USD: 0.92, BRL: 0.18, GBP: 1.17, USDT: 0.99, BTC: 42000,
    };
    return {
      id: id("txn", i),
      reference: `txn_${int(100000, 999999)}${pick(["a", "b", "c", "x", "z"])}`,
      customer: fullName(),
      customerEmail: emailFor(fullName()),
      amount,
      currency: cur,
      amountEur: Number((amount * eurRate[cur]).toFixed(2)),
      status,
      method: pick(methods),
      country: pick(countries),
      gateway: pick(gateways),
      createdAt: iso(int(0, 45), int(0, 23)),
      riskScore: int(1, 90),
      fee: Number((amount * 0.029 + 0.3).toFixed(2)),
      metadata: { order_id: `ord_${int(10000, 99999)}`, source: pick(["web", "mobile", "api"]) },
      events: buildEvents(status),
    };
  }
);

// ---- Customers ----
export const mockCustomers: Customer[] = Array.from({ length: 54 }).map((_, i) => {
  const name = fullName();
  const orders = int(1, 240);
  const avgOrder = float(40, 980);
  return {
    id: id("cus", i),
    name,
    email: emailFor(name),
    country: pick(countries),
    ltv: Number((orders * avgOrder).toFixed(2)),
    avgOrder,
    orders,
    segment: pick(["vip", "regular", "new", "at_risk"] as const),
    firstSeen: iso(int(30, 400)),
    lastSeen: iso(int(0, 20)),
    status: pick(["active", "active", "active", "inactive", "blocked"] as const),
  };
});

// ---- Analytics ----
function series(days: number, base: number, vol: number) {
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const trend = base + i * (vol * 0.15);
    const noise = (rand() - 0.5) * vol;
    return {
      date: d.toISOString().slice(0, 10),
      value: Math.max(0, Number((trend + noise).toFixed(2))),
    };
  });
}

export const mockAnalytics: AnalyticsOverview = {
  revenue: 4289340.12,
  revenueChange: 18.4,
  volume: 18920000.0,
  volumeChange: 22.1,
  conversion: 4.7,
  conversionChange: 0.6,
  approvalRate: 96.8,
  approvalChange: 1.2,
  riskScore: 22,
  riskChange: -3.0,
  revenueSeries: series(30, 110000, 18000),
  volumeSeries: series(30, 520000, 90000),
  paymentMethods: [
    { method: "visa", share: 38, volume: 7189600 },
    { method: "mastercard", share: 26, volume: 4919200 },
    { method: "pix", share: 18, volume: 3405600 },
    { method: "mbway", share: 8, volume: 1513600 },
    { method: "apple_pay", share: 5, volume: 946000 },
    { method: "google_pay", share: 3, volume: 567600 },
    { method: "crypto", share: 2, volume: 378400 },
  ],
  currencies: [
    { currency: "EUR", share: 41, volume: 7757200 },
    { currency: "USD", share: 28, volume: 5297600 },
    { currency: "BRL", share: 19, volume: 3594800 },
    { currency: "GBP", share: 8, volume: 1513600 },
    { currency: "USDT", share: 4, volume: 756800 },
  ],
  topCustomers: mockCustomers
    .slice()
    .sort((a, b) => b.ltv - a.ltv)
    .slice(0, 6)
    .map((c) => ({ name: c.name, ltv: c.ltv, orders: c.orders })),
  realtime: Array.from({ length: 6 }).map((_, i) => ({
    id: `rt${i}`,
    label: pick(companies),
    amount: float(12, 1800),
    currency: pick(currencies),
    ago: `${int(1, 9)}s ago`,
  })),
};

// ---- Risk ----
export const mockRisk: RiskProfile = {
  score: 22,
  reservePct: 8,
  chargebackRate: 0.42,
  trustStatus: "trusted",
  alerts: [
    { id: "a1", severity: "medium", title: "Elevated dispute rate from BR region", description: "Chargeback rate for Pix transactions in Brazil rose to 0.8% over the last 7 days.", createdAt: iso(0, 5) },
    { id: "a2", severity: "low", title: "New device fingerprint cluster", description: "12 transactions share a new device fingerprint with elevated velocity.", createdAt: iso(1, 2) },
    { id: "a3", severity: "high", title: "Velocity rule triggered", description: "Card ending 4821 attempted 14 transactions in 60 seconds.", createdAt: iso(0, 1) },
  ],
  recommendations: [
    "Enable 3-D Secure for transactions above €500 in the BR region.",
    "Increase reserve to 10% for 14 days to cover projected chargebacks.",
    "Add velocity rule: max 5 attempts per card per 10 minutes.",
  ],
  history: series(30, 24, 6).map((s) => ({
    date: s.date,
    score: Math.round(s.value),
    chargebacks: Number((s.value * 0.02).toFixed(2)),
  })),
};

// ---- Products ----
export const mockProducts: Product[] = [
  { id: "prod_1", name: "Pro Plan (Annual)", description: "Annual subscription to XPayments Pro", price: 1188, currency: "EUR", active: true, sales: 342, createdAt: iso(120) },
  { id: "prod_2", name: "Starter Plan", description: "Monthly starter plan", price: 49, currency: "EUR", active: true, sales: 1284, createdAt: iso(200) },
  { id: "prod_3", name: "Enterprise License", description: "Enterprise annual license", price: 24000, currency: "USD", active: true, sales: 18, createdAt: iso(90) },
  { id: "prod_4", name: "Add-on: FX Hedging", description: "Advanced FX hedging module", price: 199, currency: "EUR", active: true, sales: 96, createdAt: iso(60) },
  { id: "prod_5", name: "Add-on: Risk AI", description: "AI-driven fraud scoring", price: 299, currency: "EUR", active: false, sales: 41, createdAt: iso(45) },
  { id: "prod_6", name: "API Overage Pack", description: "10M extra API calls", price: 500, currency: "USD", active: true, sales: 212, createdAt: iso(30) },
];

export const mockStores: Store[] = [
  { id: "store_1", name: "Main Store", domain: "shop.xpayments.digital", status: "active", products: 24, revenue: 1823400, currency: "EUR", createdAt: iso(200) },
  { id: "store_2", name: "EU Store", domain: "eu.xpayments.digital", status: "active", products: 18, revenue: 940200, currency: "EUR", createdAt: iso(150) },
  { id: "store_3", name: "BR Store", domain: "brasil.xpayments.digital", status: "active", products: 12, revenue: 1280000, currency: "BRL", createdAt: iso(120) },
  { id: "store_4", name: "Wholesale", domain: "wholesale.xpayments.digital", status: "paused", products: 6, revenue: 320000, currency: "USD", createdAt: iso(80) },
];

export const mockPaymentLinks: PaymentLink[] = Array.from({ length: 8 }).map((_, i) => ({
  id: id("pl", i),
  name: pick(["Pro Upgrade", "Invoice 1042", "Consulting", "Deposit", "Onboarding Fee", "Webinar Pass"]),
  url: `pay.xpayments.digital/l/${int(1000, 9999)}`,
  amount: float(20, 2000),
  currency: pick(currencies),
  status: pick(["active", "active", "inactive"] as const),
  visits: int(40, 4200),
  conversions: int(2, 380),
  createdAt: iso(int(0, 60)),
}));

export const mockInvoices: Invoice[] = Array.from({ length: 14 }).map((_, i) => ({
  id: id("inv", i),
  number: `INV-2025-${String(1000 + i).padStart(4, "0")}`,
  customer: pick(companies),
  amount: float(120, 9800),
  currency: pick(currencies),
  status: pick(["paid", "paid", "open", "overdue", "draft", "void"] as const),
  dueDate: iso(int(-5, 20)).slice(0, 10),
  createdAt: iso(int(0, 40)).slice(0, 10),
}));

export const mockSubscriptions: Subscription[] = Array.from({ length: 10 }).map((_, i) => ({
  id: id("sub", i),
  customer: pick(companies),
  plan: pick(["Starter", "Pro", "Enterprise", "Scale"]),
  amount: pick([49, 99, 299, 1200, 2400]),
  currency: "EUR",
  status: pick(["active", "active", "trialing", "past_due", "canceled"] as const),
  interval: pick(["month", "year"] as const),
  currentPeriodEnd: iso(int(-5, 30)).slice(0, 10),
}));

// ---- Developers ----
export const mockApiKeys: ApiKey[] = [
  { id: "key_1", name: "Production Server", prefix: "xp_live_", lastFour: "9a2f", scopes: ["read", "write", "payments"], createdAt: iso(120), lastUsedAt: iso(0, 1), environment: "live" },
  { id: "key_2", name: "Web App (test)", prefix: "xp_test_", lastFour: "11b8", scopes: ["read", "write"], createdAt: iso(60), lastUsedAt: iso(0, 4), environment: "test" },
  { id: "key_3", name: "Mobile SDK", prefix: "xp_live_", lastFour: "7c41", scopes: ["payments"], createdAt: iso(30), lastUsedAt: iso(1, 2), environment: "live" },
  { id: "key_4", name: "Webhook Signer", prefix: "xp_test_", lastFour: "3df9", scopes: ["read"], createdAt: iso(20), environment: "test" },
];

export const mockWebhooks: Webhook[] = [
  { id: "wh_1", url: "https://api.merchant.io/xp/events", events: ["payment.succeeded", "payment.failed", "payout.created"], status: "active", secret: "whsec_9f2a...d1", lastDeliveryAt: iso(0, 1), successRate: 99.4, createdAt: iso(80) },
  { id: "wh_2", url: "https://hooks.merchant.io/xp/refunds", events: ["refund.created", "dispute.opened"], status: "active", secret: "whsec_7b1c...e8", lastDeliveryAt: iso(0, 6), successRate: 97.1, createdAt: iso(40) },
  { id: "wh_3", url: "https://legacy.merchant.io/wh", events: ["payment.succeeded"], status: "disabled", secret: "whsec_2a09...c4", lastDeliveryAt: iso(12), successRate: 82.0, createdAt: iso(150) },
];

// ---- Treasury ----
export const mockTreasury: TreasuryOverview = {
  totalLiquidity: 3182940.66,
  reserve: 412000.0,
  pendingPayouts: 184200.0,
  netFlow: 284930.12,
  liquidityChange: 6.4,
  cashFlowSeries: series(30, 180000, 60000).map((s) => ({
    date: s.date,
    inflow: s.value,
    outflow: Number((s.value * 0.68).toFixed(2)),
  })),
  settlementSeries: series(14, 240000, 50000),
  balances: [
    { currency: "EUR", amount: 842310.55, changePct: 4.2 },
    { currency: "BRL", amount: 1298400.0, changePct: 8.7 },
    { currency: "USD", amount: 412980.22, changePct: -1.3 },
    { currency: "USDT", amount: 96450.75, changePct: 12.4 },
    { currency: "GBP", amount: 58210.9, changePct: 2.1 },
  ],
};

// ---- Admin ----
export const mockAdminMerchants: AdminMerchant[] = Array.from({ length: 28 }).map((_, i) => ({
  id: id("mch", i),
  name: pick(companies),
  email: emailFor(pick(firstNames)),
  country: pick(countries),
  status: pick(["active", "active", "active", "frozen", "suspended", "pending"] as const),
  riskScore: int(5, 88),
  revenue: float(20000, 4200000),
  volume: float(80000, 18000000),
  createdAt: iso(int(30, 400)),
  kycStatus: pick(["approved", "approved", "pending", "rejected", "not_submitted"] as const),
}));

export const mockKycQueue: KycReview[] = Array.from({ length: 7 }).map((_, i) => ({
  id: id("kyc", i),
  merchantName: pick(companies),
  merchantId: id("mch", i + 100),
  country: pick(countries),
  submittedAt: iso(int(0, 6)),
  status: "pending",
  documents: [
    { id: `d${i}1`, name: "Passport.pdf", type: "passport", pages: 2, sizeKb: 842 },
    { id: `d${i}2`, name: "Selfie.jpg", type: "selfie", pages: 1, sizeKb: 318 },
    { id: `d${i}3`, name: "Address_Proof.pdf", type: "address_proof", pages: 1, sizeKb: 210 },
  ],
  riskFlags: pick([[], ["PEP match (low)"], ["High-risk jurisdiction"], ["Sanctions watchlist proximity"]]),
}));

export const mockSystemHealth: SystemHealth = {
  status: "operational",
  uptime: 99.992,
  services: [
    { name: "API Gateway", status: "operational", latencyMs: 42 },
    { name: "Payments Engine", status: "operational", latencyMs: 88 },
    { name: "Wallet Service", status: "operational", latencyMs: 31 },
    { name: "Risk Engine", status: "operational", latencyMs: 56 },
    { name: "FX Service", status: "degraded", latencyMs: 240 },
    { name: "Webhook Dispatcher", status: "operational", latencyMs: 18 },
    { name: "Settlement", status: "operational", latencyMs: 120 },
  ],
  queues: [
    { name: "payments.high", pending: 12, processing: 38, throughput: 1840 },
    { name: "payments.normal", pending: 240, processing: 64, throughput: 920 },
    { name: "payouts", pending: 8, processing: 22, throughput: 310 },
    { name: "webhooks", pending: 140, processing: 48, throughput: 2240 },
    { name: "kyc", pending: 7, processing: 3, throughput: 12 },
  ],
  workers: [
    { name: "payment-workers-eu", active: 38, idle: 12, region: "eu-west-1" },
    { name: "payment-workers-us", active: 24, idle: 16, region: "us-east-1" },
    { name: "payout-workers", active: 22, idle: 8, region: "eu-west-1" },
    { name: "risk-workers", active: 14, idle: 6, region: "eu-west-1" },
  ],
};

// SDK code snippets
export const sdkSnippets: Record<string, string> = {
  curl: `curl https://api.xpayments.digital/api/v1/payments \\
  -H "Authorization: Bearer xp_live_9f2a4c1b" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 4200,
    "currency": "EUR",
    "method": "pix",
    "customer": "cus_001",
    "description": "Pro Plan — Annual"
  }'`,
  node: `import { XPayments } from "@xpayments/node";

const xp = new XPayments(process.env.XP_SECRET_KEY);

const payment = await xp.payments.create({
  amount: 4200,
  currency: "EUR",
  method: "pix",
  customer: "cus_001",
  description: "Pro Plan — Annual",
});

console.log(payment.id, payment.status);`,
  python: `import xpayments

xp = xpayments.Client(api_key="xp_live_...")

payment = xp.payments.create(
    amount=4200,
    currency="EUR",
    method="pix",
    customer="cus_001",
    description="Pro Plan — Annual",
)

print(payment.id, payment.status)`,
  php: `<?php
require 'vendor/autoload.php';

$xp = new XPayments\\Client(getenv('XP_SECRET_KEY'));

$payment = $xp->payments->create([
    'amount' => 4200,
    'currency' => 'EUR',
    'method' => 'pix',
    'customer' => 'cus_001',
    'description' => 'Pro Plan — Annual',
]);

echo $payment->id;`,
  go: `package main

import (
    "context"
    "fmt"
    "github.com/xpayments/go-sdk/xp"
)

func main() {
    client := xp.New(os.Getenv("XP_SECRET_KEY"))
    p, err := client.Payments.Create(context.Background(), &xp.PaymentParams{
        Amount: 4200, Currency: "EUR", Method: "pix",
        Customer: "cus_001", Description: "Pro Plan — Annual",
    })
    if err != nil { panic(err) }
    fmt.Println(p.ID, p.Status)
}`,
};
