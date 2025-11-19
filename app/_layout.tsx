/**
 * App Layout Component
 *
 * Root provider setup for the app.
 * Uses modern state management: Zustand (client) + TanStack Query (server)
 */

import * as Notifications from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import Toast from 'react-native-toast-message';
import TrackPlayer from 'react-native-track-player';

import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext'; // 👈 add this
import { toastConfig } from '../utils/toastConfig';
import { playbackService } from '../constants/playbackService';
import RootLayout from './RootLayout';

// Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// TrackPlayer
TrackPlayer.registerPlaybackService(() => playbackService);

// React Query
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
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

export default function AppLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActionSheetProvider>
        <AuthProvider> {/* 👈 wrap everything that uses useAuth */}
          <ThemeProvider>
            <NotificationProvider>
              <RootLayout />
              <Toast config={toastConfig} />
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </ActionSheetProvider>
    </QueryClientProvider>
  );
}
