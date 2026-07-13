"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Query default: suppress errors so they DON'T throw to the error boundary.
 *
 * When a query fails (404, 500, network), TanStack Query puts it in an
 * `isError` state. If we set `throwOnError: true`, the error propagates to
 * the nearest error boundary and crashes the whole page. By keeping
 * `throwOnError: false` (the default), the error stays inside the query —
 * components can render their own ErrorState with a Retry button, and the
 * user can continue navigating the rest of the app.
 *
 * `retry: 1` gives one automatic retry before failing (handles transient
 * network blips). `retryDelay` is exponential backoff.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            refetchOnWindowFocus: false,
            // CRITICAL: do NOT throw to error boundary on query failure.
            // Components handle errors individually with ErrorState + Retry.
            throwOnError: false,
          },
          mutations: {
            throwOnError: false,
          },
        },
      })
  );

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NextThemesProvider>
  );
}
