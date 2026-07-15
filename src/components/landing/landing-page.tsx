"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUi } from "@/stores/ui";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/utils";
import { APP_NAME, PAYMENT_METHODS } from "@/config";
import { PAYMENT_LOGOS } from "@/components/shared/payment-logos";
import { XSymbol } from "@/components/shared/x-symbol";
import { sdkSnippets } from "@/lib/sdk-snippets";
import {
  AnimatedCounter,
  GlowCard,
  GradientBorder,
} from "@/components/shared";
import { toast } from "sonner";
import {
  Menu,
  X,
  ArrowRight,
  Copy,
  ShieldCheck,
  Globe2,
  Wallet,
  Landmark,
  ShieldAlert,
  ShoppingBag,
  Code2,
  Lock,
  Gauge,
  Webhook,
  Sparkles,
  Github,
  Linkedin,
  Twitter,
  Terminal,
  Activity,
  ArrowUpRight,
  CreditCard,
  RefreshCw,
  LineChart,
  ChevronRight,
  Quote,
  Rocket,
  Plug,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const NAV_LINKS = ["nav.product", "nav.pricing", "nav.developers", "nav.enterprise", "nav.docs"];

const LANGS: { id: keyof typeof sdkSnippets; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "node", label: "Node" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
  { id: "go", label: "Go" },
];

const RESPONSE_JSON = `{
  "id": "pay_2k9Lm3QxA1b7",
  "object": "payment",
  "status": "succeeded",
  "amount": 4200,
  "currency": "EUR",
  "method": "pix",
  "customer": "cus_001",
  "description": "Pro Plan — Annual",
  "created": "2025-01-14T09:32:11Z",
  "risk": { "score": 4, "level": "low" }
}`;

function Reveal({
  children,
  delay = 0,
  className,
  y = 18,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function useCopy() {
  return React.useCallback((text: string, label = "Copied") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => toast.success(label),
        () => toast.error("Copy failed")
      );
    } else {
      toast.error("Clipboard unavailable");
    }
  }, []);
}

// ----------------------------------------------------------------------------
// Brand logo
// ----------------------------------------------------------------------------

function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <XSymbol className="size-8" />
      <span className="text-[17px] font-semibold tracking-tight text-foreground">
        {APP_NAME}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Navigation
// ----------------------------------------------------------------------------

function NavBar() {
  const { setAppView } = useUi();
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <BrandLogo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(l)}
            </a>
          ))}
          <a
            href="/support"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Support
          </a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher variant="full" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAppView("login")}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("common.signin")}
          </Button>
          <Button
            size="sm"
            onClick={() => setAppView("login")}
            className="glow-blue-sm"
          >
            {t("common.signup")}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        <button
          aria-label={t("nav.toggleMenu")}
          className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV_LINKS.map((l) => (
                <a
                  key={l}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                  }}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {t(l)}
                </a>
              ))}
              <Separator className="my-2" />
              <LanguageSwitcher variant="full" className="w-full justify-start" />
              <Button
                variant="ghost"
                onClick={() => setAppView("login")}
                className="justify-start"
              >
                {t("common.signin")}
              </Button>
              <Button onClick={() => setAppView("login")} className="justify-center">
                {t("common.signup")}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ----------------------------------------------------------------------------
// Animated World Map (SVG dotted continents + flowing payment lines)
// ----------------------------------------------------------------------------

type Hub = { id: string; x: number; y: number; label: string };

const HUBS: Hub[] = [
  { id: "ny", x: 175, y: 150, label: "New York" },
  { id: "sp", x: 245, y: 285, label: "São Paulo" },
  { id: "li", x: 392, y: 138, label: "Lisbon" },
  { id: "lo", x: 418, y: 112, label: "London" },
  { id: "be", x: 438, y: 100, label: "Berlin" },
  { id: "du", x: 525, y: 180, label: "Dubai" },
  { id: "sg", x: 615, y: 232, label: "Singapore" },
  { id: "tk", x: 685, y: 148, label: "Tokyo" },
  { id: "sy", x: 700, y: 300, label: "Sydney" },
];

const LINES: [string, string][] = [
  ["ny", "lo"],
  ["ny", "sp"],
  ["sp", "li"],
  ["lo", "du"],
  ["du", "sg"],
  ["sg", "sy"],
  ["lo", "tk"],
  ["tk", "sg"],
  ["li", "be"],
  ["ny", "sg"],
];

const CONTINENTS = [
  { cx: 150, cy: 135, rx: 78, ry: 58 }, // North America
  { cx: 228, cy: 275, rx: 46, ry: 52 }, // South America
  { cx: 420, cy: 110, rx: 50, ry: 32 }, // Europe
  { cx: 432, cy: 215, rx: 52, ry: 64 }, // Africa
  { cx: 565, cy: 155, rx: 95, ry: 56 }, // Asia
  { cx: 662, cy: 295, rx: 42, ry: 26 }, // Oceania
];

function quadPath(a: Hub, b: Hub) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // perpendicular lift for an arc
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const lift = Math.min(70, len * 0.32);
  const cx = mx + (-dy / len) * lift;
  const cy = my + (dx / len) * lift - 12;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

function WorldMap() {
  const dots = React.useMemo(() => {
    const out: { x: number; y: number; strong: boolean }[] = [];
    const step = 16;
    for (let x = 12; x < 800; x += step) {
      for (let y = 12; y < 380; y += step) {
        let strong = false;
        for (const c of CONTINENTS) {
          const u = (x - c.cx) / c.rx;
          const v = (y - c.cy) / c.ry;
          if (u * u + v * v <= 1) {
            strong = true;
            break;
          }
        }
        if (strong) out.push({ x, y, strong: true });
      }
    }
    return out;
  }, []);

  return (
    <svg
      viewBox="0 0 800 380"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <radialGradient id="mapGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="oklch(0.62 0.21 258)" stopOpacity="0.35" />
          <stop offset="60%" stopColor="oklch(0.62 0.21 258)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.62 0.21 258)" stopOpacity="0" />
          <stop offset="50%" stopColor="oklch(0.68 0.19 258)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="oklch(0.62 0.21 258)" stopOpacity="0" />
        </linearGradient>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* background glow */}
      <rect x="0" y="0" width="800" height="380" fill="url(#mapGlow)" />

      {/* dotted continents */}
      <g>
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={1.25}
            fill="oklch(0.78 0.10 258)"
            opacity={0.55}
          />
        ))}
      </g>

      {/* payment lines: static base + animated flowing dashes */}
      <g>
        {LINES.map(([from, to], i) => {
          const a = HUBS.find((h) => h.id === from)!;
          const b = HUBS.find((h) => h.id === to)!;
          const d = quadPath(a, b);
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="oklch(0.62 0.21 258)" strokeWidth={1} opacity={0.18} />
              <path
                d={d}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth={1.6}
                className="animate-dash"
                filter="url(#softGlow)"
              />
            </g>
          );
        })}
      </g>

      {/* hubs */}
      <g>
        {HUBS.map((h) => (
          <g key={h.id}>
            <circle cx={h.x} cy={h.y} r={6} fill="oklch(0.62 0.21 258)" opacity={0.18} />
            <circle cx={h.x} cy={h.y} r={3} fill="oklch(0.78 0.16 258)" filter="url(#softGlow)">
              <animate
                attributeName="opacity"
                values="1;0.4;1"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={h.x} cy={h.y} r={1.4} fill="#fff" />
          </g>
        ))}
      </g>
    </svg>
  );
}

// Floating currency badges around the map
function CurrencyFloats() {
  const items = [
    { sym: "$", x: "20%", y: "32%", delay: 0 },
    { sym: "€", x: "50%", y: "18%", delay: 0.6 },
    { sym: "R$", x: "30%", y: "70%", delay: 1.2 },
    { sym: "₿", x: "76%", y: "60%", delay: 1.8 },
  ];
  return (
    <>
      {items.map((it, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute grid size-9 place-items-center rounded-full border border-primary/40 bg-background/70 text-sm font-semibold text-primary backdrop-blur-md"
          style={{ left: it.x, top: it.y }}
          animate={{ y: [0, -10, 0], opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: it.delay,
          }}
        >
          {it.sym}
        </motion.div>
      ))}
    </>
  );
}

// Live "payment received" toast overlay cycling messages
const LIVE_PAYMENTS = [
  { amount: 4200, currency: "EUR", method: "Pix", from: "Lisbon, PT" },
  { amount: 1299, currency: "USD", method: "Visa", from: "New York, US" },
  { amount: 8900, currency: "BRL", method: "Pix", from: "São Paulo, BR" },
  { amount: 159, currency: "GBP", method: "Apple Pay", from: "London, UK" },
  { amount: 0.012, currency: "BTC", method: "Crypto", from: "Singapore, SG" },
];

function LivePaymentToast() {
  const t = useT();
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % LIVE_PAYMENTS.length), 2600);
    return () => clearInterval(timer);
  }, []);
  const p = LIVE_PAYMENTS[idx];
  return (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute left-4 top-4 z-20 flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 backdrop-blur-xl"
    >
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
      </span>
      <div className="flex flex-col">
        <span className="text-[11px] text-muted-foreground">{t("hero.paymentReceived")}</span>
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(p.amount, p.currency)}{" "}
          <span className="text-muted-foreground">· {p.method}</span>
        </span>
      </div>
      <Separator orientation="vertical" className="h-8" />
      <span className="text-[11px] text-muted-foreground">{p.from}</span>
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// Code block (terminal style) with language tabs + copy
// ----------------------------------------------------------------------------

function CodeBlock({
  autoCycle = false,
  cycleInterval = 3500,
}: {
  autoCycle?: boolean;
  cycleInterval?: number;
}) {
  const [lang, setLang] = React.useState<keyof typeof sdkSnippets>("node");
  const copy = useCopy();

  React.useEffect(() => {
    if (!autoCycle) return;
    const t = setInterval(() => {
      setLang((cur) => {
        const i = LANGS.findIndex((l) => l.id === cur);
        return LANGS[(i + 1) % LANGS.length].id;
      });
    }, cycleInterval);
    return () => clearInterval(t);
  }, [autoCycle, cycleInterval]);

  const code = sdkSnippets[lang];

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-[oklch(0.13_0.012_255)] shadow-2xl">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-rose-500/80" />
          <span className="size-3 rounded-full bg-amber-400/80" />
          <span className="size-3 rounded-full bg-emerald-500/80" />
        </div>
        <span className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Terminal className="size-3.5" />
          create-payment.{lang === "curl" ? "sh" : lang}
        </span>
        <div className="ml-auto">
          <Tabs value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
            <TabsList className="h-8 bg-muted/40 p-0.5">
              {LANGS.map((l) => (
                <TabsTrigger
                  key={l.id}
                  value={l.id}
                  className="h-7 px-2.5 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                >
                  {l.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* code */}
      <div className="relative">
        <pre className="scrollbar-thin max-h-[320px] overflow-auto px-5 py-4 font-mono text-[12.5px] leading-relaxed text-foreground/90">
          <AnimatePresence mode="wait">
            <motion.code
              key={lang}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="block whitespace-pre"
            >
              {code}
            </motion.code>
          </AnimatePresence>
        </pre>
        <button
          onClick={() => copy(code, "Copied to clipboard")}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          <Copy className="size-3.5" />
          Copy
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Section: Hero
// ----------------------------------------------------------------------------

function Hero() {
  const { setAppView } = useUi();
  const t = useT();
  return (
    <section className="relative overflow-hidden">
      {/* ambient backgrounds */}
      <div className="pointer-events-none absolute inset-0 bg-radial-blue" />
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-50" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />

      {/* floating particles */}
      <div className="pointer-events-none absolute inset-0">
        {[
          { l: "12%", t: "30%", s: 6 },
          { l: "82%", t: "22%", s: 4 },
          { l: "68%", t: "70%", s: 5 },
          { l: "28%", t: "72%", s: 4 },
          { l: "45%", t: "16%", s: 3 },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-primary/40 blur-[2px] animate-pulse-glow"
            style={{ left: p.l, top: p.t, width: p.s, height: p.s }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-16 pt-16 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:pb-24 lg:pt-24">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center"
        >
          <Badge
            variant="outline"
            className="mb-5 w-fit gap-1.5 border-primary/30 bg-primary/10 py-1 pl-2 pr-3 text-primary"
          >
            <Sparkles className="size-3.5" />
            <span className="text-xs font-medium">
              {t("hero.badge")}
            </span>
          </Badge>

          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("hero.title")}{" "}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-300 bg-clip-text text-transparent text-glow">
              {t("hero.titleAccent")}
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            {t("hero.subtitle")}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => setAppView("login")}
              className="glow-blue-sm h-11 px-6 text-sm"
            >
              {t("hero.cta1")}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setAppView("login")}
              className="h-11 border-border/70 bg-background/40 px-6 text-sm backdrop-blur"
            >
              {t("hero.cta2")}
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" />
              {t("hero.trust")}
            </span>
          </div>
        </motion.div>

        {/* Right: animated world map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative"
        >
          <GradientBorder className="relative h-[360px] overflow-hidden rounded-2xl bg-card/40 backdrop-blur-xl sm:h-[440px]">
            <div className="absolute inset-0">
              <WorldMap />
            </div>
            <CurrencyFloats />
            <LivePaymentToast />

            {/* corner caption */}
            <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Live payment rail · 47,210 tx/min
            </div>
          </GradientBorder>

          {/* code block below hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-5"
          >
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("hero.codeTitle")}
            </p>
            <CodeBlock autoCycle />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Section: Trust bar (marquee)
// ----------------------------------------------------------------------------

const TRUST_LOGOS = [
  "NIMBUS",
  "QUANTA",
  "VERTEX",
  "HELIX",
  "ORBITAL",
  "MERIDIAN",
];

function TrustBar() {
  const t = useT();
  const row = [...TRUST_LOGOS, ...TRUST_LOGOS];
  return (
    <section className="border-y border-border/40 bg-background/40 py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t("trust.label")}
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
          <div className="flex w-max animate-[xp-marquee_28s_linear_infinite] items-center gap-14">
            {row.map((name, i) => (
              <span
                key={i}
                className="select-none text-xl font-semibold tracking-tight text-muted-foreground/55 transition-colors hover:text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes xp-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Section: Stats
// ----------------------------------------------------------------------------

function StatsBand() {
  const t = useT();
  const stats = [
    {
      value: 18.9,
      labelKey: "stats.processed",
      format: (n: number) => `$${n.toFixed(1)}B`,
    },
    {
      value: 120,
      labelKey: "stats.currencies",
      format: (n: number) => `${formatNumber(n)}+`,
    },
    {
      value: 45,
      labelKey: "stats.countries",
      format: (n: number) => formatNumber(n),
    },
    {
      value: 99.99,
      labelKey: "stats.uptime",
      format: (n: number) => formatPercent(n, 2),
    },
  ];
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/50 bg-border/40 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal
              key={s.labelKey}
              delay={i * 0.08}
              className="bg-background/60 backdrop-blur-xl"
            >
              <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
                <AnimatedCounter
                  value={s.value}
                  format={s.format}
                  className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl"
                />
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                  {t(s.labelKey)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Section: Payment methods
// ----------------------------------------------------------------------------

function PaymentMethods() {
  const t = useT();
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
            Coverage
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("pm.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("pm.subtitle")}
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAYMENT_METHODS.map((m, i) => {
            const Logo = PAYMENT_LOGOS[m.id];
            return (
              <Reveal key={m.id} delay={i * 0.04}>
                <motion.div whileHover={{ y: -4 }} className="h-full">
                  <GlowCard className="group flex h-full items-center gap-4 p-5 transition-colors hover:border-primary/40">
                    <div className="flex h-10 w-16 shrink-0 items-center justify-center">
                      {Logo ? <Logo /> : <span className="text-sm font-medium text-foreground">{m.label}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{m.label}</p>
                      <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                        {t("pm." + m.id.replace("_", ""))}
                      </p>
                    </div>
                  </GlowCard>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Section: Developer
// ----------------------------------------------------------------------------

const DEV_FEATURES = [
  {
    icon: Code2,
    titleKey: "dev.feature1",
    descKey: "dev.feature1d",
  },
  {
    icon: Webhook,
    titleKey: "dev.feature2",
    descKey: "dev.feature2d",
  },
  {
    icon: Plug,
    titleKey: "dev.feature3",
    descKey: "dev.feature3d",
  },
  {
    icon: RefreshCw,
    titleKey: "dev.feature4",
    descKey: "dev.feature4d",
  },
];

function DeveloperSection() {
  const copy = useCopy();
  const t = useT();
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <Reveal className="flex flex-col justify-center">
          <Badge variant="outline" className="mb-4 w-fit border-primary/30 bg-primary/10 text-primary">
            For developers
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("dev.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("dev.subtitle")}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {DEV_FEATURES.map((f) => (
              <div
                key={f.titleKey}
                className="rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-sm"
              >
                <div className="mb-2 grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-[18px]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t(f.titleKey)}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(f.descKey)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Button
              variant="outline"
              onClick={() => copy(sdkSnippets.node, "Install command copied")}
              className="border-border/70 bg-background/40"
            >
              <Code2 className="size-4" />
              npm i @xpayments/node
              <Copy className="size-3.5 opacity-60" />
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Tabs defaultValue="node" className="gap-0">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-[oklch(0.12_0.012_255)] backdrop-blur-xl">
              {/* terminal header */}
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-rose-500/80" />
                  <span className="size-3 rounded-full bg-amber-400/80" />
                  <span className="size-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="ml-2 text-xs text-muted-foreground">
                  payments.create()
                </span>
              </div>

              <TabsList className="m-0 grid w-full grid-cols-5 rounded-none border-b border-border/50 bg-transparent p-0">
                {LANGS.map((l) => (
                  <TabsTrigger
                    key={l.id}
                    value={l.id}
                    className="rounded-none border-b-2 border-transparent py-2.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    {l.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {LANGS.map((l) => (
                <TabsContent key={l.id} value={l.id} className="m-0">
                  <div className="relative">
                    <pre className="scrollbar-thin max-h-[280px] overflow-auto px-5 py-4 font-mono text-[12.5px] leading-relaxed text-foreground/90">
                      <code className="whitespace-pre">{sdkSnippets[l.id]}</code>
                    </pre>
                    <button
                      onClick={() => copy(sdkSnippets[l.id], "Copied to clipboard")}
                      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
                    >
                      <Copy className="size-3.5" />
                      Copy
                    </button>
                  </div>
                </TabsContent>
              ))}

              {/* response */}
              <div className="border-t border-border/50 bg-background/30">
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowUpRight className="size-3.5 text-emerald-400" />
                    200 OK · 142ms
                  </span>
                  <span className="text-[11px] text-muted-foreground">{t("dev.response")}</span>
                </div>
                <pre className="scrollbar-thin overflow-auto px-5 pb-5 font-mono text-[12px] leading-relaxed text-emerald-300/90">
                  <code className="whitespace-pre">{RESPONSE_JSON}</code>
                </pre>
              </div>
            </div>
          </Tabs>
        </Reveal>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Section: Features grid
// ----------------------------------------------------------------------------

const FEATURES = [
  {
    icon: Wallet,
    titleKey: "features.wallets",
    descKey: "features.walletsD",
  },
  {
    icon: Landmark,
    titleKey: "features.treasury",
    descKey: "features.treasuryD",
  },
  {
    icon: ShieldAlert,
    titleKey: "features.risk",
    descKey: "features.riskD",
  },
  {
    icon: ShoppingBag,
    titleKey: "features.commerce",
    descKey: "features.commerceD",
  },
  {
    icon: LineChart,
    titleKey: "features.analytics",
    descKey: "features.analyticsD",
  },
  {
    icon: Code2,
    titleKey: "features.developers",
    descKey: "features.developersD",
  },
];

function FeaturesGrid() {
  const t = useT();
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
            Platform
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("features.subtitle")}
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.titleKey} delay={(i % 3) * 0.06}>
              <GradientBorder className="h-full">
                <motion.div
                  whileHover={{ y: -4 }}
                  className="group flex h-full flex-col rounded-xl bg-card/50 p-6 backdrop-blur-xl"
                >
                  <div className="mb-4 grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-inset ring-primary/20">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {t(f.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(f.descKey)}
                  </p>
                  <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more <ChevronRight className="size-3.5" />
                  </div>
                </motion.div>
              </GradientBorder>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Section: Security
// ----------------------------------------------------------------------------

const SECURITY_PILLARS = [
  {
    icon: CreditCard,
    titleKey: "security.pci",
    descKey: "security.pciD",
  },
  {
    icon: ShieldCheck,
    titleKey: "security.soc",
    descKey: "security.socD",
  },
  {
    icon: Gauge,
    titleKey: "security.uptime",
    descKey: "security.uptimeD",
  },
];

function SecuritySection() {
  const t = useT();
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
            <ShieldCheck className="size-3.5" />
            Trust & compliance
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("security.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("security.subtitle")}
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {SECURITY_PILLARS.map((p, i) => (
            <Reveal key={p.titleKey} delay={i * 0.08}>
              <GlowCard glow className="relative h-full overflow-hidden p-6">
                <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/15 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
                    <p.icon className="size-[22px]" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t(p.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(p.descKey)}
                  </p>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Section: Testimonials
// ----------------------------------------------------------------------------

const TESTIMONIALS = [
  {
    quoteKey: "t1.quote",
    authorKey: "t1.author",
    roleKey: "t1.role",
    initials: "LF",
  },
  {
    quoteKey: "t2.quote",
    authorKey: "t2.author",
    roleKey: "t2.role",
    initials: "CD",
  },
  {
    quoteKey: "t3.quote",
    authorKey: "t3.author",
    roleKey: "t3.role",
    initials: "MB",
  },
];

function Testimonials() {
  const t = useT();
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
            Customers
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("testimonials.title")}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((tm, i) => (
            <Reveal key={tm.authorKey} delay={i * 0.08}>
              <GlowCard className="flex h-full flex-col p-6">
                <Quote className="size-7 text-primary/40" />
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground/90">
                  "{t(tm.quoteKey)}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar className="size-9 ring-1 ring-inset ring-primary/30">
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                      {tm.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t(tm.authorKey)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t(tm.roleKey)}</p>
                  </div>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Section: Final CTA
// ----------------------------------------------------------------------------

function FinalCTA() {
  const { setAppView } = useUi();
  const t = useT();
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <Reveal className="mx-auto max-w-5xl">
        <GradientBorder className="relative overflow-hidden rounded-3xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card/60 to-background/40 px-6 py-14 text-center backdrop-blur-xl sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -top-24 left-1/2 size-[460px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
            <div className="relative">
              <Badge
                variant="outline"
                className="mb-5 border-primary/30 bg-background/40 text-primary backdrop-blur"
              >
                <Rocket className="size-3.5" />
                Get started in minutes
              </Badge>
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
                {t("cta.subtitle")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => setAppView("login")}
                  className="glow-blue h-12 px-8 text-sm"
                >
                  {t("cta.button")}
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setAppView("login")}
                  className="h-12 border-border/70 bg-background/40 px-8 text-sm backdrop-blur"
                >
                  {t("cta.secondary")}
                </Button>
              </div>
            </div>
          </div>
        </GradientBorder>
      </Reveal>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Footer
// ----------------------------------------------------------------------------

type FooterLink = string | { key: string };
const FOOTER_COLS: { titleKey: string; links: FooterLink[] }[] = [
  {
    titleKey: "footer.product",
    links: ["Payments", "Wallets & FX", "Treasury", "Risk Engine", "Commerce", "Analytics"],
  },
  {
    titleKey: "footer.developers",
    links: ["Documentation", "API Reference", "SDKs", "Webhooks", "API Explorer", "Status"],
  },
  {
    titleKey: "footer.company",
    links: ["About", "Customers", "Careers", "Press", "Partners", "Contact"],
  },
  {
    titleKey: "footer.resources",
    links: ["Blog", "Guides", "Help Center", "Community", "Changelog", "Roadmap"],
  },
  {
    titleKey: "footer.legal",
    links: [
      { key: "footer.terms" },
      { key: "footer.privacy" },
      { key: "footer.compliance" },
      { key: "footer.security" },
      "DPA",
      "Licenses",
    ],
  },
];

function Footer() {
  const t = useT();
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-6">
          <div className="col-span-2">
            <BrandLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Twitter, Github, Linkedin, Globe2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="grid size-9 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.titleKey}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {t(col.titleKey)}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l, i) => {
                  const label = typeof l === "string" ? l : t(l.key);
                  return (
                    <li key={i}>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 {APP_NAME}, Inc. {t("footer.rights")}</p>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </span>
            <span className="opacity-30">·</span>
            <span>Made for the global economy</span>
            <span className="opacity-30">·</span>
            <span className="inline-flex items-center gap-1.5">
              {t("footer.language")}
              <LanguageSwitcher variant="full" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1">
        <Hero />
        <TrustBar />
        <StatsBand />
        <PaymentMethods />
        <DeveloperSection />
        <FeaturesGrid />
        <SecuritySection />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
