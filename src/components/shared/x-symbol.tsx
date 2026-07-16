"use client";

import { cn } from "@/lib/utils";

/**
 * Official XPayments logo — circular emblem with black ring, green X, and
 * "XPayments .DIGITAL" text on a dark face.
 *
 * The logo PNG has a transparent background with a black outer ring that
 * integrates naturally with the app's dark theme (#0B1220).
 *
 * Used in the sidebar, topbar, auth branded panel, splash screen, PWA.
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