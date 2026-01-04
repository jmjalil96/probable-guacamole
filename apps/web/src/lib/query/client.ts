import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min before considered stale
      gcTime: 10 * 60 * 1000, // 10 min garbage collection
      retry: (failureCount, error) => {
        // Don't retry client errors (4xx)
        if (isApiError(error) && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Don't spam API on tab focus
    },
    mutations: {
      retry: false, // Never auto-retry mutations
    },
  },
});
