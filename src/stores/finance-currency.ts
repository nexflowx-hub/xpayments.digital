"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FinanceCurrencyState {
  currency: string;
  setCurrency: (currency: string) => void;
}

export const useFinanceCurrencyStore = create<FinanceCurrencyState>()(
  persist(
    (set) => ({
      currency: "EUR",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "xp-finance-currency" },
  ),
);
