"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

function PageFallback() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Per-view error boundary — if a single page (e.g. Analytics) crashes,
 * only that view shows an error card. The sidebar, topbar, and navigation
 * remain fully functional. The user can click another nav item to navigate
 * away, or hit "Retry" to re-mount the page.
 */
class ViewErrorBoundary extends React.Component<
  { children: React.ReactNode; viewKey: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; viewKey: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[ViewErrorBoundary] View crashed:", error?.message || error);
  }

  componentDidUpdate(prevProps: { viewKey: string }) {
    // Reset error when the view changes (user navigates to another page)
    if (prevProps.viewKey !== this.props.viewKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60 py-16 text-center">
          <div className="rounded-xl bg-amber-500/10 p-3">
            <svg
              className="h-6 w-6 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Verificar ligação à API
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Não foi possível carregar esta página. Pode continuar a navegar
              no menu lateral ou tentar novamente.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-load every page for code-splitting
const lazy = (loader: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(loader, { loading: () => <PageFallback />, ssr: false });

const merchantPages: Record<string, React.ComponentType> = {
  dashboard: lazy(() => import("@/components/merchant/dashboard")),
  analytics: lazy(() => import("@/components/merchant/analytics")),
  risk: lazy(() => import("@/components/merchant/risk")),
  payments: lazy(() => import("@/components/merchant/payments")),
  wallets: lazy(() => import("@/components/merchant/wallets")),
  fx: lazy(() => import("@/components/merchant/fx")),
  treasury: lazy(() => import("@/components/merchant/treasury")),
  stores: lazy(() => import("@/components/merchant/stores")),
  products: lazy(() => import("@/components/merchant/products")),
  customers: lazy(() => import("@/components/merchant/customers")),
  subscriptions: lazy(() => import("@/components/merchant/subscriptions")),
  "payment-links": lazy(() => import("@/components/merchant/payment-links")),
  invoices: lazy(() => import("@/components/merchant/invoices")),
  developers: lazy(() => import("@/components/merchant/developers")),
  "api-keys": lazy(() => import("@/components/merchant/api-keys")),
  webhooks: lazy(() => import("@/components/merchant/webhooks")),
  settings: lazy(() => import("@/components/merchant/settings")),
  support: lazy(() => import("@/components/merchant/support")),
};

const adminPages: Record<string, React.ComponentType> = {
  "admin-dashboard": lazy(() => import("@/components/admin/admin-dashboard")),
  "admin-merchants": lazy(() => import("@/components/admin/admin-merchants")),
  "admin-kyc": lazy(() => import("@/components/admin/admin-kyc")),
  "admin-treasury": lazy(() => import("@/components/admin/admin-treasury")),
  "admin-revenue": lazy(() => import("@/components/admin/admin-revenue")),
  "admin-gateways": lazy(() => import("@/components/admin/admin-gateways")),
  "admin-risk": lazy(() => import("@/components/admin/admin-risk")),
  "admin-analytics": lazy(() => import("@/components/admin/admin-analytics")),
  "admin-support": lazy(() => import("@/components/admin/admin-support")),
  "admin-health": lazy(() => import("@/components/admin/admin-health")),
  "admin-workers": lazy(() => import("@/components/admin/admin-workers")),
  "admin-queues": lazy(() => import("@/components/admin/admin-queues")),
  "admin-logs": lazy(() => import("@/components/admin/admin-logs")),
  "admin-flags": lazy(() => import("@/components/admin/admin-flags")),
  "admin-compliance": lazy(() => import("@/components/admin/admin-compliance")),
};

export function MerchantViewRouter({ view }: { view: string }) {
  const Page = merchantPages[view] ?? merchantPages.dashboard;
  return (
    <ViewErrorBoundary viewKey={view}>
      <Page />
    </ViewErrorBoundary>
  );
}

export function AdminViewRouter({ view }: { view: string }) {
  const Page = adminPages[view] ?? adminPages["admin-dashboard"];
  return (
    <ViewErrorBoundary viewKey={view}>
      <Page />
    </ViewErrorBoundary>
  );
}
