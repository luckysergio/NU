import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Set ke 0 agar selalu dianggap stale untuk real-time
      gcTime: 5 * 60 * 1000, // 5 menit - cache disimpan
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 2,
      retryDelay: 1000,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default QueryProvider;