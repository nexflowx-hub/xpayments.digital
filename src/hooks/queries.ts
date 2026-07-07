"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { xpApi } from "@/lib/api/xpApi";
import type { DataTableFilters, CurrencyCode } from "@/types";

// ---- Analytics / Risk / Treasury ----
export function useAnalyticsOverview() {
  return useQuery({ queryKey: ["analytics", "overview"], queryFn: () => xpApi.analytics.overview() });
}
export function useRiskProfile() {
  return useQuery({ queryKey: ["risk", "profile"], queryFn: () => xpApi.risk.profile() });
}
export function useTreasury() {
  return useQuery({ queryKey: ["treasury", "overview"], queryFn: () => xpApi.treasury.overview() });
}

// ---- Wallets ---- (list endpoints return T[] directly after envelope unwrap)
export function useWallets() {
  return useQuery({ queryKey: ["wallets"], queryFn: () => xpApi.wallets.list(), select: (d) => d ?? [] });
}
export function useWalletMovements(walletId?: string) {
  return useQuery({ queryKey: ["wallets", "movements", walletId], queryFn: () => xpApi.wallets.movements(walletId), select: (d) => d ?? [] });
}
export function useWalletSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { from: CurrencyCode; to: CurrencyCode; amount: number }) =>
      xpApi.wallets.swap(v.from, v.to, v.amount),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallets"] }); qc.invalidateQueries({ queryKey: ["wallets", "movements"] }); },
  });
}
export function useWalletDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { currency: CurrencyCode; amount: number; method: string }) =>
      xpApi.wallets.deposit(v.currency, v.amount, v.method),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallets"] }); qc.invalidateQueries({ queryKey: ["wallets", "movements"] }); },
  });
}
export function useWalletPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { currency: CurrencyCode; amount: number; beneficiary: string }) =>
      xpApi.wallets.payout(v.currency, v.amount, v.beneficiary),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallets"] }); qc.invalidateQueries({ queryKey: ["wallets", "movements"] }); },
  });
}

// ---- Transactions ---- (returns Paginated<T> with its own .data field)
export function useTransactions(filters: DataTableFilters) {
  return useQuery({ queryKey: ["transactions", filters], queryFn: () => xpApi.transactions.list(filters) });
}

// ---- Customers ----
export function useCustomers() {
  return useQuery({ queryKey: ["customers"], queryFn: () => xpApi.customers.list(), select: (d) => d ?? [] });
}

// ---- Products / Stores / Links / Invoices / Subscriptions ----
export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: () => xpApi.products.list(), select: (d) => d ?? [] });
}
export function useStores() {
  return useQuery({ queryKey: ["stores"], queryFn: () => xpApi.stores.list(), select: (d) => d ?? [] });
}
export function usePaymentLinks() {
  return useQuery({ queryKey: ["payment-links"], queryFn: () => xpApi.paymentLinks.list(), select: (d) => d ?? [] });
}
export function useInvoices() {
  return useQuery({ queryKey: ["invoices"], queryFn: () => xpApi.invoices.list(), select: (d) => d ?? [] });
}
export function useSubscriptions() {
  return useQuery({ queryKey: ["subscriptions"], queryFn: () => xpApi.subscriptions.list(), select: (d) => d ?? [] });
}

// ---- Developers ----
export function useApiKeys() {
  return useQuery({ queryKey: ["api-keys"], queryFn: () => xpApi.apiKeys.list(), select: (d) => d ?? [] });
}
export function useWebhooks() {
  return useQuery({ queryKey: ["webhooks"], queryFn: () => xpApi.webhooks.list(), select: (d) => d ?? [] });
}

// ---- Admin ----
export function useAdminMerchants() {
  return useQuery({ queryKey: ["admin", "merchants"], queryFn: () => xpApi.admin.merchants(), select: (d) => d ?? [] });
}
export function useAdminKyc() {
  return useQuery({ queryKey: ["admin", "kyc"], queryFn: () => xpApi.admin.kycQueue(), select: (d) => d ?? [] });
}
export function useAdminTreasury() {
  return useQuery({ queryKey: ["admin", "treasury"], queryFn: () => xpApi.admin.treasury() });
}
export function useAdminHealth() {
  return useQuery({ queryKey: ["admin", "health"], queryFn: () => xpApi.admin.health() });
}
export function useAdminRevenue() {
  return useQuery({ queryKey: ["admin", "revenue"], queryFn: () => xpApi.admin.revenue() });
}
