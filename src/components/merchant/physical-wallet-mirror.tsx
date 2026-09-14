"use client";

import * as React from "react";
import { ExternalLink, Landmark, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import { useTreasury } from "@/hooks/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type TreasuryWallet = {
  id: string;
  code: string;
  label: string;
  currency: string;
  role: string;
  ecosystem?: string | null;
  status: string;
  balance: number;
  available: number;
  reserved: number;
  physical?: boolean;
  manualSettlement?: boolean;
  autoFx?: boolean;
  updatedAt?: string;
};

type TreasuryExtended = {
  physicalWallets?: TreasuryWallet[];
  financialMetrics?: string;
  legacyCrossCurrencyTotalsDeprecated?: boolean;
};

function destination(wallet: TreasuryWallet) {
  const code = wallet.code.toUpperCase();
  const ecosystem = String(wallet.ecosystem || "").toLowerCase();
  if (wallet.role.toUpperCase() === "BLOCKED") return null;
  if (code === "WALLET-BRL" || ecosystem.includes("pagarpix")) {
    return { label: "Abrir PagarPIX", href: "https://app.pagarpix.org" };
  }
  if (code === "WALLET-USDT" || ecosystem.includes("atlaswallet")) {
    return { label: "Abrir AtlasWallet", href: "https://atlaswallet.org" };
  }
  return null;
}

function SettlementWalletCard({ wallet }: { wallet: TreasuryWallet }) {
  const target = destination(wallet);
  const isBrl = wallet.code.toUpperCase() === "WALLET-BRL";

  return (
    <Card className="relative overflow-hidden border-cyan-500/25 bg-gradient-to-br from-cyan-500/[0.08] via-card/75 to-card/55 p-5 shadow-[0_0_40px_-14px_rgba(34,211,238,0.42)]">
      <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300"><Landmark className="h-5 w-5" /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{wallet.label || wallet.code}</p>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">Física</span>
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{wallet.code} · {wallet.currency} · {wallet.ecosystem || "XPayments Treasury"}</p>
            </div>
          </div>
          <ShieldCheck className="h-4 w-4 text-cyan-300/80" />
        </div>

        <p className="mt-5 text-xs text-muted-foreground">Saldo físico</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatCurrency(wallet.balance ?? 0, wallet.currency)}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-muted-foreground">Disponível</span><p className="mt-0.5 font-mono font-medium tabular-nums">{formatCurrency(wallet.available ?? 0, wallet.currency)}</p></div>
          <div><span className="text-muted-foreground">Reservado</span><p className="mt-0.5 font-mono font-medium tabular-nums">{formatCurrency(wallet.reserved ?? 0, wallet.currency)}</p></div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-500/10 pt-4">
          <p className="max-w-md text-[10px] leading-relaxed text-muted-foreground">
            {isBrl ? "Conta BRL de settlement operacional. Conversões, custos e créditos são validados manualmente pela XPayments." : "Conta de settlement física separada do ledger contabilístico."}
          </p>
          {target ? (
            <Button asChild variant="outline" size="sm" className="border-cyan-500/25 bg-cyan-500/[0.05] text-cyan-200 hover:bg-cyan-500/10">
              <a href={target.href} target="_blank" rel="noreferrer">{target.label}<ExternalLink className="ml-1.5 h-3.5 w-3.5" /></a>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function BlockedWalletCard({ wallet }: { wallet: TreasuryWallet }) {
  return (
    <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/[0.10] via-card/80 to-card/55 p-5 shadow-[0_0_38px_-16px_rgba(245,158,11,0.45)]">
      <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-2 text-amber-300"><LockKeyhole className="h-5 w-5" /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{wallet.label || wallet.code}</p>
                <span className="rounded-full border border-amber-500/25 bg-amber-500/[0.10] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">Bloqueada</span>
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{wallet.code} · {wallet.currency} · Treasury interno</p>
            </div>
          </div>
          <LockKeyhole className="h-4 w-4 text-amber-300/80" />
        </div>

        <p className="mt-5 text-xs text-muted-foreground">Saldo bloqueado</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatCurrency(wallet.balance ?? 0, wallet.currency)}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-muted-foreground">Disponível</span><p className="mt-0.5 font-mono font-medium tabular-nums">{formatCurrency(wallet.available ?? 0, wallet.currency)}</p></div>
          <div><span className="text-muted-foreground">Bloqueado / reservado</span><p className="mt-0.5 font-mono font-medium tabular-nums">{formatCurrency(wallet.reserved ?? wallet.balance ?? 0, wallet.currency)}</p></div>
        </div>

        <div className="mt-4 border-t border-amber-500/10 pt-4">
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Fundos retidos por decisão operacional. Não estão disponíveis para payout ou conversão enquanto o bloqueio não for libertado manualmente pela XPayments. Cada moeda permanece segregada e não é somada a outras moedas.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function PhysicalWalletMirror() {
  const { data, isLoading, isError, refetch } = useTreasury();
  const treasury = (data ?? {}) as typeof data & TreasuryExtended;
  const treasuryWallets = treasury?.physicalWallets ?? [];
  const blockedWallets = treasuryWallets.filter((wallet) => wallet.role?.toUpperCase() === "BLOCKED");
  const settlementWallets = treasuryWallets.filter((wallet) => wallet.role?.toUpperCase() !== "BLOCKED");

  if (isLoading) {
    return <div className="h-44 animate-pulse rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03]" />;
  }

  if (isError) {
    return (
      <Card className="border-cyan-500/15 bg-cyan-500/[0.03] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Treasury</p>
            <p className="mt-1 text-xs text-muted-foreground">O espelho Treasury não está disponível neste momento. As wallets contabilísticas continuam inalteradas.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold">Treasury · liquidação e bloqueios</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Contas físicas de settlement e saldos bloqueados são separados das wallets contabilísticas e mantidos por moeda.
          </p>
        </div>
        <span className="hidden rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 sm:inline-flex">
          Treasury · read-only
        </span>
      </div>

      {treasuryWallets.length === 0 ? (
        <Card className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] via-card/70 to-card/50 p-5 shadow-[0_0_34px_-14px_rgba(34,211,238,0.35)]">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300"><WalletCards className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold">Treasury Wallet</p>
              <p className="mt-1 text-xs text-muted-foreground">Aguarda disponibilização do read-model Treasury no XPayments Core. Nenhum saldo contabilístico é apresentado como saldo físico.</p>
            </div>
          </div>
        </Card>
      ) : null}

      {settlementWallets.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300/80">Contas físicas de liquidação</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {settlementWallets.map((wallet) => <SettlementWalletCard key={wallet.id} wallet={wallet} />)}
          </div>
        </div>
      ) : null}

      {blockedWallets.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">Wallet-Block · fundos bloqueados</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {blockedWallets.map((wallet) => <BlockedWalletCard key={wallet.id} wallet={wallet} />)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
