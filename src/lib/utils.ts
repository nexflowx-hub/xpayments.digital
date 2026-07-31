import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Currency formatting (pt-PT, full values, NO K/M compression) ----

const fmtCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  const key = currency;
  let fmt = fmtCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    fmtCache.set(key, fmt);
  }
  return fmt;
}

/**
 * Format a number as currency using pt-PT locale.
 * Always shows full value with 2 decimal places.
 * Example: formatCurrency(8092.25, "EUR") → "€ 8.092,25"
 */
export function formatCurrency(value: number, currency = "EUR"): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return getCurrencyFormatter(currency).format(value);
}

export function formatNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-PT").format(value);
}

export function formatPercent(value: number, dp = 1) {
  return `${value.toFixed(dp)}%`;
}

/**
 * Format an ISO date string for display.
 * Handles null/undefined gracefully, returns "—".
 */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Format an ISO date string in civil (DD/MM/YYYY) format for financial displays.
 * Timezone-safe: parses the date string directly without Date constructor,
 * so "2026-07-27" always produces "27/07/2026" regardless of browser timezone.
 */
export function formatDateCivil(value?: string | null): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return "—";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function formatDateFull(iso?: string | null, opts?: { withTime?: boolean }): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    if (opts?.withTime) {
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  } catch {
    return "—";
  }
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function maskKey(key: string) {
  if (key.length <= 8) return key;
  return `${key.slice(0, 8)}${"•".repeat(20)}${key.slice(-4)}`;
}

// ---- FX display formatting ----

const fmtBrlCache = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Format an amount in a display currency using the given FX rate.
 * - BRL: pt-BR locale, 2 decimals.
 * - USDT: 2-4 decimals (more precision for small values).
 */
export function formatFxAmount(eurAmount: number, quoteCurrency: "BRL" | "USDT", rate: number): string {
  const converted = eurAmount * rate;
  if (quoteCurrency === "BRL") {
    return fmtBrlCache.format(converted);
  }
  // USDT: adaptive decimals (2-4)
  const abs = Math.abs(converted);
  const dp = abs >= 100 ? 2 : abs >= 1 ? 3 : 4;
  const formatted = converted.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
  return `${formatted} USDT`;
}
