import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import AppShell from './_app-shell';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: true,
      networkMode: 'offlineFirst',
    },
    mutations: { retry: 1, networkMode: 'offlineFirst' },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActionSheetProvider>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <AppShell />
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </ActionSheetProvider>
    </QueryClientProvider>
  );
}
