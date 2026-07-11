"use client";

import * as React from "react";
import { useAuth } from "@/stores/auth";
import { useUi } from "@/stores/ui";
import { useI18n } from "@/lib/i18n";
import { DashboardShell } from "@/components/dashboard/shell";
import { MerchantViewRouter, AdminViewRouter } from "@/components/dashboard/view-router";
import { AuthScreen } from "@/components/auth/auth-screen";
import { XSymbol } from "@/components/shared/x-symbol";
import dynamic from "next/dynamic";

const LandingPage = dynamic(() => import("@/components/landing/landing-page"), {
  ssr: false,
  loading: () => <SplashScreen />,
});

function SplashScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <XSymbol className="h-12 w-12" />
        <p className="text-sm text-muted-foreground">Loading XPayments…</p>
      </div>
    </div>
  );
}

export default function Home() {
  // Use selectors to avoid re-rendering on unrelated store changes
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const user = useAuth((s) => s.user);
  const hydrate = useAuth((s) => s.hydrate);
  const appView = useUi((s) => s.appView);
  const setAppView = useUi((s) => s.setAppView);
  const activeMerchantView = useUi((s) => s.activeMerchantView);
  const activeAdminView = useUi((s) => s.activeAdminView);
  const detectLocale = useI18n((s) => s.detect);
  const [mounted, setMounted] = React.useState(false);

  // Hydrate auth + detect locale on mount only (empty deps)
  React.useEffect(() => {
    hydrate();
    detectLocale();
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to landing when signed out
  React.useEffect(() => {
    if (mounted && !isAuthenticated && (appView === "merchant" || appView === "admin")) {
      setAppView("landing");
    }
  }, [mounted, isAuthenticated, appView, setAppView]);

  if (!mounted) return <SplashScreen />;

  // Guard: if unauthenticated but appView is merchant/admin, show splash
  if (!isAuthenticated && (appView === "merchant" || appView === "admin")) {
    return <SplashScreen />;
  }

  if (isAuthenticated && user) {
    if (user.role === "admin") {
      return (
        <DashboardShell mode="admin">
          <AdminViewRouter view={activeAdminView} />
        </DashboardShell>
      );
    }
    return (
      <DashboardShell mode="merchant">
        <MerchantViewRouter view={activeMerchantView} />
      </DashboardShell>
    );
  }

  // Guest → auth screens or landing
  if (appView === "login" || appView === "forgot" || appView === "reset") {
    return <AuthScreen />;
  }
  return <LandingPage />;
}
