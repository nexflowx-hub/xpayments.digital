"use client";

import { create } from "zustand";
import type { AppView } from "@/types";

interface UiState {
  appView: AppView;
  activeMerchantView: string;
  activeAdminView: string;
  sidebarOpen: boolean; // mobile
  sidebarCollapsed: boolean; // desktop
  commandOpen: boolean;
  notificationsOpen: boolean;
  setAppView: (v: AppView) => void;
  setMerchantView: (v: string) => void;
  setAdminView: (v: string) => void;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setCommandOpen: (v: boolean) => void;
  setNotificationsOpen: (v: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  appView: "landing",
  activeMerchantView: "dashboard",
  activeAdminView: "admin-dashboard",
  sidebarOpen: false,
  sidebarCollapsed: false,
  commandOpen: false,
  notificationsOpen: false,
  setAppView: (v) => set({ appView: v }),
  setMerchantView: (v) => set({ activeMerchantView: v, sidebarOpen: false }),
  setAdminView: (v) => set({ activeAdminView: v, sidebarOpen: false }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandOpen: (v) => set({ commandOpen: v }),
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
}));
