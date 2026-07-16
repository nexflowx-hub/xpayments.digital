"use client";

import { cn } from "@/lib/utils";

/**
 * Official XPayments X symbol — a circular white emblem containing a stylized
 * "X" made of four triangular arms (vibrant blue #0080FF + bright cyan #00C8FF)
 * converging at a central darker-blue diamond (#0066CC).
 *
 * Used in the sidebar, topbar, auth branded panel, splash screen, PWA.
 * Renders transparent so the white circle shows on any background.
 */
export function XSymbol({ className, withRing = false }: { className?: string; withRing?: boolean }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("shrink-0", className)} role="img" aria-label="XPayments">
      <defs>
        <linearGradient id="xp-sym-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0080FF" />
          <stop offset="100%" stopColor="#00C8FF" />
        </linearGradient>
        <radialGradient id="xp-sym-shadow" cx="50%" cy="50%" r="52%">
          <stop offset="78%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
        </radialGradient>
      </defs>
      {/* Circular white emblem */}
      <circle cx="256" cy="256" r="248" fill="#FFFFFF" />
      <circle cx="256" cy="256" r="248" fill="url(#xp-sym-shadow)" />
      {withRing && <circle cx="256" cy="256" r="248" fill="none" stroke="#F0F0F0" strokeWidth="1.5" />}
      {/* X = 4 triangular arms + central diamond */}
      <polygon points="120,120 168,120 256,256 168,256" fill="#0080FF" />
      <polygon points="344,120 392,120 344,256 256,256" fill="#00C8FF" />
      <polygon points="120,392 168,392 168,256 256,256" fill="#00C8FF" />
      <polygon points="344,392 392,392 256,256 344,256" fill="#0080FF" />
      <polygon points="256,224 288,256 256,288 224,256" fill="#0066CC" />
    </svg>
  );
}
