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
import * as Sentry from '@sentry/react-native'
import { initSentry, useSentryNavigationConfig } from '../utils/sentry';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  })
})

initSentry();

function AppLayout () {
  useSentryNavigationConfig()

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={<LoadingScreen message='Setting up the app...' />}>
        <ActionSheetProvider>
          <ThemeProvider>
            <NotificationProvider>
                  <RootLayout />
                  <Toast config={toastConfig} />
            </NotificationProvider>
          </ThemeProvider>
        </ActionSheetProvider>
      </PersistGate>
    </Provider>
  )
};

export default Sentry.wrap(AppLayout);