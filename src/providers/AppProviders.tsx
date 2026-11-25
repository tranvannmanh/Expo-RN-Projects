import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKeepAwake } from 'expo-keep-awake';

const queryClient = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  // Keeps the screen on while the app is in the foreground; the OS restores
  // normal sleep as soon as the app is backgrounded or closed.
  useKeepAwake();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
