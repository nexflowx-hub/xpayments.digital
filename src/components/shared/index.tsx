"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";

// ---- AnimatedCounter ----
export function AnimatedCounter({
  value,
  duration = 1.1,
  format,
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });

  React.useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  React.useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = format ? format(v) : Math.round(v).toString();
      }
    });
  }, [spring, format]);

  return <span ref={ref} className={className}>{format ? format(0) : "0"}</span>;
}

// ---- GlowCard ----
export function GlowCard({
  className,
  children,
  glow = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl",
        glow && "glow-blue-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---- GradientBorder wrapper ----
export function GradientBorder({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("gradient-border rounded-xl", className)}>{children}</div>
  );
}

// ---- StatCard ----
export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  format,
  accent = "blue",
  className,
}: {
  label: string;
  value: number;
  change?: number;
  icon?: LucideIcon;
  format?: (n: number) => string;
  accent?: "blue" | "green" | "amber" | "violet" | "rose";
  className?: string;
}) {
  const positive = (change ?? 0) >= 0;
  const accentMap: Record<string, string> = {
    blue: "text-primary bg-primary/10",
    green: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    violet: "text-violet-400 bg-violet-500/10",
    rose: "text-rose-400 bg-rose-500/10",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      <Card className="relative overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <div className={cn("rounded-lg p-1.5", accentMap[accent])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between">
          <AnimatedCounter
            value={value}
            format={format}
            className="text-2xl font-semibold tracking-tight text-foreground"
          />
          {change !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                positive ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ---- PageHeader ----
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        {breadcrumbs && (
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-40">/</span>}
                <span className={cn(!b.href && "text-foreground")}>{b.label}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

// ---- SectionCard ----
export function SectionCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("border-border/60 bg-card/60 backdrop-blur-xl", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </Card>
  );
}

// ---- EmptyState ----
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-14 text-center">
      {Icon && (
        <div className="rounded-xl bg-muted/40 p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ---- Motion presets ----
export const fadeUp: HTMLMotionProps<"div"> = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export const fadeIn: HTMLMotionProps<"div"> = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4 },
};

export const scaleIn: HTMLMotionProps<"div"> = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: "easeOut" },
};

export const MotionDiv = motion.div;

// ---- ErrorState ----
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-12 text-center">
      <div className="rounded-xl bg-rose-500/10 p-3">
        <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-foreground">{message || "Failed to load data"}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90">
          Retry
        </button>
      )}
    </div>
  );
}
