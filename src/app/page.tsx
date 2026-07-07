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
  const { isAuthenticated, user, hydrate } = useAuth();
  const { appView, setAppView, activeMerchantView, activeAdminView } = useUi();
  const detectLocale = useI18n((s) => s.detect);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    hydrate();
    detectLocale();
    setMounted(true);
  }, [hydrate, detectLocale]);

  // Reset to landing when signed out
  React.useEffect(() => {
    if (mounted && !isAuthenticated && (appView === "merchant" || appView === "admin")) {
      setAppView("landing");
    }
  }, [mounted, isAuthenticated, appView, setAppView]);

  if (!mounted) return <SplashScreen />;

  // Authenticated → dashboard by role
  // Guard: if unauthenticated but appView is merchant/admin, show splash
  // to avoid rendering the shell with a null user (which crashes TopBar).
  if (mounted && !isAuthenticated && (appView === "merchant" || appView === "admin")) {
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
