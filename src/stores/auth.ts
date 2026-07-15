"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, RegisterPayload, User, UserRole } from "@/types";
import { auth as authApi } from "@/lib/api/xpApi";
import {
  tokenStore,
  registerLogoutHandler,
  syncAuthState,
  clearAuthState,
  bootstrapAuthStorage,
  AUTH_STORAGE_KEY,
  APP_STORAGE_VERSION,
} from "@/lib/api/client";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrated: boolean;
  sessionChecked: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (data: RegisterPayload) => Promise<User>;
  logout: (opts?: { preservePreferences?: boolean; reason?: string }) => void;
  hydrate: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

/**
 * Auth store v2 — versioned, migrated, with session validation.
 *
 * Storage: xp-auth-v2 (version: 2)
 * Contains ONLY: accessToken, refreshToken, user, isAuthenticated
 * Preferences (locale, theme) are in separate stores and NEVER cleared on logout.
 *
 * Bootstrap flow:
 *   1. bootstrapAuthStorage() loads from localStorage into in-memory cache
 *   2. hydrate() sets hydrated=true, then calls auth/me to validate
 *   3. If token invalid → graceful logout (preserves preferences)
 *   4. sessionChecked=true → page.tsx renders the correct view
 */
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => {
      // Bootstrap in-memory cache from localStorage on first load
      if (typeof window !== "undefined") {
        bootstrapAuthStorage();
      }

      // Wire logout handler — called by interceptor on 401
      if (typeof window !== "undefined") {
        registerLogoutHandler((reason?: string) => {
          // Only clear auth — NEVER touch locale/theme/preferences
          clearAuthState();
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            sessionChecked: true,
          });
        });
      }

      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        hydrated: false,
        sessionChecked: false,

        login: async (email, password, remember = false) => {
          set({ isLoading: true });
          try {
            const session: AuthSession = await authApi.login(email, password, remember);
            syncAuthState(session.accessToken, session.refreshToken, session.user);
            set({
              user: session.user,
              accessToken: session.accessToken,
              refreshToken: session.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              hydrated: true,
              sessionChecked: true,
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
            syncAuthState(session.accessToken, session.refreshToken, session.user);
            set({
              user: session.user,
              accessToken: session.accessToken,
              refreshToken: session.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              hydrated: true,
              sessionChecked: true,
            });
            return session.user;
          } catch (e) {
            set({ isLoading: false });
            throw e;
          }
        },

        logout: (opts?: { preservePreferences?: boolean; reason?: string }) => {
          // Best-effort server logout
          authApi.logout().catch(() => {});
          // Clear auth state ONLY — preservePreferences is always true
          // (locale and theme are in separate stores)
          clearAuthState();
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            sessionChecked: true,
          });
        },

        hydrate: () => {
          // Load from in-memory cache (populated by bootstrapAuthStorage)
          const token = tokenStore.access;
          const user = tokenStore.user as User | null;
          const refreshToken = tokenStore.refresh;

          if (token && user) {
            // We have a token — mark as hydrated, then validate server-side
            set({
              user,
              accessToken: token,
              refreshToken,
              isAuthenticated: true,
              hydrated: true,
              sessionChecked: false, // will be set true after auth/me resolves
            });

            // Validate session server-side
            authApi.me()
              .then((meUser) => {
                if (meUser && tokenStore.access) {
                  syncAuthState(tokenStore.access, tokenStore.refresh ?? "", meUser);
                  set({ user: meUser as User, isAuthenticated: true, sessionChecked: true });
                } else {
                  // me() returned null/empty — treat as unauthenticated
                  clearAuthState();
                  set({ user: null, accessToken: null, isAuthenticated: false, sessionChecked: true });
                }
              })
              .catch(() => {
                // 401 → interceptor already called onLogout → state is clean
                // Just mark session as checked so the UI can proceed
                set({ sessionChecked: true });
              });
          } else {
            // No token — unauthenticated
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              hydrated: true,
              sessionChecked: true,
            });
          }
        },

        hasRole: (...roles) => {
          const u = get().user;
          return !!u && roles.includes(u.role);
        },
      };
    },
    {
      name: AUTH_STORAGE_KEY, // "xp-auth-v2"
      version: 2,
      // Persist ONLY auth fields — never preferences
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
      // Migration: if version < 2, start fresh
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          // Old format — discard, start clean
          return {
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
          };
        }
        return persistedState as Partial<AuthState>;
      },
    }
  )
);
