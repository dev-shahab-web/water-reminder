import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 1,
    },
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      staleTime: 1000 * 30,
    },
  },
});
