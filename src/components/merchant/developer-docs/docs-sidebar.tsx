"use client";

import * as React from "react";
import {
  BookOpen, ShieldCheck, CreditCard, Wallet, ExternalLink, Zap, AlertTriangle, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const NAV_SECTIONS = [
  { id: "overview", label: "Visão Geral", icon: BookOpen },
  { id: "auth", label: "Autenticação", icon: ShieldCheck },
  { id: "payments", label: "Pagamentos", icon: CreditCard },
  { id: "methods", label: "Métodos de Pagamento", icon: Wallet },
  { id: "checkout", label: "Checkout", icon: ExternalLink },
  { id: "webhooks", label: "Webhooks", icon: Zap },
  { id: "errors", label: "Erros", icon: AlertTriangle },
  { id: "security", label: "Segurança", icon: ShieldCheck },
  { id: "status", label: "Estado da API", icon: Activity },
] as const;

type SectionId = (typeof NAV_SECTIONS)[number]["id"];

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
      {/* Mobile dropdown */}
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
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop sidebar */}
      <nav className="sticky top-24 hidden h-[calc(100vh-7rem)] w-56 shrink-0 overflow-y-auto rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-xl md:block scrollbar-thin">
        <div className="space-y-0.5">
          {NAV_SECTIONS.map((s) => {
            const isActive = active === s.id;
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
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/* Hook: track active section via IntersectionObserver */
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
