import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMobileAds } from '@/hooks/use-mobile-ads';

const queryClient = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  useMobileAds();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
