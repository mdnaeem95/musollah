import { Provider } from 'react-redux';
import * as Notifications from 'expo-notifications';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import Toast from 'react-native-toast-message';
import TrackPlayer from 'react-native-track-player';
import { store, persistor } from '../redux/store/store';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { toastConfig } from '../utils/toastConfig';
import { playbackService } from '../constants/playbackService';
import RootLayout from './RootLayout';

// Configure notifications (silent by default)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Register TrackPlayer playback service (lazy initialization)
TrackPlayer.registerPlaybackService(() => playbackService);

// Single QueryClient instance with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
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
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <AuthProvider>
            <ActionSheetProvider>
              <ThemeProvider>
                <NotificationProvider>
                  <RootLayout />
                  <Toast config={toastConfig} />
                </NotificationProvider>
              </ThemeProvider>
            </ActionSheetProvider>
          </AuthProvider>
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  );
}