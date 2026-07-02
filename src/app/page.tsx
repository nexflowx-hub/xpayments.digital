"use client";

import * as React from "react";
import { useAuth } from "@/stores/auth";
import { useUi } from "@/stores/ui";
import { DashboardShell } from "@/components/dashboard/shell";
import { MerchantViewRouter, AdminViewRouter } from "@/components/dashboard/view-router";
import { AuthScreen } from "@/components/auth/auth-screen";
import dynamic from "next/dynamic";

const LandingPage = dynamic(() => import("@/components/landing/landing-page"), {
  ssr: false,
  loading: () => <SplashScreen />,
});

function SplashScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/40">
          <span className="text-xl font-bold text-white">X</span>
          <div className="absolute inset-0 animate-ping rounded-xl bg-primary/40" />
        </div>
        <p className="text-sm text-muted-foreground">Loading XPayments…</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user, hydrate } = useAuth();
  const { appView, setAppView, activeMerchantView, activeAdminView } = useUi();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  // Reset to landing when signed out
  React.useEffect(() => {
    if (mounted && !isAuthenticated && (appView === "merchant" || appView === "admin")) {
      setAppView("landing");
    }
  }, [mounted, isAuthenticated, appView, setAppView]);

  if (!mounted) return <SplashScreen />;

  // Authenticated → dashboard by role
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
