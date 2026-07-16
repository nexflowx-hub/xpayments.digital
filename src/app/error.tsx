"use client";

import * as React from "react";
import { XSymbol } from "@/components/shared/x-symbol";
import { Button } from "@/components/ui/button";
import { clearAuthenticationStorage } from "@/lib/storage/xp-storage";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  React.useEffect(() => { console.error("[XPayments] Uncaught error:", error); }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <XSymbol className="h-12 w-12" />
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <div className="rounded-xl bg-amber-500/10 p-3">
          <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Algo correu mal</h2>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Pode tentar novamente, voltar ao login ou reiniciar a sessão.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Retry — clears React error state and re-validates session */}
          <Button onClick={reset} className="gap-2">Tentar novamente</Button>
          {/* Login — clears auth and redirects */}
          <Button variant="outline" onClick={() => {
            clearAuthenticationStorage();
            window.location.replace("/?view=login");
          }}>Voltar ao login</Button>
          {/* Full recovery — clears all auth storage and reloads */}
          <Button variant="ghost" onClick={() => {
            clearAuthenticationStorage();
            window.location.replace("/?view=login&reason=recovery");
          }}>Reiniciar sessão</Button>
        </div>
      </div>
    </div>
  );
}
