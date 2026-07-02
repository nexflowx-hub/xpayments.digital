import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Banknote,
  Landmark,
  Store,
  Package,
  Users,
  Repeat,
  Link2,
  FileText,
  BarChart3,
  ShieldCheck,
  Code2,
  KeyRound,
  Webhook,
  Store as StoreIcon,
  Settings,
  LifeBuoy,
  Receipt,
  Building2,
  ScrollText,
  Server,
  Flag,
  Activity,
  Cpu,
  Gauge,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  /** i18n key for the label, e.g. "nav.dashboard" */
  tKey?: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  id: string;
  label: string;
  /** i18n key for the section label, e.g. "sec.overview" */
  tKey?: string;
  items: NavItem[];
}

export const merchantNav: NavSection[] = [
  {
    id: "overview", label: "Overview", tKey: "sec.overview",
    items: [
      { id: "dashboard", label: "Dashboard", tKey: "nav.dashboard", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", tKey: "nav.analytics", icon: BarChart3 },
      { id: "risk", label: "Risk Center", tKey: "nav.risk", icon: ShieldCheck },
    ],
  },
  {
    id: "money", label: "Money Movement", tKey: "sec.money",
    items: [
      { id: "payments", label: "Payments", tKey: "nav.payments", icon: Receipt },
      { id: "wallets", label: "Wallets", tKey: "nav.wallets", icon: Wallet },
      { id: "fx", label: "FX", tKey: "nav.fx", icon: ArrowLeftRight },
      { id: "treasury", label: "Treasury", tKey: "nav.treasury", icon: Banknote },
    ],
  },
  {
    id: "commerce", label: "Commerce", tKey: "sec.commerce",
    items: [
      { id: "stores", label: "Stores", tKey: "nav.stores", icon: Store },
      { id: "products", label: "Products", tKey: "nav.products", icon: Package },
      { id: "customers", label: "Customers", tKey: "nav.customers", icon: Users },
      { id: "subscriptions", label: "Subscriptions", tKey: "nav.subscriptions", icon: Repeat },
      { id: "payment-links", label: "Payment Links", tKey: "nav.paymentLinks", icon: Link2 },
      { id: "invoices", label: "Invoices", tKey: "nav.invoices", icon: FileText },
    ],
  },
  {
    id: "developers", label: "Developers", tKey: "sec.developers",
    items: [
      { id: "developers", label: "Developers", tKey: "nav.developers", icon: Code2 },
      { id: "api-keys", label: "API Keys", tKey: "nav.apiKeys", icon: KeyRound },
      { id: "webhooks", label: "Webhooks", tKey: "nav.webhooks", icon: Webhook },
    ],
  },
  {
    id: "system", label: "System", tKey: "sec.system",
    items: [
      { id: "settings", label: "Settings", tKey: "nav.settings", icon: Settings },
      { id: "support", label: "Support", tKey: "nav.support", icon: LifeBuoy },
    ],
  },
];

export const adminNav: NavSection[] = [
  {
    id: "platform", label: "Platform", tKey: "sec.platform",
    items: [
      { id: "admin-dashboard", label: "Overview", tKey: "nav.adminDashboard", icon: LayoutDashboard },
      { id: "admin-merchants", label: "Merchants", tKey: "nav.adminMerchants", icon: Building2 },
      { id: "admin-kyc", label: "KYC Queue", tKey: "nav.adminKyc", icon: ScrollText, badge: "7" },
      { id: "admin-treasury", label: "Treasury", tKey: "nav.adminTreasury", icon: Landmark },
      { id: "admin-revenue", label: "Revenue", tKey: "nav.adminRevenue", icon: Banknote },
    ],
  },
  {
    id: "ops", label: "Operations", tKey: "sec.ops",
    items: [
      { id: "admin-gateways", label: "Gateways", tKey: "nav.adminGateways", icon: Server },
      { id: "admin-risk", label: "Risk", tKey: "nav.adminRisk", icon: ShieldCheck },
      { id: "admin-analytics", label: "Platform Analytics", tKey: "nav.adminAnalytics", icon: BarChart3 },
      { id: "admin-support", label: "Support", tKey: "nav.adminSupport", icon: LifeBuoy },
    ],
  },
  {
    id: "infra", label: "Infrastructure", tKey: "sec.infra",
    items: [
      { id: "admin-health", label: "System Health", tKey: "nav.adminHealth", icon: Gauge },
      { id: "admin-workers", label: "Workers", tKey: "nav.adminWorkers", icon: Cpu },
      { id: "admin-queues", label: "Queues", tKey: "nav.adminQueues", icon: Activity },
      { id: "admin-logs", label: "Logs", tKey: "nav.adminLogs", icon: FileText },
      { id: "admin-flags", label: "Feature Flags", tKey: "nav.adminFlags", icon: Flag },
      { id: "admin-compliance", label: "Compliance", tKey: "nav.adminCompliance", icon: ShieldCheck },
    ],
  },
];

export const PAYMENT_METHODS = [
  { id: "visa", label: "Visa", color: "#1A1F71" },
  { id: "mastercard", label: "Mastercard", color: "#EB001B" },
  { id: "pix", label: "Pix", color: "#00B89C" },
  { id: "apple_pay", label: "Apple Pay", color: "#FFFFFF" },
  { id: "google_pay", label: "Google Pay", color: "#4285F4" },
  { id: "mbway", label: "MBWay", color: "#00B14E" },
  { id: "crypto", label: "Crypto", color: "#F7931A" },
  { id: "sepa", label: "SEPA", color: "#003399" },
] as const;

export const CURRENCIES = [
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "BRL", symbol: "R$", flag: "🇧🇷" },
  { code: "GBP", symbol: "£", flag: "🇬🇧" },
  { code: "USDT", symbol: "₮", flag: "◈" },
  { code: "BTC", symbol: "₿", flag: "◉" },
] as const;

export const COUNTRY_LIST = [
  "Portugal",
  "Brazil",
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Netherlands",
  "Ireland",
  "Singapore",
];

export const APP_NAME = "XPayments";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.xpayments.digital/api/v1";
