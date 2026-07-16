"use client";

import { cn } from "@/lib/utils";

/**
 * Official XPayments logo — the gold coin emblem.
 *
 * Used in the sidebar, topbar, auth branded panel, splash screen, PWA.
 * Renders the official logo image.
 */
export function XSymbol({ className, withRing = false }: { className?: string; withRing?: boolean }) {
  return (
    <img
      src="/logo-symbol.svg"
      alt="XPayments"
      className={cn("shrink-0", className)}
      draggable={false}
    />
  );
}