"use client";

import * as React from "react";
import { Check, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  variant = "icon",
  className,
}: {
  variant?: "icon" | "full";
  className?: string;
}) {
  const { locale, setLocale } = useI18n();
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition hover:bg-muted/60 hover:text-foreground",
            className
          )}
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          {variant === "full" && (
            <span className="flex items-center gap-1.5">
              <span className="text-base leading-none">{current.flag}</span>
              <span className="font-medium">{current.native}</span>
            </span>
          )}
          {variant === "icon" && (
            <span className="text-xs font-medium uppercase">{locale}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Language / Idioma / Langue
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code as Locale)}
            className="gap-2"
          >
            <span className="text-base leading-none">{l.flag}</span>
            <span className="flex-1">{l.native}</span>
            {locale === l.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
