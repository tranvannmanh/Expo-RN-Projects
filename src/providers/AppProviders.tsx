import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SQLiteProvider } from 'expo-sqlite';

import { DATABASE_NAME, initializeDatabase } from '@/shared/database/database';

const queryClient = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SQLiteProvider>
  );
}
