"use client";

import * as React from "react";
import { useAuth } from "@/stores/auth";
import { useUi } from "@/stores/ui";
import { useI18n } from "@/lib/i18n";
import { DashboardShell } from "@/components/dashboard/shell";
import { MerchantViewRouter, AdminViewRouter } from "@/components/dashboard/view-router";
import { AuthScreen } from "@/components/auth/auth-screen";
import { XSymbol } from "@/components/shared/x-symbol";
import { toast } from "sonner";
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
  // Selectors — avoid re-rendering on unrelated state changes
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const user = useAuth((s) => s.user);
  const hydrate = useAuth((s) => s.hydrate);
  const hydrated = useAuth((s) => s.hydrated);
  const sessionChecked = useAuth((s) => s.sessionChecked);
  const appView = useUi((s) => s.appView);
  const setAppView = useUi((s) => s.setAppView);
  const activeMerchantView = useUi((s) => s.activeMerchantView);
  const activeAdminView = useUi((s) => s.activeAdminView);
  const detectLocale = useI18n((s) => s.detect);
  const [mounted, setMounted] = React.useState(false);
  const [wasAuthenticated, setWasAuthenticated] = React.useState(false);

  // Bootstrap: hydrate auth + detect locale (mount only)
  React.useEffect(() => {
    hydrate();
    detectLocale();
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track if user WAS authenticated (to show "session expired" message)
  React.useEffect(() => {
    if (isAuthenticated) setWasAuthenticated(true);
  }, [isAuthenticated]);

  // Show "session expired" toast when session is checked and user was previously authenticated
  React.useEffect(() => {
    if (mounted && sessionChecked && !isAuthenticated && wasAuthenticated) {
      toast.info("A sua sessão expirou. Entre novamente.");
      setWasAuthenticated(false);
    }
  }, [mounted, sessionChecked, isAuthenticated, wasAuthenticated]);

  // Reset to landing when signed out
  React.useEffect(() => {
    if (mounted && sessionChecked && !isAuthenticated && (appView === "merchant" || appView === "admin")) {
      setAppView("landing");
    }
  }, [mounted, sessionChecked, isAuthenticated, appView, setAppView]);

  // STATE 1: Not mounted yet — splash screen
  if (!mounted) return <SplashScreen />;

  // STATE 2: Hydrating or checking session — controlled loading screen
  // Never render the dashboard with partial state
  if (!hydrated || (isAuthenticated && !sessionChecked)) {
    return <SplashScreen />;
  }

  // STATE 3: Authenticated + session validated → dashboard
  if (isAuthenticated && user && sessionChecked) {
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

  // STATE 4: Unauthenticated + session checked → auth screens or landing
  // Guard: if unauthenticated but appView is merchant/admin, show splash
  // (the useEffect above will reset to landing, but we don't want to flash the shell)
  if (!isAuthenticated && (appView === "merchant" || appView === "admin")) {
    return <SplashScreen />;
  }

  if (appView === "login" || appView === "forgot" || appView === "reset") {
    return <AuthScreen />;
  }
  return <LandingPage />;
}
