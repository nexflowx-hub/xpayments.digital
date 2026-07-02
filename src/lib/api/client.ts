import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "@/types";
import { API_BASE_URL } from "@/config";

/**
 * XPayments centralized API client.
 *
 * - Axios instance with JWT auth interceptor + automatic refresh on 401.
 * - Typed responses via the `xpApi.*` endpoint modules.
 * - On network failure (the public sandbox cannot reach api.xpayments.digital),
 *   the request transparently falls back to the local mock dataset so the
 *   entire UI remains live. Set NEXT_PUBLIC_USE_MOCK=false to disable.
 */

const USE_MOCK =
  (process.env.NEXT_PUBLIC_USE_MOCK ?? "true") !== "false";

const STORAGE = {
  access: "xp_access_token",
  refresh: "xp_refresh_token",
  user: "xp_user",
};

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE.access);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE.refresh);
  },
  get user() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE.user);
    return raw ? JSON.parse(raw) : null;
  },
  set(access: string, refresh: string, user: unknown) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE.access, access);
    localStorage.setItem(STORAGE.refresh, refresh);
    localStorage.setItem(STORAGE.user, JSON.stringify(user));
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
    localStorage.removeItem(STORAGE.user);
  },
};

let isRefreshing = false;
let onLogout: (() => void) | null = null;
export function registerLogoutHandler(fn: () => void) {
  onLogout = fn;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.access;
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status === 401 &&
      !original._retry &&
      tokenStore.refresh
    ) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken: tokenStore.refresh },
            { headers: { "Content-Type": "application/json" } }
          );
          tokenStore.set(
            data.accessToken,
            data.refreshToken,
            data.user ?? tokenStore.user
          );
          isRefreshing = false;
          original.headers.set("Authorization", `Bearer ${data.accessToken}`);
          return api(original);
        } catch {
          isRefreshing = false;
          tokenStore.clear();
          onLogout?.();
          return Promise.reject(normalizeError(error));
        }
      }
    }
    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED" || err.code === "ERR_NETWORK") {
      return {
        message: "Network error — unreachable endpoint.",
        code: err.code,
        status: 0,
      };
    }
    const data = err.response?.data as
      | { message?: string; error?: string; code?: string }
      | undefined;
    return {
      message: data?.message || data?.error || err.message,
      code: data?.code,
      status: err.response?.status,
    };
  }
  return { message: "Unexpected error", status: 500 };
}

/**
 * Typed request wrapper. Falls back to a mock resolver when the real API
 * is unreachable (or when USE_MOCK=true). The mock resolver receives the
 * config (url, method, data, params) so it can emulate the endpoint.
 */
export async function request<T>(
  config: AxiosRequestConfig,
  mockResolver: () => T | Promise<T>
): Promise<T> {
  if (USE_MOCK) {
    // Simulate latency for realistic loading states
    await new Promise((r) => setTimeout(r, 220 + Math.random() * 280));
    return mockResolver();
  }
  try {
    const res = await api(config);
    return res.data as T;
  } catch (err) {
    const e = normalizeError(err);
    if (e.status === 0) {
      // Network unreachable — graceful fallback to mock
      return mockResolver();
    }
    throw e;
  }
}

export { STORAGE };
