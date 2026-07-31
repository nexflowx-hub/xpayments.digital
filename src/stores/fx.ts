"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DisplayCurrency } from "@/types";

interface FxState {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
}

export const useFxStore = create<FxState>()(
  persist(
    (set) => ({
      displayCurrency: "BRL",
      setDisplayCurrency: (c) => set({ displayCurrency: c }),
    }),
    { name: "xp-display-currency" },
  ),
);
