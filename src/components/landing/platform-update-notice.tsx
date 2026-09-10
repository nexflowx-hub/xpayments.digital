"use client";

import * as React from "react";
import { ArrowRight, Gauge, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "xpayments-platform-update-2026-09-v1-dismissed";

export function PlatformUpdateNotice() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      setVisible(sessionStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const close = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Session storage may be unavailable; closing still works for this render.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="xpayments-platform-update-title"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 p-5 text-white shadow-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-16 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />

        <button
          type="button"
          onClick={close}
          aria-label="Fechar aviso"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative pr-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
            <Sparkles className="h-3.5 w-3.5" /> XPayments Platform Update
          </div>

          <h2 id="xpayments-platform-update-title" className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
            Novos fluxos API e infraestrutura de pagamentos em evolução.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
            Estamos a expandir a Developer Platform com Store-scoped APIs, Checkout XPay, Native S2S, Stripe-compatible Direct, novos meios de pagamento e documentação técnica consolidada.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-300/[0.07] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-200">
                <Gauge className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-100">Rails D0 · disponível no plano Premium</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Estruturas de liquidação operacional acelerada, sujeitas a elegibilidade, limites, risco, moeda e configuração do Merchant.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <a
              href="https://docs.xpayments.digital"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
            >
              Explorar Developer Platform
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="https://xpay.expert"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Conhecer Rails D0 · Premium
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <button
            type="button"
            onClick={close}
            className="mt-4 text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
          >
            Continuar para a XPayments
          </button>
        </div>
      </div>
    </div>
  );
}
