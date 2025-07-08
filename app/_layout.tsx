import React from 'react';
import { Provider } from 'react-redux';
import * as Notifications from "expo-notifications"
import { store, persistor } from '../redux/store/store';
import { NotificationProvider } from "../context/NotificationContext"
import RootLayout from './RootLayout'; // Adjust the path as necessary
import { PersistGate } from 'redux-persist/integration/react';
import LoadingScreen from '../components/LoadingScreen';
import { ThemeProvider } from '../context/ThemeContext';
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import Toast from 'react-native-toast-message'
import { toastConfig } from '../utils/toastConfig';
import { AuthProvider } from '../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  })
})

const queryClient = new QueryClient();

function AppLayout () {
  return (
    <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={<LoadingScreen message='Setting up the app...' />}>
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
  )
};

export default AppLayout;