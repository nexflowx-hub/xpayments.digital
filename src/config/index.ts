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
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const merchantNav: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "risk", label: "Risk Center", icon: ShieldCheck },
    ],
  },
  {
    id: "money",
    label: "Money Movement",
    items: [
      { id: "payments", label: "Payments", icon: Receipt },
      { id: "wallets", label: "Wallets", icon: Wallet },
      { id: "fx", label: "FX", icon: ArrowLeftRight },
      { id: "treasury", label: "Treasury", icon: Banknote },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    items: [
      { id: "stores", label: "Stores", icon: Store },
      { id: "products", label: "Products", icon: Package },
      { id: "customers", label: "Customers", icon: Users },
      { id: "subscriptions", label: "Subscriptions", icon: Repeat },
      { id: "payment-links", label: "Payment Links", icon: Link2 },
      { id: "invoices", label: "Invoices", icon: FileText },
    ],
  },
  {
    id: "developers",
    label: "Developers",
    items: [
      { id: "developers", label: "Developers", icon: Code2 },
      { id: "api-keys", label: "API Keys", icon: KeyRound },
      { id: "webhooks", label: "Webhooks", icon: Webhook },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { id: "settings", label: "Settings", icon: Settings },
      { id: "support", label: "Support", icon: LifeBuoy },
    ],
  },
];

export const adminNav: NavSection[] = [
  {
    id: "platform",
    label: "Platform",
    items: [
      { id: "admin-dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "admin-merchants", label: "Merchants", icon: Building2 },
      { id: "admin-kyc", label: "KYC Queue", icon: ScrollText, badge: "7" },
      { id: "admin-treasury", label: "Treasury", icon: Landmark },
      { id: "admin-revenue", label: "Revenue", icon: Banknote },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      { id: "admin-gateways", label: "Gateways", icon: Server },
      { id: "admin-risk", label: "Risk", icon: ShieldCheck },
      { id: "admin-analytics", label: "Platform Analytics", icon: BarChart3 },
      { id: "admin-support", label: "Support", icon: LifeBuoy },
    ],
  },
  {
    id: "infra",
    label: "Infrastructure",
    items: [
      { id: "admin-health", label: "System Health", icon: Gauge },
      { id: "admin-workers", label: "Workers", icon: Cpu },
      { id: "admin-queues", label: "Queues", icon: Activity },
      { id: "admin-logs", label: "Logs", icon: FileText },
      { id: "admin-flags", label: "Feature Flags", icon: Flag },
      { id: "admin-compliance", label: "Compliance", icon: ShieldCheck },
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
