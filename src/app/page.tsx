"use client";

import * as React from "react";
import { useAuth } from "@/stores/auth";
import { useUi } from "@/stores/ui";
import { useI18n } from "@/lib/i18n";
import { DashboardShell } from "@/components/dashboard/shell";
import { MerchantViewRouter, AdminViewRouter } from "@/components/dashboard/view-router";
import { AuthScreen } from "@/components/auth/auth-screen";
import { XSymbol } from "@/components/shared/x-symbol";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const LandingPage = dynamic(() => import("@/components/landing/landing-page"), { ssr: false, loading: () => <SplashScreen /> });

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

function NetworkErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <XSymbol className="h-12 w-12" />
        <div>
          <h2 className="text-lg font-semibold">Não foi possível validar a sessão</h2>
          <p className="mt-1 text-sm text-muted-foreground">Verifique a sua ligação e tente novamente.</p>
        </div>
        <Button onClick={onRetry} className="gap-2">Tentar novamente</Button>
      </div>
    </div>
  );
}

export default function Home() {
  const isAuthenticated = useAuth((s) => s.authenticated);
  const user = useAuth((s) => s.user);
  const hydrate = useAuth((s) => s.hydrate);
  const hydrated = useAuth((s) => s.hydrated);
  const sessionChecked = useAuth((s) => s.sessionChecked);
  const sessionStatus = useAuth((s) => s.sessionStatus);
  const networkError = useAuth((s) => s.networkError);
  const retrySession = useAuth((s) => s.retrySession);
  const appView = useUi((s) => s.appView);
  const setAppView = useUi((s) => s.setAppView);
  const activeMerchantView = useUi((s) => s.activeMerchantView);
  const activeAdminView = useUi((s) => s.activeAdminView);
  const detectLocale = useI18n((s) => s.detect);
  const [mounted, setMounted] = React.useState(false);
  const [wasAuthenticated, setWasAuthenticated] = React.useState(false);

  React.useEffect(() => { hydrate(); detectLocale(); setMounted(true); /* eslint-disable-next-line */ }, []);

  React.useEffect(() => { if (isAuthenticated) setWasAuthenticated(true); }, [isAuthenticated]);

  React.useEffect(() => {
    if (mounted && sessionChecked && !isAuthenticated && wasAuthenticated) {
      toast.info("A sua sessão expirou. Entre novamente.");
      setWasAuthenticated(false);
    }
  }, [mounted, sessionChecked, isAuthenticated, wasAuthenticated]);

  React.useEffect(() => {
    if (mounted && sessionChecked && !isAuthenticated && (appView === "merchant" || appView === "admin")) {
      setAppView("landing");
    }
  }, [mounted, sessionChecked, isAuthenticated, appView, setAppView]);

  if (!mounted) return <SplashScreen />;

  // Network error — show retry screen (DON'T clear session)
  if (networkError && !isAuthenticated) {
    return <NetworkErrorScreen onRetry={() => retrySession()} />;
  }

  // Hydrating or checking session — controlled loading
  if (!hydrated || (isAuthenticated && !sessionChecked)) {
    return <SplashScreen />;
  }

  // Authenticated + session validated
  if (isAuthenticated && user && sessionChecked) {
    if (user.role === "admin") {
      return (<DashboardShell mode="admin"><AdminViewRouter view={activeAdminView} /></DashboardShell>);
    }
    return (<DashboardShell mode="merchant"><MerchantViewRouter view={activeMerchantView} /></DashboardShell>);
  }

  // Unauthenticated + session checked
  if (!isAuthenticated && (appView === "merchant" || appView === "admin")) {
    return <SplashScreen />;
  }
  if (appView === "login" || appView === "forgot" || appView === "reset") {
    return <AuthScreen />;
  }
  return <LandingPage />;
}
