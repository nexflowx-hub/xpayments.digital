"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, RegisterPayload, User, UserRole } from "@/types";
import { auth as authApi } from "@/lib/api/xpApi";
import {
  XP_STORAGE_KEYS,
  APP_STORAGE_VERSION,
  clearAuthenticationStorage,
  migrateClientStorage,
} from "@/lib/storage/xp-storage";

export type SessionStatus = "hydrating" | "checking" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  authenticated: boolean;
  isLoading: boolean;
  hydrated: boolean;
  sessionChecked: boolean;
  sessionStatus: SessionStatus;
  networkError: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (data: RegisterPayload) => Promise<User>;
  logout: (opts?: { preservePreferences?: boolean; reason?: string }) => void;
  clearSession: (opts?: { preservePreferences?: boolean; reason?: string }) => void;
  hydrate: () => void;
  retrySession: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

// In-memory token cache (synced with persist)
let _memToken: string | null = null;
let _memRefresh: string | null = null;
let _memUser: unknown = null;

export function getMemToken() { return _memToken; }
export function getMemRefresh() { return _memRefresh; }
export function getMemUser() { return _memUser; }
export function setMemAuth(token: string | null, refresh: string | null, user: unknown) {
  _memToken = token; _memRefresh = refresh; _memUser = user;
}

let _onLogout: ((reason?: string) => void) | null = null;
export function registerLogoutHandler(fn: (reason?: string) => void) { _onLogout = fn; }

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => {
      // Bootstrap: migrate + load from localStorage into memory
      if (typeof window !== "undefined") {
        migrateClientStorage();
        try {
          const raw = localStorage.getItem(XP_STORAGE_KEYS.auth);
          if (raw) {
            const parsed = JSON.parse(raw);
            const state = parsed?.state ?? parsed;
            if (state?.accessToken) { _memToken = state.accessToken; _memRefresh = state.refreshToken; _memUser = state.user; }
          }
        } catch { /* ignore */ }
        registerLogoutHandler((reason?: string) => {
          clearAuthenticationStorage();
          _memToken = null; _memRefresh = null; _memUser = null;
          set({ user: null, accessToken: null, refreshToken: null, authenticated: false, isLoading: false, sessionChecked: true, sessionStatus: "unauthenticated", networkError: false });
        });
      }

      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        authenticated: false,
        isLoading: false,
        hydrated: false,
        sessionChecked: false,
        sessionStatus: "hydrating",
        networkError: false,

        login: async (email, password, remember = false) => {
          set({ isLoading: true });
          try {
            const session: AuthSession = await authApi.login(email, password, remember);
            _memToken = session.accessToken; _memRefresh = session.refreshToken; _memUser = session.user;
            set({ user: session.user, accessToken: session.accessToken, refreshToken: session.refreshToken, authenticated: true, isLoading: false, hydrated: true, sessionChecked: true, sessionStatus: "authenticated", networkError: false });
            return session.user;
          } catch (e) { set({ isLoading: false }); throw e; }
        },

        register: async (data) => {
          set({ isLoading: true });
          try {
            const session: AuthSession = await authApi.register(data);
            _memToken = session.accessToken; _memRefresh = session.refreshToken; _memUser = session.user;
            set({ user: session.user, accessToken: session.accessToken, refreshToken: session.refreshToken, authenticated: true, isLoading: false, hydrated: true, sessionChecked: true, sessionStatus: "authenticated", networkError: false });
            return session.user;
          } catch (e) { set({ isLoading: false }); throw e; }
        },

        logout: (opts?: { preservePreferences?: boolean; reason?: string }) => {
          authApi.logout().catch(() => {});
          clearAuthenticationStorage();
          _memToken = null; _memRefresh = null; _memUser = null;
          set({ user: null, accessToken: null, refreshToken: null, authenticated: false, isLoading: false, sessionChecked: true, sessionStatus: "unauthenticated", networkError: false });
        },

        clearSession: (opts?: { preservePreferences?: boolean; reason?: string }) => {
          clearAuthenticationStorage();
          _memToken = null; _memRefresh = null; _memUser = null;
          set({ user: null, accessToken: null, refreshToken: null, authenticated: false, isLoading: false, sessionChecked: true, sessionStatus: "unauthenticated", networkError: false });
        },

        hydrate: () => {
          const token = _memToken;
          const user = _memUser as User | null;
          if (token && user) {
            set({ user, accessToken: token, refreshToken: _memRefresh, authenticated: true, hydrated: true, sessionStatus: "checking", sessionChecked: false });
            // Validate server-side
            authApi.me()
              .then((meUser) => {
                if (meUser) {
                  _memUser = meUser;
                  set({ user: meUser as User, authenticated: true, sessionChecked: true, sessionStatus: "authenticated", networkError: false });
                } else {
                  clearAuthenticationStorage();
                  _memToken = null; _memRefresh = null; _memUser = null;
                  set({ user: null, accessToken: null, authenticated: false, sessionChecked: true, sessionStatus: "unauthenticated" });
                }
              })
              .catch((err: any) => {
                const status = err?.status;
                if (status === 401 || status === 403) {
                  clearAuthenticationStorage();
                  _memToken = null; _memRefresh = null; _memUser = null;
                  set({ user: null, accessToken: null, authenticated: false, sessionChecked: true, sessionStatus: "unauthenticated" });
                } else {
                  // Network error (500, 502, 503, 0) — DON'T clear session
                  set({ sessionChecked: true, sessionStatus: "unauthenticated", networkError: true });
                }
              });
          } else {
            set({ user: null, accessToken: null, refreshToken: null, authenticated: false, hydrated: true, sessionChecked: true, sessionStatus: "unauthenticated", networkError: false });
          }
        },

        retrySession: () => {
          set({ sessionStatus: "checking", sessionChecked: false, networkError: false });
          get().hydrate();
        },

        hasRole: (...roles) => {
          const u = get().user;
          return !!u && roles.includes(u.role);
        },
      };
    },
    {
      name: XP_STORAGE_KEYS.auth,
      version: 2,
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        authenticated: s.authenticated,
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return { accessToken: null, refreshToken: null, user: null, authenticated: false };
        }
        return persistedState as Partial<AuthState>;
      },
    }
  )
);
