"use client";

import * as React from "react";
import { XSymbol } from "@/components/shared/x-symbol";

/**
 * Root error boundary — catches uncaught exceptions from any component.
 *
 * Instead of showing a full-screen white/black page, we render the app shell
 * chrome (dark background, logo) with a compact error card. This way the user
 * still sees the XPayments branding and can retry, rather than a scary blank
 * page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log to console for debugging (production should send to Sentry etc.)
    console.error("[XPayments] Uncaught error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <XSymbol className="h-12 w-12" />
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
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
        <h2 className="text-lg font-semibold text-foreground">
          Verificar ligação à API
        </h2>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro de comunicação com o servidor. Pode continuar a
          navegar — algumas funcionalidades podem estar temporariamente
          indisponíveis.
        </p>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
