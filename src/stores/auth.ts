"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, User, UserRole } from "@/types";
import { xpApi, auth as authApi } from "@/lib/api/xpApi";
import { tokenStore, registerLogoutHandler } from "@/lib/api/client";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  logout: () => void;
  hydrate: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => {
      // wire logout handler so 401 -> forced logout
      if (typeof window !== "undefined") {
        registerLogoutHandler(() => {
          set({ user: null, accessToken: null, isAuthenticated: false });
        });
      }
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        login: async (email, password, remember = false) => {
          set({ isLoading: true });
          try {
            const session: AuthSession = await authApi.login(email, password, remember);
            set({
              user: session.user,
              accessToken: session.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return session.user;
          } catch (e) {
            set({ isLoading: false });
            throw e;
          }
        },
        logout: () => {
          authApi.logout();
          set({ user: null, accessToken: null, isAuthenticated: false });
        },
        hydrate: () => {
          const user = tokenStore.user as User | null;
          const token = tokenStore.access;
          if (user && token) {
            set({ user, accessToken: token, isAuthenticated: true });
          } else {
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
        },
        hasRole: (...roles) => {
          const u = get().user;
          return !!u && roles.includes(u.role);
        },
      };
    },
    {
      name: "xp-auth",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
