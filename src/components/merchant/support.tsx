"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  LifeBuoy, MessageCircle, Send, Users, BookOpen, Info,
  ExternalLink, Clock,
} from "lucide-react";
import { PageHeader, fadeUp } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---- Real contact links ----
const CONTACT_CHANNELS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: "+62 9 9409-1930",
    url: "https://wa.me/5562994091930",
    desc: "Resposta rápida via mensagem direta.",
    icon: MessageCircle,
    accent: "text-emerald-400 bg-emerald-500/10",
  },
  {
    id: "telegram-manager",
    label: "Telegram Manager",
    value: "@XPayments_Manager",
    url: "https://t.me/XPayments_Manager",
    desc: "Suporte direto com o gerente de conta.",
    icon: Send,
    accent: "text-sky-400 bg-sky-500/10",
  },
  {
    id: "telegram-channel",
    label: "Telegram Channel",
    value: "@XPay_Digital",
    url: "https://t.me/XPay_Digital",
    desc: "Novidades, atualizações e avisos oficiais.",
    icon: Send,
    accent: "text-violet-400 bg-violet-500/10",
  },
  {
    id: "telegram-group",
    label: "Telegram Group",
    value: "Comunidade XPayments",
    url: "https://t.me/+U9MLAD55gpNhYjE5",
    desc: "Discuta com outros merchants e a equipe.",
    icon: Users,
    accent: "text-amber-400 bg-amber-500/10",
  },
  {
    id: "discord",
    label: "Discord",
    value: "discord.gg/QjubBwj7Z7",
    url: "https://discord.gg/QjubBwj7Z7",
    desc: "Canal de suporte e comunidade no Discord.",
    icon: LifeBuoy,
    accent: "text-indigo-400 bg-indigo-500/10",
  },
];

const KB_LINKS = [
  { title: "Primeiros passos", desc: "Configure sua conta e receba o primeiro pagamento em 5 minutos." },
  { title: "Guia de Webhooks", desc: "Assine, verifique e trate payloads de eventos." },
  { title: "API Reference", desc: "Documentação completa dos endpoints disponíveis." },
  { title: "Chargebacks e disputas", desc: "Envie evidências e acompanhe prazos." },
];

export default function SupportPage() {
  const t = useT();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.support")}
        description="Entre em contato com a equipe XPayments e acesse recursos."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href="https://wa.me/5562994091930" target="_blank" rel="noreferrer">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </Button>
        }
      />

      {/* Contact cards — real links only */}
      <motion.div {...fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTACT_CHANNELS.map((ch) => (
          <a
            key={ch.id}
            href={ch.url}
            target="_blank"
            rel="noreferrer"
            className="group"
          >
            <Card className="h-full border-border/60 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40 hover:bg-card/80">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", ch.accent)}>
                  <ch.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{ch.label}</p>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-primary">{ch.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{ch.desc}</p>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </motion.div>

      {/* Tickets — Em preparação */}
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-sm font-semibold">Sistema de Tickets</h3>
              <Badge variant="outline" className="border-amber-500/25 bg-amber-500/12 text-amber-400 text-[10px]">Em preparação</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              O sistema de tickets estará disponível em breve. Por enquanto, utilize os canais acima para abrir um chamado.
            </p>
          </div>
        </div>
      </Card>

      {/* Knowledge base placeholder */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Base de conhecimento</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KB_LINKS.map((a) => (
            <Card key={a.title} className="border-border/60 bg-card/60 p-4 backdrop-blur-xl transition hover:border-primary/40">
              <div className="rounded-lg bg-primary/10 p-2 text-primary w-fit">
                <BookOpen className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-medium">{a.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* SLA info */}
      <Card className="border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Tempo de resposta</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              WhatsApp e Telegram: resposta em até 2 horas durante horário comercial (Seg–Sex, 09:00–22:00 UTC).
              Tickets prioritários com impacto em produção são escalonados automaticamente.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
