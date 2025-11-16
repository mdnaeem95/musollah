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
import { toastConfig } from '../utils/toastConfig';
import { playbackService } from '../constants/playbackService';
import RootLayout from './RootLayout';

// ============================================================================
// NOTIFICATIONS SETUP
// ============================================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ============================================================================
// TRACKPLAYER SETUP
// ============================================================================

// Register playback service (lazy initialization happens in useTrackPlayerSetup)
TrackPlayer.registerPlaybackService(() => playbackService);

// ============================================================================
// REACT QUERY SETUP
// ============================================================================

/**
 * QueryClient with optimized defaults for offline-first experience
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Caching strategy
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in memory
      
      // Refetching behavior
      refetchOnWindowFocus: false, // Don't refetch on every focus
      refetchOnReconnect: 'always', // Refetch when internet reconnects
      refetchOnMount: true, // Refetch on component mount if stale
      
      // Offline-first
      networkMode: 'offlineFirst', // Use cache first, then network
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

// ============================================================================
// APP LAYOUT
// ============================================================================

export default function AppLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActionSheetProvider>
        <ThemeProvider>
          <NotificationProvider>
            <RootLayout />
            <Toast config={toastConfig} />
          </NotificationProvider>
        </ThemeProvider>
      </ActionSheetProvider>
    </QueryClientProvider>
  );
}