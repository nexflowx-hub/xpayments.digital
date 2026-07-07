"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Locale,
  dictionaries,
  resolveBrowserLocale,
  localeFromTimezone,
} from "./locales";

interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Detect locale from browser language, then timezone, then default en */
  detect: () => void;
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (l) => set({ locale: l }),
      detect: () => {
        if (typeof window === "undefined") return;
        // If the user already chose a locale (persisted), respect it — don't
        // override their explicit choice with browser detection.
        const persisted = localStorage.getItem("xp-locale");
        if (persisted) {
          try {
            const parsed = JSON.parse(persisted);
            if (parsed?.state?.locale) return;
          } catch {}
        }
        const fromLang = resolveBrowserLocale(
          navigator.language || (navigator.languages?.[0] ?? "en")
        );
        const fromTz = localeFromTimezone();
        set({ locale: fromLang !== "en" ? fromLang : fromTz ?? "en" });
      },
    }),
    {
      name: "xp-locale",
      partialize: (s) => ({ locale: s.locale }),
    }
  )
);

/** Translation hook: returns a `t(key)` function bound to the current locale. */
export function useT() {
  const locale = useI18n((s) => s.locale);
  return (key: string): string => {
    const dict = dictionaries[locale] ?? dictionaries.en;
    return dict[key] ?? dictionaries.en[key] ?? key;
  };
}

export function useLocale() {
  return useI18n((s) => s.locale);
}
