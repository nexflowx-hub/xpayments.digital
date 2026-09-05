"use client";

import * as React from "react";
import { Check, Copy, Printer } from "lucide-react";

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#090d17] shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
          {label ?? "example"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-6 text-slate-200 sm:text-[13px]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
    >
      <Printer className="h-4 w-4" />
      Imprimir / Guardar PDF
    </button>
  );
}
