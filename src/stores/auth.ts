"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, RegisterPayload, User, UserRole } from "@/types";
import { xpApi, auth as authApi } from "@/lib/api/xpApi";
import { tokenStore, registerLogoutHandler } from "@/lib/api/client";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (data: RegisterPayload) => Promise<User>;
  logout: () => void;
  hydrate: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

/**
 * Hydrate synchronously from tokenStore at module load so the very first render
 * reflects the real auth state (avoids flash + 401 redirect loops). tokenStore
 * (xp_access_token / xp_user) is the single source of truth — the Zustand
 * persist middleware only caches user/accessToken for convenience, NOT
 * isAuthenticated (which must be re-validated on every load).
 */
function getInitialAuth() {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null, isAuthenticated: false };
  }
  const user = tokenStore.user as User | null;
  const token = tokenStore.access;
  return {
    user: user ?? null,
    accessToken: token ?? null,
    isAuthenticated: !!(user && token),
  };
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => {
      // wire logout handler so 401 -> forced logout (clears state, NO hard
      // redirect — lets React re-render to the landing page cleanly)
      if (typeof window !== "undefined") {
        registerLogoutHandler(() => {
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        });
      }
      const initial = getInitialAuth();
      return {
        user: initial.user,
        accessToken: initial.accessToken,
        isAuthenticated: initial.isAuthenticated,
        isLoading: false,
        login: async (email, password, remember = false) => {
          set({ isLoading: true });
          try {
            const session: AuthSession = await authApi.login(email, password, remember);
            // Persist to tokenStore so the axios request interceptor can read
            // the JWT and inject `Authorization: Bearer <token>` (S2S alignment).
            tokenStore.set(session.accessToken, session.refreshToken, session.user);
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
        register: async (data) => {
          set({ isLoading: true });
          try {
            const session: AuthSession = await authApi.register(data);
            tokenStore.set(session.accessToken, session.refreshToken, session.user);
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
          const next = getInitialAuth();
          set(next);
        },
        hasRole: (...roles) => {
          const u = get().user;
          return !!u && roles.includes(u.role);
        },
      };
    },
    {
      name: "xp-auth",
      // Do NOT persist isAuthenticated — it must be re-validated from
      // tokenStore on every load to prevent stale-session redirect loops.
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
      }),
    }
  )
);
