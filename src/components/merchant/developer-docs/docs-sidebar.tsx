"use client";

import * as React from "react";
import {
  BookOpen,
  ShieldCheck,
  CreditCard,
  Wallet,
  ExternalLink,
  Zap,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const NAV_SECTIONS = [
  { id: "overview", label: "Visão Geral S2S", icon: BookOpen, state: "active" },
  { id: "auth", label: "Autenticação", icon: ShieldCheck, state: "active" },
  { id: "payments", label: "Criar Pagamento", icon: CreditCard, state: "active" },
  { id: "methods", label: "Métodos S2S", icon: Wallet, state: "active" },
  { id: "webhooks", label: "Webhooks Merchant", icon: Zap, state: "active" },
  { id: "checkout", label: "Checkout", icon: ExternalLink, state: "maintenance" },
  { id: "errors", label: "Referência de Erros", icon: AlertTriangle, state: "maintenance" },
  { id: "security", label: "Guia de Segurança", icon: ShieldCheck, state: "maintenance" },
  { id: "status", label: "Estado da API", icon: Activity, state: "maintenance" },
] as const;

interface DocsSidebarProps {
  active: string;
  onSelect: (id: string) => void;
}

export function DocsSidebar({ active, onSelect }: DocsSidebarProps) {
  const handleClick = (id: string) => {
    onSelect(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="sticky top-0 z-30 mb-4 border-b border-border/60 bg-background/80 backdrop-blur-lg md:hidden">
        <div className="p-4 pb-3">
          <Select value={active} onValueChange={handleClick}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NAV_SECTIONS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <s.icon className="h-3.5 w-3.5" />
                    {s.label}
                    {s.state === "maintenance" && (
                      <span className="text-[9px] uppercase tracking-wide text-amber-400">
                        manutenção
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <nav className="sticky top-24 hidden h-[calc(100vh-7rem)] w-60 shrink-0 overflow-y-auto rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-xl md:block scrollbar-thin">
        <div className="space-y-0.5">
          {NAV_SECTIONS.map((s) => {
            const isActive = active === s.id;
            const maintenance = s.state === "maintenance";

            return (
              <button
                key={s.id}
                onClick={() => handleClick(s.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                {maintenance && (
                  <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-400">
                    manutenção
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function useActiveSection() {
  const [active, setActive] = React.useState("overview");

  React.useEffect(() => {
    const ids = NAV_SECTIONS.map((s) => s.id);
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-20% 0px -70% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return active;
}
