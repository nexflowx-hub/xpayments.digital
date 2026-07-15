"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Zap, Wallet, ShieldCheck, Code2, Banknote, BarChart3,
  Send, MessageCircle, Mail, Phone, ArrowRight, Sparkles,
} from "lucide-react";
import { CONTACTS, SUPPORT_SERVICES } from "@/config/contacts";
import { useUi } from "@/stores/ui";
import { XSymbol } from "@/components/shared/x-symbol";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Wallet, ShieldCheck, Code2, Banknote, BarChart3,
};

export default function SupportPage() {
  const { setAppView } = useUi();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => window.location.href = "/"} className="flex items-center gap-2.5">
            <XSymbol className="h-8 w-8" />
            <span className="text-lg font-semibold">XPayments</span>
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = "/"}>
              Back to home
            </Button>
            <Button size="sm" onClick={() => setAppView("login")}>
              Sign in
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-radial-blue" />
          <div className="absolute inset-0 bg-grid mask-fade-b opacity-30" />
          <motion.div
            className="absolute left-[20%] top-[10%] h-72 w-72 rounded-full bg-primary/20 blur-3xl"
            animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 text-primary">
                <Sparkles className="mr-1.5 h-3 w-3" /> Support Center
              </Badge>
              <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                How can we <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">help you?</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Get help with payments, wallets, API integration, or talk to our AI assistant.
                Our team is available across multiple channels.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Services */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Our Services</h2>
            <p className="mt-1 text-sm text-muted-foreground">Everything you need to scale payments globally.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUPPORT_SERVICES.map((s, i) => {
              const Icon = ICONS[s.icon] ?? Zap;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full border-border/60 bg-card/60 p-6 backdrop-blur-xl">
                    <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Contact channels */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Contact Us</h2>
            <p className="mt-1 text-sm text-muted-foreground">Reach out through any of these channels.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Telegram */}
            <motion.a
              href={CONTACTS.telegram.channelUrl}
              target="_blank"
              rel="noopener"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="block"
            >
              <Card className="h-full border-border/60 bg-card/60 p-6 backdrop-blur-xl transition hover:border-primary/40">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                  <Send className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold">Telegram</h3>
                <p className="mt-1 text-xs text-muted-foreground">Channel: {CONTACTS.telegram.channel}</p>
                <p className="text-xs text-muted-foreground">Manager: {CONTACTS.telegram.manager}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </Card>
            </motion.a>

            {/* Discord */}
            <motion.a
              href={CONTACTS.discord.url}
              target="_blank"
              rel="noopener"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              whileHover={{ y: -4 }}
              className="block"
            >
              <Card className="h-full border-border/60 bg-card/60 p-6 backdrop-blur-xl transition hover:border-primary/40">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold">Discord</h3>
                <p className="mt-1 text-xs text-muted-foreground">{CONTACTS.discord.label}</p>
                <p className="text-xs text-muted-foreground">Join our community server</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Join <ArrowRight className="h-3 w-3" />
                </span>
              </Card>
            </motion.a>

            {/* WhatsApp */}
            <motion.a
              href={CONTACTS.whatsapp.url}
              target="_blank"
              rel="noopener"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="block"
            >
              <Card className="h-full border-border/60 bg-card/60 p-6 backdrop-blur-xl transition hover:border-primary/40">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold">WhatsApp</h3>
                <p className="mt-1 text-xs text-muted-foreground">{CONTACTS.whatsapp.label}</p>
                <p className="text-xs text-muted-foreground">Direct messaging</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Chat <ArrowRight className="h-3 w-3" />
                </span>
              </Card>
            </motion.a>

            {/* Email */}
            <motion.a
              href={CONTACTS.email.url}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              whileHover={{ y: -4 }}
              className="block"
            >
              <Card className="h-full border-border/60 bg-card/60 p-6 backdrop-blur-xl transition hover:border-primary/40">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold">Email</h3>
                <p className="mt-1 text-xs text-muted-foreground">{CONTACTS.email.address}</p>
                <p className="text-xs text-muted-foreground">Response within 24h</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Send <ArrowRight className="h-3 w-3" />
                </span>
              </Card>
            </motion.a>
          </div>
        </section>

        {/* XpIA Banner */}
        <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="relative overflow-hidden border-primary/30 bg-card/60 p-8 backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-3">
                  <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
                    <Sparkles className="h-6 w-6 text-white" />
                    <div className="absolute inset-0 animate-ping rounded-xl bg-primary/30" style={{ animationDuration: "3s" }} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">Meet XpIA</h3>
                    <p className="text-xs text-muted-foreground">Your AI payments assistant</p>
                  </div>
                </div>
                <p className="max-w-md text-sm text-muted-foreground">
                  Ask about payments, FX, onboarding, API integration and more.
                  XpIA is available 24/7 to help you get started.
                </p>
                <Button size="lg" className="gap-2" onClick={() => window.location.href = "/?view=xpia"}>
                  <Sparkles className="h-4 w-4" /> Chat with XpIA
                </Button>
              </div>
            </Card>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-background/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <XSymbol className="h-6 w-6" />
            <span className="text-sm font-medium">© 2026 XPayments, Inc.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => window.location.href = "/"} className="hover:text-foreground">Home</button>
            <button onClick={() => setAppView("login")} className="hover:text-foreground">Sign in</button>
            <a href={`mailto:${CONTACTS.email.address}`} className="hover:text-foreground">{CONTACTS.email.address}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
